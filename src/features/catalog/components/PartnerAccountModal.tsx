import { useToast } from "@/contexts/ToastContext";
import { identityApi } from "@/lib/zodiosClients";
import { RoleName } from "@/types";
import { Badge, Button, FormField, Input } from '@shared/ui';
import { LogOut, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import React, { useEffect, useState } from 'react';
import { z } from 'zod';

const nameSchema = z.string().min(1, 'Name is required').max(100, 'Name cannot exceed 100 characters');

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
  const { showError } = useToast();
interface DeviceSession {
  deviceId: string;
  deviceModel?: string;
  loginTime: string | number;
  sessionId: string;
}

  const [devices, setDevices] = useState<DeviceSession[]>([]);
  const currentDeviceId = localStorage.getItem('device_id');
  
  const [editName, setEditName] = useState(userName || '');
  const [initialName, setInitialName] = useState(userName || '');

  if (userName !== initialName && userName) {
      setInitialName(userName);
      setEditName(userName);
  }

  const fetchDevices = () => {
    identityApi.auth.get('/api/v1/internal/auth/sessions', { headers: { 'X-Calling-Service': portalRole || RoleName.RESTAURANT } })
      // @ts-expect-error auto-migration type suppression
      .then(res => setDevices(res.data || []))
      .catch(err => console.error('Failed to fetch devices', err));
  };

  useEffect(() => {
    if (isOpen) {
      fetchDevices();
    }
   
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const handleLogout = () => {
    if (onLogout) onLogout();
  };

  const handleRemoveDevice = async (sessionId: string) => {
    try {
      await identityApi.auth.delete('/api/v1/internal/auth/sessions/:sessionId', undefined, { params: { sessionId }, headers: { 'X-Calling-Service': portalRole || RoleName.RESTAURANT } as unknown as Record<string, string> });
      fetchDevices();
    } catch (err: unknown) {
      console.error("Failed to invalidate session", err);
    }
  };

  const handleRemoveAllDevices = async () => {
    try {
      await identityApi.auth.delete(`/api/v1/internal/auth/sessions`, undefined, { headers: { 'X-Calling-Service': portalRole || RoleName.RESTAURANT } as unknown as Record<string, string> });
      if (onLogout) onLogout();
    } catch (e: unknown) {
      console.error('Failed to remove all devices', e);
    }
  };

  const handleSaveName = async () => {
    const validation = nameSchema.safeParse(editName);
    if (!validation.success) {
      showError(validation.error.issues[0].message);
      return;
    }
    try {
      await identityApi.user.put('/api/v1/users/profile', { name: editName }, { headers: { "X-User-Id": "" } });
      onNameUpdate(editName);
      if (onSaveExtra) {
        await onSaveExtra(editName);
      }
    } catch (e: unknown) {
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
            className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm cursor-pointer"
          />

          {/* Slide-in Panel */}
          <motion.div
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="relative w-full max-w-md h-full bg-white/20 dark:bg-slate-950/20 backdrop-blur-2xl shadow-2xl border-l border-white/20 dark:border-white/10 flex flex-col"
          >
            <div className="flex-1 overflow-y-auto w-full p-5 flex flex-col space-y-4 bg-transparent">
              <div className="flex items-center gap-3 shrink-0 mb-4">
                <button
                  onClick={onClose}
                  className="p-2 rounded-xl bg-white/20 dark:bg-slate-900/20 backdrop-blur-md border border-rose-500/20 text-slate-500 dark:text-slate-300 hover:text-slate-900 hover:bg-white dark:hover:text-white cursor-pointer transition-all"
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
                  <FormField label="Full Name">
                    <Input
                      type="text" 
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      disabled={!!initialName}
                      className={initialName ? 'cursor-not-allowed bg-slate-100 dark:bg-slate-800' : 'bg-slate-50 dark:bg-slate-900'}
                    />
                  </FormField>
                  <FormField label="Phone Number">
                    <Input
                      type="tel" 
                      value={userPhone}
                      readOnly
                      className="cursor-not-allowed bg-slate-100 dark:bg-slate-800"
                    />
                  </FormField>
                  
                  {children}

                  {!initialName && (
                    <div className="pt-4">
                      <Button
                        onClick={handleSaveName}
                        disabled={!editName.trim()}
                        variant="primary"
                        fullWidth
                      >
                        Save Changes
                      </Button>
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
                              {device.deviceId === currentDeviceId && <Badge variant="success" size="xs" className="ml-2">This Device</Badge>}
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
                    <Button 
                      onClick={handleLogout}
                      variant="secondary"
                      fullWidth
                      icon={<LogOut className="w-4 h-4 text-rose-600 dark:text-rose-400" />}
                      className="text-rose-600 dark:text-rose-400"
                    >
                      Log Out
                    </Button>
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
