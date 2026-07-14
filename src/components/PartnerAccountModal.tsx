import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, LogOut } from 'lucide-react';
import { apiDelete, apiPut, apiGet, apiPost } from '../lib/apiClient';

interface PartnerAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  userName: string;
  userPhone: string;
  onLogout: () => void;
  onNameUpdate: (newName: string) => void;
  onSaveExtra?: (newName: string) => Promise<void>;
  portalRole?: string;
  children?: React.ReactNode;
}

export default function PartnerAccountModal({
  isOpen,
  onClose,
  userName,
  userPhone,
  onLogout,
  onNameUpdate,
  onSaveExtra,
  portalRole,
  children
}: PartnerAccountModalProps) {
  const [devices, setDevices] = useState<any[]>([]);
  const currentDeviceId = localStorage.getItem('device_id');
  
  const [editName, setEditName] = useState(userName || '');
  const [initialName, setInitialName] = useState(userName || '');

  useEffect(() => {
    setEditName(userName || '');
    setInitialName(userName || '');
  }, [userName]);

  const fetchDevices = () => {
    apiGet('/api/v1/internal/auth/sessions', { 'X-Calling-Service': portalRole || 'RESTAURANT' })
      .then(res => setDevices(res.data || []))
      .catch(err => console.error('Failed to fetch devices', err));
  };

  useEffect(() => {
    if (isOpen) {
      fetchDevices();
    }
  }, [isOpen]);

  const handleLogout = () => {
    if (onLogout) onLogout();
  };

  const handleRemoveDevice = async (sessionId: string) => {
    try {
      await apiDelete(`/api/v1/internal/auth/sessions/${sessionId}`, { 'X-Calling-Service': portalRole || 'RESTAURANT' });
      fetchDevices();
    } catch (e) {
      console.error('Failed to remove device', e);
    }
  };

  const handleRemoveAllDevices = async () => {
    try {
      await apiDelete(`/api/v1/internal/auth/sessions`, { 'X-Calling-Service': portalRole || 'RESTAURANT' });
      if (onLogout) onLogout();
    } catch (e) {
      console.error('Failed to remove all devices', e);
    }
  };

  const handleSaveName = async () => {
    try {
      await apiPut('/api/v1/users/profile', { name: editName });
      onNameUpdate(editName);
      if (onSaveExtra) {
        await onSaveExtra(editName);
      }
    } catch (e) {
      console.error('Failed to update name', e);
    }
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm cursor-pointer"
          />

          {/* Slide-in Panel */}
          <motion.div
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="relative w-full max-w-md h-full bg-white/70 dark:bg-slate-950/70 backdrop-blur-2xl shadow-2xl border-l border-white/20 dark:border-white/10 flex flex-col"
          >
            <div className="flex-1 overflow-y-auto w-full p-5 flex flex-col space-y-4 bg-transparent">
              <div className="flex items-center gap-3 shrink-0 mb-4">
                <button
                  onClick={onClose}
                  className="p-2 rounded-xl bg-white/40 dark:bg-slate-900/40 backdrop-blur-md border border-rose-500/20 text-slate-500 dark:text-slate-300 hover:text-slate-900 hover:bg-white dark:hover:text-white cursor-pointer transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
                <div>
                  <h4 className="font-bold text-xl text-slate-900 dark:text-[#f0ede6]">Account Settings</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-300">Manage your profile</p>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto overscroll-none pr-1">
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-300">Full Name</label>
                    <input 
                      type="text" 
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      disabled={!!initialName}
                      className={`w-full px-4 py-3 rounded-xl border border-rose-500/20 dark:border-rose-500/30 text-sm font-medium text-slate-900 dark:text-[#f0ede6] ${!!initialName ? 'cursor-not-allowed bg-slate-100 dark:bg-slate-800' : 'bg-slate-50 dark:bg-slate-900'}`}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-300">Phone Number</label>
                    <input 
                      type="tel" 
                      value={userPhone}
                      readOnly
                      className="w-full px-4 py-3 rounded-xl border border-rose-500/20 dark:border-rose-500/30 text-sm font-medium text-slate-900 dark:text-[#f0ede6] cursor-not-allowed bg-slate-100 dark:bg-slate-800"
                    />
                  </div>
                  
                  {children}

                  {!initialName && (
                    <div className="pt-4">
                      <button 
                        onClick={handleSaveName}
                        disabled={!editName.trim()}
                        className={`w-full py-3.5 rounded-xl font-bold shadow-lg transition-all ${
                          !editName.trim() 
                            ? 'bg-slate-300 text-slate-500 cursor-not-allowed dark:bg-slate-800 dark:text-slate-600 shadow-none' 
                            : 'bg-rose-500 text-white shadow-rose-500/20 active:scale-95'
                        }`}
                      >
                        Save Changes
                      </button>
                    </div>
                  )}

                  <div className="pt-6 border-t border-rose-500/10">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="text-sm font-bold text-slate-900 dark:text-[#f0ede6]">Logged-in Devices</h4>
                      {devices.length > 0 && (
                        <button 
                          onClick={handleRemoveAllDevices}
                          className="text-[10px] uppercase font-bold text-rose-500 hover:text-rose-600 transition-colors"
                        >
                          Log out all
                        </button>
                      )}
                    </div>
                    <div className="space-y-2">
                      {devices.map(device => (
                        <div key={device.deviceId} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex justify-between items-center">
                          <div>
                            <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                              {device.deviceModel || 'Unknown Device'}
                              {device.deviceId === currentDeviceId && <span className="ml-2 px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 text-[9px] uppercase">This Device</span>}
                            </p>
                            <p className="text-[10px] text-slate-500 mt-0.5">Last login: {new Date(device.loginTime).toLocaleString()}</p>
                          </div>
                          <button
                            onClick={(e) => { e.preventDefault(); handleRemoveDevice(device.sessionId); }}
                            className="text-xs text-rose-500 hover:text-rose-600 font-bold p-1"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                      {devices.length === 0 && <p className="text-xs text-slate-500">No devices found.</p>}
                    </div>
                  </div>

                  <div className="pt-6">
                    <button 
                      onClick={handleLogout}
                      className="w-full py-3.5 bg-slate-200 dark:bg-slate-800 text-rose-600 dark:text-rose-400 rounded-xl font-bold active:scale-95 transition-all flex items-center justify-center gap-2 hover:bg-slate-300 dark:hover:bg-slate-700"
                    >
                      <LogOut className="w-4 h-4" />
                      Log Out
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
