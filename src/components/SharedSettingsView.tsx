import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, User, Package, LogOut, MapPin, Check } from 'lucide-react';
import { apiGet, apiPut } from '../lib/apiClient';

interface SharedSettingsViewProps {
  onBack: () => void;
  theme: 'light' | 'dark';
  // Extra props for Customer dashboard tabs
  showCustomerTabs?: boolean;
  activeOrders?: any[];
  setTrackingOrder?: (order: any) => void;
  savedAddresses?: any[];
  setIsAddressModalOpen?: (isOpen: boolean) => void;
  onAddApiLog?: (log: any) => void;
}

export default function SharedSettingsView({
  onBack,
  theme,
  showCustomerTabs = false,
  activeOrders = [],
  setTrackingOrder,
  savedAddresses = [],
  setIsAddressModalOpen,
  onAddApiLog
}: SharedSettingsViewProps) {
  const [accountTab, setAccountTab] = useState<'profile' | 'orders' | 'addresses'>('profile');
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [userId, setUserId] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const res = await apiGet('/api/v1/users/profile');
        if (res?.data) {
          setEditName(res.data.name || '');
          setEditEmail(res.data.email || '');
          setEditPhone(res.data.phone || res.data.phoneNumber || '');
          setUserId(res.data.id || '');
        }
      } catch (e) {
        console.error(e);
      }
    };
    loadProfile();
  }, []);

  const saveProfile = async () => {
    setIsSaving(true);
    if (onAddApiLog) {
      onAddApiLog({ id: 'update_profile', label: `PUT /api/v1/users/profile`, method: 'PUT' });
    }
    try {
      await apiPut('/api/v1/users/profile', {
        id: userId,
        name: editName,
        email: editEmail,
        phone: editPhone
      });
      alert('Profile updated successfully');
    } catch (e) {
      console.error(e);
      alert('Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }} 
      className="flex-1 overflow-y-auto w-full p-5 flex flex-col space-y-4 bg-transparent max-w-3xl mx-auto mt-2"
    >
      <div className="flex items-center gap-3 shrink-0 mb-2">
        <button
          onClick={onBack}
          className="p-2 rounded-xl bg-white/40 dark:bg-slate-900/40 backdrop-blur-md border border-rose-500/20 text-slate-500 dark:text-slate-300 hover:text-slate-900 hover:bg-white dark:hover:text-white cursor-pointer transition-all shadow-sm"
        >
          <X className="w-5 h-5" />
        </button>
        <div>
          <h4 className="font-bold text-xl text-slate-900 dark:text-[#f0ede6]">Account Settings</h4>
          <p className="text-xs text-slate-500 dark:text-slate-300">Manage your profile{showCustomerTabs ? ' and orders' : ''}</p>
        </div>
      </div>

      {showCustomerTabs && (
        <div className="flex gap-2 mb-4 shrink-0 bg-white/40 dark:bg-slate-900/40 backdrop-blur-md p-1.5 rounded-xl border border-rose-500/20 dark:border-rose-500/30">
          <button 
            onClick={() => setAccountTab('profile')}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all shadow-sm ${accountTab === 'profile' ? 'bg-gradient-to-r from-rose-500 to-orange-500 text-white' : 'bg-transparent text-slate-500 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
          >
            Profile
          </button>
          <button 
            onClick={() => setAccountTab('orders')}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all shadow-sm ${accountTab === 'orders' ? 'bg-gradient-to-r from-rose-500 to-orange-500 text-white' : 'bg-transparent text-slate-500 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
          >
            Orders History
          </button>
          <button 
            onClick={() => setAccountTab('addresses')}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all shadow-sm ${accountTab === 'addresses' ? 'bg-gradient-to-r from-rose-500 to-orange-500 text-white' : 'bg-transparent text-slate-500 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
          >
            Addresses
          </button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto overscroll-none pr-1">
        {accountTab === 'profile' && (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-300">Full Name</label>
              <input 
                type="text" 
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-rose-500/20 dark:border-rose-500/30 bg-white/60 dark:bg-slate-900/60 backdrop-blur-md text-sm font-medium text-slate-900 dark:text-[#f0ede6] outline-none focus:border-rose-500/50 transition-colors"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-300">Email Address</label>
              <input 
                type="email" 
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-rose-500/20 dark:border-rose-500/30 bg-white/60 dark:bg-slate-900/60 backdrop-blur-md text-sm font-medium text-slate-900 dark:text-[#f0ede6] outline-none focus:border-rose-500/50 transition-colors"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-300">Phone Number</label>
              <input 
                type="tel" 
                value={editPhone}
                disabled
                className="w-full px-4 py-3 rounded-xl border border-rose-500/20 dark:border-rose-500/30 bg-white/30 dark:bg-slate-900/30 backdrop-blur-md text-sm font-medium text-slate-500 dark:text-slate-400 opacity-70 cursor-not-allowed"
              />
            </div>

            <div className="pt-4">
              <button 
                onClick={saveProfile}
                disabled={isSaving || !editName || !editEmail}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-rose-500 to-orange-500 text-white font-bold text-sm shadow-md shadow-rose-500/20 active:scale-[0.98] transition-all disabled:opacity-50 cursor-pointer"
              >
                {isSaving ? 'Saving...' : 'Save Profile Changes'}
              </button>
            </div>
          </div>
        )}

        {showCustomerTabs && accountTab === 'orders' && (
          <div className="space-y-3">
            {activeOrders.slice().reverse().map((order: any) => (
              <div key={order.id} className="p-4 rounded-2xl border border-rose-500/20 dark:border-rose-500/30 bg-white/60 dark:bg-slate-900/60 backdrop-blur-md">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-300 font-mono block">{order.id}</span>
                    <h5 className="font-bold text-sm text-slate-900 dark:text-[#f0ede6]">{order.restaurantName}</h5>
                  </div>
                  <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-200/60 dark:border-rose-500/30 shadow-[0_0_12px_rgba(244,63,94,0.4)] dark:shadow-[0_0_12px_rgba(244,63,94,0.5)] tracking-wider`}>
                    {order.status.replace('_', ' ')}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-300 mb-3">{order.items.length} items • ${order.total.toFixed(2)}</p>
                <button 
                  onClick={() => {
                    if (setTrackingOrder) setTrackingOrder(order);
                    onBack();
                  }}
                  className="w-full py-2 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-[#f0ede6] rounded-lg text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                >
                  View Details
                </button>
              </div>
            ))}
            {activeOrders.length === 0 && (
              <div className="text-center py-10 bg-white/40 dark:bg-slate-900/40 rounded-2xl border border-rose-500/20 dark:border-rose-500/30">
                <Package className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <p className="text-sm font-bold text-slate-500 dark:text-slate-300">No orders yet</p>
              </div>
            )}
          </div>
        )}

        {showCustomerTabs && accountTab === 'addresses' && (
          <div className="space-y-4">
            {savedAddresses && savedAddresses.length > 0 ? (
              <div className="flex flex-col gap-3">
                {savedAddresses.map((addr: any) => (
                  <div
                    key={addr.id}
                    className="flex items-start gap-3 p-4 rounded-xl border border-rose-500/20 dark:border-rose-500/30 bg-white/60 dark:bg-slate-900/60 backdrop-blur-md"
                  >
                    <div className="w-10 h-10 rounded-full bg-rose-100 dark:bg-rose-500/10 flex items-center justify-center shrink-0">
                      <MapPin className="w-5 h-5 text-rose-500" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-slate-900 dark:text-[#f0ede6]">{addr.label || 'Home'}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-300 mt-0.5 leading-relaxed">
                        {addr.addressLine1}
                        {addr.addressLine2 ? `, ${addr.addressLine2}` : ''}
                        <br />
                        {addr.city}, {addr.state} {addr.zipCode}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10 bg-white/40 dark:bg-slate-900/40 rounded-2xl border border-rose-500/20 dark:border-rose-500/30">
                <MapPin className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <p className="text-sm font-bold text-slate-500 dark:text-slate-300">No saved addresses</p>
              </div>
            )}

            <button 
              onClick={() => {
                if (setIsAddressModalOpen) setIsAddressModalOpen(true);
              }}
              className="w-full py-3 mt-2 rounded-xl border-2 border-dashed border-rose-500/30 dark:border-rose-500/40 text-rose-600 dark:text-rose-400 text-sm font-bold flex items-center justify-center gap-2 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all cursor-pointer"
            >
              <MapPin className="w-4 h-4" />
              Add / Manage Addresses
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}
