import React, { createContext, useContext, ReactNode } from 'react';
import { useWebRTC, CallState } from '../hooks/useWebRTC';

interface CallContextType {
  callState: CallState;
  callerId: string | null;
  remoteUserId: string | null;
  remoteStream: MediaStream | null;
  startCall: (targetUserId: string, sessionId: string) => Promise<void>;
  acceptCall: () => Promise<void>;
  declineCall: () => void;
  endCall: () => void;
  toggleMute: () => boolean;
}

const CallContext = createContext<CallContextType | undefined>(undefined);

export const CallProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const rtcState = useWebRTC();
  
  return (
    <CallContext.Provider value={rtcState}>
      {children}
    </CallContext.Provider>
  );
};

export const useCallContext = () => {
  const context = useContext(CallContext);
  if (!context) {
    throw new Error('useCallContext must be used within a CallProvider');
  }
  return context;
};
