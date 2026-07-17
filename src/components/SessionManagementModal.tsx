import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Laptop, Smartphone, Monitor, Trash2, X, AlertTriangle } from 'lucide-react';
import { apiPost } from '../lib/apiClient';

interface Session {
  sessionId: string;
  deviceInfo: string;
  os: string;
  browser: string;
  lastActive: number;
}

interface SessionManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: Session[];
  phone: string;
  otpCode: string;
  serviceName: string;
  onSuccess: (token: string) => void;
  theme?: 'light' | 'dark';
}

export default function SessionManagementModal({ isOpen, onClose, sessions, phone, otpCode, serviceName, onSuccess, theme = 'light' }: SessionManagementModalProps) {
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleRemoveDevice = async (sessionId: string) => {
    setLoadingId(sessionId);
    setError('');
    try {
      const resp = await apiPost(
        `/api/v1/internal/auth/verify?phoneNumber=${encodeURIComponent(phone)}&otp=${encodeURIComponent(otpCode)}&removeSessionId=${encodeURIComponent(sessionId)}`,
        undefined,
        { 'X-Calling-Service': serviceName }
      );
      
      const token = resp?.data || resp;
      if (!token || typeof token !== 'string') {
        throw new Error('No token received from server');
      }
      onSuccess(token);
    } catch (err: any) {
      setError(err.message || 'Failed to remove device and login');
    } finally {
      setLoadingId(null);
    }
  };

  const getDeviceIcon = (os: string) => {
    const lower = os.toLowerCase();
    if (lower.includes('mac') || lower.includes('win') || lower.includes('linux')) return <Monitor className="w-5 h-5 text-indigo-500" />;
    return <Smartphone className="w-5 h-5 text-emerald-500" />;
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className={`relative w-full max-w-lg overflow-hidden rounded-3xl border shadow-2xl ${
            theme === 'dark' ? 'bg-slate-900 border-rose-500/30' : 'bg-white border-slate-200'
          }`}
        >
          <div className="p-6">
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-red-500/10 rounded-2xl">
                  <AlertTriangle className="w-6 h-6 text-red-500" />
                </div>
                <div>
                  <h3 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                    Session Limit Reached
                  </h3>
                  <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                    You are already logged in on 2 devices. To continue, please log out of an existing device.
                  </p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className={`p-2 rounded-xl transition-colors ${theme === 'dark' ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-500'}`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm">
                {error}
              </div>
            )}

            <div className="space-y-3">
              {sessions.map((session, idx) => (
                <div 
                  key={session.sessionId}
                  className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${
                    theme === 'dark' ? 'bg-slate-800/20 border-slate-700 hover:border-slate-600' : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-2.5 rounded-xl ${theme === 'dark' ? 'bg-slate-700' : 'bg-white shadow-sm'}`}>
                      {getDeviceIcon(session.os)}
                    </div>
                    <div>
                      <p className={`font-bold text-sm ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
                        {session.os} &bull; {session.browser}
                      </p>
                      <p className={`text-xs mt-0.5 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                        Last active: {new Date(session.lastActive).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => handleRemoveDevice(session.sessionId)}
                    disabled={loadingId !== null}
                    className="p-2 text-red-500 hover:bg-red-500/10 rounded-xl transition-colors flex items-center justify-center cursor-pointer"
                    title="Log out from this device"
                  >
                    {loadingId === session.sessionId ? (
                      <div className="w-5 h-5 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Trash2 className="w-5 h-5" />
                    )}
                  </button>
                </div>
              ))}
            </div>
            
            <div className="mt-6 text-center">
              <p className={`text-xs ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>
                Logging out of a device will immediately invalidate its active session.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
