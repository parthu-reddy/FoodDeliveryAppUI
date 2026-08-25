import { useCallContext } from "@/contexts/CallContext";
import { Mic, MicOff, PhoneCall, PhoneOff } from 'lucide-react';
import React, { useEffect, useRef } from 'react';

export const CallOverlay: React.FC = () => {
  const { 
    callState, 
    callEndReason,
    remoteStream, 
    acceptCall, 
    declineCall, 
    endCall, 
    toggleMute 
  } = useCallContext();
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const ringingAudioRef = useRef<HTMLAudioElement>(null);
  const dialingAudioRef = useRef<HTMLAudioElement>(null);
  const busyAudioRef = useRef<HTMLAudioElement>(null);
  const [isMuted, setIsMuted] = React.useState(false);
  const [showBusy, setShowBusy] = React.useState(false);

  // Manage Ringtones and Dialing Tones
  useEffect(() => {
    if (callState === 'RINGING' && ringingAudioRef.current) {
      ringingAudioRef.current.play().catch(e => console.error("Ringing audio blocked", e));
    } else if (ringingAudioRef.current) {
      ringingAudioRef.current.pause();
      ringingAudioRef.current.currentTime = 0;
    }

    if (callState === 'CALLING' && dialingAudioRef.current) {
      dialingAudioRef.current.play().catch(e => console.error("Dialing audio blocked", e));
    } else if (dialingAudioRef.current) {
      dialingAudioRef.current.pause();
      dialingAudioRef.current.currentTime = 0;
    }
  }, [callState]);

  // Manage Busy Tone and temporary display
  useEffect(() => {
    if (callState === 'IDLE' && callEndReason === 'DECLINED') {
      setShowBusy(true);
      if (busyAudioRef.current) {
        busyAudioRef.current.play().catch(e => console.error("Busy audio blocked", e));
      }
      const timeout = setTimeout(() => {
        setShowBusy(false);
      }, 3000);
      return () => clearTimeout(timeout);
    } else if (callState !== 'IDLE') {
      setShowBusy(false);
      if (busyAudioRef.current) {
         busyAudioRef.current.pause();
         busyAudioRef.current.currentTime = 0;
      }
    }
  }, [callState, callEndReason]);

  useEffect(() => {
    if (callState === 'CONNECTED' && audioRef.current && remoteStream) {
      audioRef.current.srcObject = remoteStream;
      audioRef.current.play().catch(e => console.error("Error playing audio", e));
    }
  }, [callState, remoteStream]);

  return (
    <>
      {/* Hidden Audio Element ALWAYS rendered for Safari autoplay policy */}
      <audio ref={audioRef} autoPlay playsInline className="hidden" />
      
      {/* Audio elements for different call states */}
      <audio ref={ringingAudioRef} loop src="/sounds/phone_ringing.wav" className="hidden" preload="auto" />
      <audio ref={dialingAudioRef} loop src="/sounds/dial_tone.wav" className="hidden" preload="auto" />
      <audio ref={busyAudioRef} src="/sounds/beep_short.wav" className="hidden" preload="auto" />

      {(callState !== 'IDLE' || showBusy) && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 flex flex-col items-center shadow-2xl w-80 max-w-[calc(100vw-2rem)] animate-in zoom-in-95 duration-200">
            
            {/* Avatar Placeholder */}
            <div className="w-24 h-24 bg-rose-100 dark:bg-rose-900/50 rounded-full flex items-center justify-center mb-6">
              <PhoneCall className={`w-10 h-10 text-rose-500 ${callState === 'RINGING' || callState === 'CALLING' ? 'animate-pulse' : ''}`} />
            </div>

            {/* Status Text */}
            <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-2">
              {showBusy ? 'Call Declined' :
               callState === 'CALLING' ? 'Calling...' : 
               callState === 'RINGING' ? 'Incoming Call' : 
               'In Call'}
            </h2>
            
            <p className="text-slate-500 dark:text-slate-400 mb-8 text-center truncate w-full text-sm">
              {showBusy ? 'User is busy or declined the call' : 
               callState === 'CALLING' ? 'Waiting for response...' : 
               callState === 'RINGING' ? 'Connecting...' : 
               'Voice Connection'}
            </p>

            {/* Controls */}
            <div className="flex items-center gap-6">
              
              {callState === 'RINGING' && (
                <>
                  <button 
                    onClick={() => declineCall()}
                    className="w-14 h-14 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-105 active:scale-95 text-white"
                  >
                    <PhoneOff className="w-6 h-6" />
                  </button>
                  
                  <button 
                    onClick={() => {
                      acceptCall();
                      if (audioRef.current && remoteStream) {
                        audioRef.current.srcObject = remoteStream;
                        audioRef.current.play().catch(e => console.error("Error playing audio on accept:", e));
                      }
                    }}
                    className="w-14 h-14 bg-green-500 hover:bg-green-600 rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-105 active:scale-95 text-white animate-bounce"
                  >
                    <PhoneCall className="w-6 h-6" />
                  </button>
                </>
              )}

              {(callState === 'CALLING' || callState === 'CONNECTED') && (
                <>
                  <button 
                    onClick={() => {
                      const muted = toggleMute();
                      setIsMuted(muted);
                    }}
                    className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-105 active:scale-95 ${isMuted ? 'bg-slate-200 text-slate-500 dark:bg-slate-700 dark:text-slate-400' : 'bg-slate-100 text-slate-800 dark:bg-slate-600 dark:text-white'}`}
                  >
                    {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                  </button>
                  
                  <button 
                    onClick={() => endCall()}
                    className="w-14 h-14 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-105 active:scale-95 text-white"
                  >
                    <PhoneOff className="w-6 h-6" />
                  </button>
                </>
              )}
              
            </div>
          </div>
        </div>
      )}
    </>
  );
};
