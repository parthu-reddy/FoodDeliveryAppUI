import { useState, useEffect, useRef, useCallback } from 'react';
import { Client, IMessage } from '@stomp/stompjs';
import { getToken, getUserProfile } from '../lib/tokenStore';
import { identityApi, chatApi } from '../lib/zodiosClients';
import { saveChunk, getChunks, savePendingUpload, getPendingUploads, clearSessionData, cleanOrphanedChunks } from '../lib/offlineStorage';

export interface WebRtcSignal {
  sessionId?: string;
  senderId?: string;
  targetUserId: string;
  type: 'OFFER' | 'ANSWER' | 'CANDIDATE' | 'HANGUP';
  sdp?: string;
  candidate?: string;
  sdpMid?: string;
  sdpMLineIndex?: number;
}

export type CallState = 'IDLE' | 'CALLING' | 'RINGING' | 'CONNECTED';
export type CallEndReason = 'DECLINED' | 'TIMEOUT' | 'ENDED' | 'MISSED' | null;

export const useWebRTC = () => {
  const token = getToken();
  const user = getUserProfile();
  
  const [callState, _setCallState] = useState<CallState>('IDLE');
  const [callerId, _setCallerId] = useState<string | null>(null);
  const [remoteUserId, _setRemoteUserId] = useState<string | null>(null);
  const [activeSessionId, _setActiveSessionId] = useState<string | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [callEndReason, setCallEndReason] = useState<CallEndReason>(null);

  // Refs for stale closures inside STOMP callbacks
  const callStateRef = useRef<CallState>(callState);
  const remoteUserIdRef = useRef<string | null>(remoteUserId);
  const activeSessionIdRef = useRef<string | null>(activeSessionId);
  const isCallerRef = useRef<boolean>(false);

  // Recording Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunkOrderRef = useRef<number>(0);

  // Buffer for ICE candidates received before remote description is set
  const pendingCandidatesRef = useRef<RTCIceCandidateInit[]>([]);
  
  // Timeout for unanswered calls
  const callTimeoutRef = useRef<number | null>(null);

  const setCallState = useCallback((state: CallState) => {
    callStateRef.current = state;
    _setCallState(state);
  }, []);

  const setRemoteUserId = useCallback((id: string | null) => {
    remoteUserIdRef.current = id;
    _setRemoteUserId(id);
  }, []);

  const setCallEndReasonCallback = useCallback((reason: CallEndReason) => {
    setCallEndReason(reason);
  }, []);

  const setActiveSessionId = useCallback((id: string | null) => {
    activeSessionIdRef.current = id;
    _setActiveSessionId(id);
  }, []);

  const setCallerId = useCallback((id: string | null) => {
    _setCallerId(id);
  }, []);
  const localStreamRef = useRef<MediaStream | null>(null);
  
  // Create a ref for the STOMP client so it persists across renders
  const stompClientRef = useRef<Client | null>(null);
  
  // RTCPeerConnection ref
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);

  const iceServersRef = useRef<RTCConfiguration>({
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' }
    ]
  });

  // Fetch TURN credentials
  useEffect(() => {
    const fetchIceServers = async () => {
      try {
                const response = await chatApi.turnCredential.get('/api/v1/chat/webrtc/ice-servers', undefined as unknown as Parameters<typeof chatApi.turnCredential.get>[1]);
                if (response && (response).iceServers) {
                    iceServersRef.current = { iceServers: (response).iceServers };
        }
      } catch (error) {
        console.error("Failed to fetch ICE servers, falling back to STUN", error);
      }
    };
    
    if (token) {
      fetchIceServers();
    }
  }, [token]);

  // 1. Setup Global STOMP Connection for signaling
  useEffect(() => {
    if (!token || !user) return;

    if (stompClientRef.current?.active) {
      return;
    }

    const client = new Client({
      brokerURL: `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws/chat?token=${token}`,
      connectHeaders: {
        Authorization: `Bearer ${token}`
      },
      reconnectDelay: 5000,
    });

    client.onConnect = () => {
      client.subscribe('/user/queue/webrtc', async (message: IMessage) => {
        if (!message.body) return;
        const signal: WebRtcSignal = JSON.parse(message.body);
        await handleIncomingSignal(signal);
      });
    };

    client.activate();
    stompClientRef.current = client;

    return () => {
      client.deactivate();
      stompClientRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // Handle incoming STOMP messages
  const handleIncomingSignal = async (signal: WebRtcSignal) => {
    if (!signal.senderId) return;
    if (signal.senderId === user?.id) return; // Ignore signals from ourselves
    
    switch (signal.type) {
      case 'OFFER':
        if (callStateRef.current !== 'IDLE') {
          // If already in a call, reject it with HANGUP
          sendSignal({ targetUserId: signal.senderId, type: 'HANGUP', sessionId: signal.sessionId });
          return;
        }
        isCallerRef.current = false;
        setCallerId(signal.senderId);
        setRemoteUserId(signal.senderId);
        setActiveSessionId(signal.sessionId || null);
        setCallEndReasonCallback(null);
        setCallState('RINGING');
        
        startCallTimeout();
        
        const pcOffer = await initializePeerConnection(signal.senderId, signal.sessionId);
        if (!pcOffer) {
            declineCall();
            return;
        }

        if (signal.sdp) {
          await pcOffer.setRemoteDescription(new RTCSessionDescription({
            type: 'offer',
            sdp: signal.sdp
          }));
          processPendingCandidates();
        }
        break;

      case 'ANSWER':
        if (signal.sdp && peerConnectionRef.current) {
          clearCallTimeout();
          await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription({
            type: 'answer',
            sdp: signal.sdp
          }));
          processPendingCandidates();
        }
        break;

      case 'CANDIDATE':
        if (signal.candidate && peerConnectionRef.current) {
          const candidateInit = {
            candidate: signal.candidate,
            sdpMid: signal.sdpMid,
            sdpMLineIndex: signal.sdpMLineIndex
          };
          if (peerConnectionRef.current.remoteDescription) {
            await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidateInit));
          } else {
            pendingCandidatesRef.current.push(candidateInit);
          }
        }
        break;

      case 'HANGUP':
        if (callStateRef.current === 'CALLING') {
           setCallEndReasonCallback('DECLINED');
        } else if (callStateRef.current === 'RINGING') {
           setCallEndReasonCallback('MISSED');
        } else if (callStateRef.current === 'CONNECTED') {
           setCallEndReasonCallback('ENDED');
        }
        cleanupCall();
        break;
    }
  };

  // 2. Cleanup call if user logs out
  useEffect(() => {
    if (!token) {
      cleanupCall();
    }
  }, [token]);

  const processPendingCandidates = async () => {
    if (!peerConnectionRef.current) return;
    for (const candidate of pendingCandidatesRef.current) {
      try {
        await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (e) {
        console.error("Error adding pending ice candidate", e);
      }
    }
    pendingCandidatesRef.current = [];
  };

  const startCallTimeout = () => {
    clearCallTimeout();
    callTimeoutRef.current = window.setTimeout(() => {
      setCallEndReasonCallback('TIMEOUT');
      endCall();
    }, 30000);
  };

  const clearCallTimeout = () => {
    if (callTimeoutRef.current) {
      clearTimeout(callTimeoutRef.current);
      callTimeoutRef.current = null;
    }
  };

  const sendSignal = (signal: WebRtcSignal) => {
    if (stompClientRef.current && stompClientRef.current.connected) {
      stompClientRef.current.publish({
        destination: `/app/webrtc.signal/${signal.targetUserId}`,
        body: JSON.stringify(signal)
      });
    }
  };

  const startRecording = (localMediaStream: MediaStream, remoteMediaStream: MediaStream) => {
    try {
      // @ts-ignore
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      const audioContext = new AudioContext();
      const dest = audioContext.createMediaStreamDestination();

      const localSource = audioContext.createMediaStreamSource(localMediaStream);
      const remoteSource = audioContext.createMediaStreamSource(remoteMediaStream);

      localSource.connect(dest);
      remoteSource.connect(dest);

      const mixedStream = dest.stream;
      
      // Compress audio by setting a low bitrate suitable for voice (16 kbps)
      let options: MediaRecorderOptions = { audioBitsPerSecond: 16000 };
      if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
        options.mimeType = 'audio/webm;codecs=opus';
      } else if (MediaRecorder.isTypeSupported('audio/webm')) {
        options.mimeType = 'audio/webm';
      } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
        options.mimeType = 'audio/mp4';
      }
      
      const mediaRecorder = new MediaRecorder(mixedStream, options);

      mediaRecorder.ondataavailable = async (event) => {
        if (event.data && event.data.size > 0 && activeSessionIdRef.current) {
          const order = chunkOrderRef.current++;
          try {
            await saveChunk(activeSessionIdRef.current, event.data, order);
          } catch (e) {
            console.error("Failed to save audio chunk to indexedDB:", e);
          }
        }
      };

      mediaRecorder.start(1000); // collect chunks every second
      mediaRecorderRef.current = mediaRecorder;
      console.log("Call recording started successfully.");
    } catch (err) {
      console.error("Failed to start recording:", err);
    }
  };

  const uploadRecording = async (sessionId: string) => {
    try {
      const chunks = await getChunks(sessionId);
      if (chunks.length === 0) return;
      
      const mimeType = mediaRecorderRef.current?.mimeType || 'audio/webm';
      const extension = mimeType.includes('mp4') ? 'mp4' : 'webm';
      
      const blob = new Blob(chunks, { type: mimeType });
      const file = new File([blob], `recording.${extension}`, { type: mimeType });
      
      const formData = new FormData();
      formData.append('file', file);
      
      // Save as pending first
      if (token) {
        await savePendingUpload({
          sessionId,
          status: 'pending',
          mimeType,
          token,
          timestamp: Date.now()
        });
      }

            await chatApi.chatAudioUpload.post('/api/v1/chat/sessions/:sessionId/upload-audio', formData as unknown as Parameters<typeof chatApi.chatAudioUpload.post>[1], { params: { sessionId } } as unknown as { params: { sessionId: string } });
      console.log("Audio recording uploaded successfully.");
      
      // Clear local storage if successful
      await clearSessionData(sessionId);
    } catch (e) {
      console.error("Failed to upload audio recording, will retry when online:", e);
    } finally {
      chunkOrderRef.current = 0;
    }
  };

  // Background Sync for offline uploads
  useEffect(() => {
    const syncOfflineUploads = async () => {
      if (!navigator.onLine) return;
      
      try {
        const pending = await getPendingUploads();
        for (const upload of pending) {
          try {
            const chunks = await getChunks(upload.sessionId);
            if (chunks.length === 0) {
              await clearSessionData(upload.sessionId);
              continue;
            }
            
            const extension = upload.mimeType.includes('mp4') ? 'mp4' : 'webm';
            const blob = new Blob(chunks, { type: upload.mimeType });
            const file = new File([blob], `recording.${extension}`, { type: upload.mimeType });
            
            const formData = new FormData();
            formData.append('file', file);
            
            // Attempt to get a fresh token in case the stored one expired
            const freshToken = getToken();
            const uploadToken = freshToken || upload.token;
            
            const response = await fetch(`/api/v1/chat/sessions/${upload.sessionId}/upload-audio`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${uploadToken}`
              },
              body: formData
            });
            
            if (response.ok) {
              console.log(`Synced offline recording for session ${upload.sessionId}`);
              await clearSessionData(upload.sessionId);
            } else if (response.status === 401 || response.status === 403) {
              console.error(`Authentication failed for offline recording sync ${upload.sessionId}. Dropping upload.`);
              await clearSessionData(upload.sessionId);
            }
          } catch (e) {
            console.error(`Failed to sync recording for session ${upload.sessionId}`, e);
          }
        }
      } catch (e) {
        console.error("Failed to process pending offline uploads:", e);
      }
    };

    window.addEventListener('online', syncOfflineUploads);
    syncOfflineUploads(); // Try on mount
    
    // Clean up any orphaned chunks left behind by browser crashes
    cleanOrphanedChunks(activeSessionIdRef.current).catch(e => console.error("Failed to clean orphaned chunks", e));

    return () => window.removeEventListener('online', syncOfflineUploads);
  }, []);

  const initializePeerConnection = async (targetUserId: string, sessionId?: string) => {
    const pc = new RTCPeerConnection(iceServersRef.current);
    
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        sendSignal({
          sessionId,
          targetUserId,
          type: 'CANDIDATE',
          candidate: event.candidate.candidate,
          sdpMid: event.candidate.sdpMid || undefined,
          sdpMLineIndex: event.candidate.sdpMLineIndex !== null ? event.candidate.sdpMLineIndex : undefined
        });
      }
    };

    pc.ontrack = (event) => {
      const incomingStream = event.streams[0];
      setRemoteStream(incomingStream);
      
      if (isCallerRef.current) {
        setCallState('CONNECTED');
        clearCallTimeout();

        // Only the caller records to prevent duplicate uploads
        if (localStreamRef.current) {
           startRecording(localStreamRef.current, incomingStream);
        }
      }
    };

    pc.oniceconnectionstatechange = () => {
      if (pc.iceConnectionState === 'disconnected' || pc.iceConnectionState === 'failed' || pc.iceConnectionState === 'closed') {
        console.log("ICE Connection State changed to", pc.iceConnectionState);
        cleanupCall();
      }
    };

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert("Your browser blocks microphone access on insecure connections (HTTP). Please access this site via HTTPS or localhost to make calls.");
        throw new Error("Media devices API not available. HTTPS is required.");
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      localStreamRef.current = stream;
      stream.getTracks().forEach(track => pc.addTrack(track, stream));
    } catch (err) {
      console.error('Error accessing microphone:', err);
      if (err instanceof Error && err.name !== 'Error') {
         alert("Could not access microphone: " + err.message);
      }
      pc.close();
      return null;
    }

    peerConnectionRef.current = pc;
    pendingCandidatesRef.current = [];
    return pc;
  };

  const startCall = async (targetUserId: string, sessionId: string) => {
    if (callStateRef.current !== 'IDLE') return;
    
    isCallerRef.current = true;
    setRemoteUserId(targetUserId);
    setActiveSessionId(sessionId);
    setCallEndReasonCallback(null);
    setCallState('CALLING');
    startCallTimeout();
    
    const pc = await initializePeerConnection(targetUserId, sessionId);
    if (!pc) {
      cleanupCall();
      return;
    }
    
    try {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      
      sendSignal({
        sessionId,
        targetUserId,
        type: 'OFFER',
        sdp: offer.sdp
      });
    } catch (error) {
      console.error('Error creating offer', error);
      cleanupCall();
    }
  };

  const acceptCall = async () => {
    if (!remoteUserIdRef.current || !peerConnectionRef.current) return;
    clearCallTimeout();
    setCallState('CONNECTED');
    
    try {
      const answer = await peerConnectionRef.current.createAnswer();
      await peerConnectionRef.current.setLocalDescription(answer);
      
      sendSignal({
        sessionId: activeSessionIdRef.current || undefined,
        targetUserId: remoteUserIdRef.current,
        type: 'ANSWER',
        sdp: answer.sdp
      });
    } catch (error) {
      console.error('Error creating answer', error);
      cleanupCall();
    }
  };

  const declineCall = () => {
    if (remoteUserIdRef.current) {
      sendSignal({
        sessionId: activeSessionIdRef.current || undefined,
        targetUserId: remoteUserIdRef.current,
        type: 'HANGUP'
      });
    }
    setCallEndReasonCallback('DECLINED');
    cleanupCall();
  };

  const endCall = () => {
    if (remoteUserIdRef.current) {
      sendSignal({
        sessionId: activeSessionIdRef.current || undefined,
        targetUserId: remoteUserIdRef.current,
        type: 'HANGUP'
      });
    }
    if (callStateRef.current === 'CALLING' || callStateRef.current === 'RINGING') {
      setCallEndReasonCallback('MISSED');
    } else {
      setCallEndReasonCallback('ENDED');
    }
    cleanupCall();
  };

  const cleanupCall = () => {
    clearCallTimeout();
    
    // Stop recording and upload
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      if (activeSessionIdRef.current) {
         const sessionIdToUpload = activeSessionIdRef.current;
         // Upload asynchronously
         setTimeout(() => uploadRecording(sessionIdToUpload), 500);
      }
    }

    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }
    pendingCandidatesRef.current = [];
    setRemoteStream(null);
    setCallState('IDLE');
    setCallerId(null);
    setRemoteUserId(null);
    setActiveSessionId(null);
    // Note: Do not reset isCallerRef here so the UI can check it after the call ends.
    // It gets properly initialized in startCall and handleIncomingSignal.
  };
  
  const toggleMute = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      return !localStreamRef.current.getAudioTracks()[0].enabled;
    }
    return false;
  };

  return {
    callState,
    callEndReason,
    isCaller: isCallerRef.current,
    callerId,
    remoteUserId,
    remoteStream,
    startCall,
    acceptCall,
    declineCall,
    endCall,
    toggleMute
  };
};
