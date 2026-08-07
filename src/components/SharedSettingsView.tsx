import { OrderStatus, DeliveryStatus, Order } from '../types';
import { getFriendlyStatusMessage } from '../utils/statusMessaging';
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, User, Package, LogOut, MapPin, Check } from 'lucide-react';
import { apiGet, apiPut, apiDelete } from '../lib/apiClient';
import { useToast } from '../context/ToastContext';
import CustomerAddressModal from './CustomerAddressModal';
import { TransactionHistoryTable, WalletTransaction } from './TransactionHistoryTable';
import { z } from 'zod';

const sharedProfileSchema = z.object({
  name: z.string().min(1, 'Please enter your full name.').max(100, 'Name cannot exceed 100 characters.'),
  email: z.string().min(1, 'Please enter your email address.').email('Please enter a valid email address.').max(255, 'Email cannot exceed 255 characters.')
});

interface SharedSettingsViewProps {
  onBack: () => void;
  theme: 'light' | 'dark';
  // Extra props for Customer dashboard tabs
  showCustomerTabs?: boolean;
  setTrackingOrder?: (order: any) => void;
  savedAddresses?: any[];
  initialTab?: 'profile' | 'history' | 'addresses' | 'wallet';
  isAddressModalOpen?: boolean;
  setIsAddressModalOpen?: (isOpen: boolean) => void;
  addressSearchQuery?: string;
  setAddressSearchQuery?: (q: string) => void;
  address?: string;
  setAddress?: (a: string) => void;
  onAddApiLog?: (log: any) => void;
  onLogout: () => void;
  customerId?: string;
  onSelectDeliveryLocation?: (addr: string) => void;
}

export default function SharedSettingsView({
  onBack,
  theme,
  showCustomerTabs = false,
  setTrackingOrder,
  savedAddresses = [],
  initialTab = 'profile',
  isAddressModalOpen = false,
  setIsAddressModalOpen,
  addressSearchQuery,
  setAddressSearchQuery,
  address,
  setAddress,
  onAddApiLog,
  onLogout,
  customerId,
  onSelectDeliveryLocation
}: SharedSettingsViewProps) {
  const [accountTab, setAccountTab] = useState<'profile' | 'history' | 'addresses' | 'wallet'>(initialTab);
  const { showSuccess, showError } = useToast();

  useEffect(() => {
    if (initialTab) {
      setAccountTab(initialTab);
    }
  }, [initialTab]);

  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [initialName, setInitialName] = useState('');
  const [initialEmail, setInitialEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [userId, setUserId] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [sessions, setSessions] = useState<any[]>([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);

  const [paginatedOrders, setPaginatedOrders] = useState<any[]>([]);
  const [currentPageOrders, setCurrentPageOrders] = useState(0);
  const [hasMoreOrders, setHasMoreOrders] = useState(false);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [hasFetchedOrders, setHasFetchedOrders] = useState(false);
  
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [txPage, setTxPage] = useState(0);
  const [txTotalPages, setTxTotalPages] = useState(1);
  const [txLoading, setTxLoading] = useState(false);
  const [hasFetchedWallet, setHasFetchedWallet] = useState(false);

  const fetchOrders = async (page: number, type: 'history') => {
    try {
      if (type === 'history') setIsLoadingOrders(true);
      
      const res = await apiGet(`/api/v1/orders/${type}?page=${page}&size=10`);
      
      if (res?.data?.content) {
        if (type === 'history') {
          setPaginatedOrders(prev => page === 0 ? res.data.content : [...prev, ...res.data.content]);
          setHasMoreOrders(!res.data.last);
          setCurrentPageOrders(page);
        }
      } else if (res?.data && Array.isArray(res.data)) { // fallback
         if (type === 'history') {
             setPaginatedOrders(res.data);
             setHasMoreOrders(false);
         }
      }
    } catch (e) {
      console.error(e);
      showError('Failed to fetch orders');
    } finally {
      if (type === 'history') {
          setIsLoadingOrders(false);
          setHasFetchedOrders(true);
      }
    }
  };

  const loadSessions = async () => {
    setIsLoadingSessions(true);
    try {
      const res = await apiGet('/api/v1/internal/auth/sessions');
      if (res?.data) {
        setSessions(res.data);
      }
    } catch (e) {
      console.error(e);
      showError('Failed to load sessions. Please try again.');
    } finally {
      setIsLoadingSessions(false);
    }
  };

  const fetchWalletData = async () => {
    if (!customerId) return;
    setTxLoading(true);
    try {
      const balanceRes = await apiGet(`/api/v1/wallets/CUSTOMER/${customerId}`);
      if (balanceRes.data) setWalletBalance(balanceRes.data.balance);
      
      const txRes = await apiGet(`/api/v1/wallets/CUSTOMER/${customerId}/transactions?page=${txPage}&size=10`);
      if (txRes.data) {
        setTransactions(txRes.data.content || []);
        setTxTotalPages(txRes.data.totalPages || 1);
      }
    } catch (e) {
      console.error(e);
      showError('Failed to fetch wallet data');
    } finally {
      setTxLoading(false);
      setHasFetchedWallet(true);
    }
  };

  const revokeSession = async (sessionId: string) => {
    try {
      if (onAddApiLog) {
        onAddApiLog({ id: `revoke_${sessionId}`, label: `DELETE /api/v1/internal/auth/sessions/${sessionId}`, method: 'DELETE' });
      }
      await apiDelete(`/api/v1/internal/auth/sessions/${sessionId}`);
      
      // If we revoked the current session, it might throw a 401 on next request. We'll reload sessions to be safe.
      await loadSessions();
    } catch (e: any) {
      if (e.status === 401) {
        // We revoked our own session
        window.location.href = '/';
      } else {
        console.error(e);
        showError('Failed to revoke session');
      }
    }
  };

  const handleLogout = () => {
    if (onLogout) onLogout();
  };

  useEffect(() => {
    if (accountTab === 'profile') {
      loadSessions();
    } else if (accountTab === 'history' && !hasFetchedOrders) {
      fetchOrders(0, 'history');
    } else if (accountTab === 'wallet' && !hasFetchedWallet) {
      fetchWalletData();
    }
  }, [accountTab, hasFetchedOrders, hasFetchedWallet]);

  useEffect(() => {
    if (accountTab === 'wallet' && hasFetchedWallet) {
      fetchWalletData();
    }
  }, [txPage]);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const res = await apiGet('/api/v1/users/profile');
        if (res?.data) {
          setEditName(res.data.name || '');
          setInitialName(res.data.name || '');
          setEditEmail(res.data.email || '');
          setInitialEmail(res.data.email || '');
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
    const validation = sharedProfileSchema.safeParse({
      name: editName.trim(),
      email: editEmail.trim()
    });

    if (!validation.success) {
      showError(validation.error.issues[0].message);
      return;
    }

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
      showSuccess('Profile updated successfully');
    } catch (e) {
      console.error(e);
      showError('Failed to update profile');
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
          className="p-2 rounded-xl bg-white/20 dark:bg-slate-900/20 backdrop-blur-md border border-rose-500/20 text-slate-500 dark:text-slate-300 hover:text-slate-900 hover:bg-white dark:hover:text-white cursor-pointer transition-all shadow-sm"
        >
          <X className="w-5 h-5" />
        </button>
        <div>
          <h4 className="font-bold text-xl text-slate-900 dark:text-[#f0ede6]">Account Settings</h4>
          <p className="text-xs text-slate-500 dark:text-slate-300">Manage your profile{showCustomerTabs ? ' and orders' : ''}</p>
        </div>
      </div>

      <div className="flex gap-2 mb-4 shrink-0 bg-white/20 dark:bg-slate-900/20 backdrop-blur-md p-1.5 rounded-xl border border-rose-500/20 dark:border-rose-500/30 overflow-x-auto whitespace-nowrap">
        <button 
          onClick={() => setAccountTab('profile')}
          className={`flex-1 min-w-[80px] px-3 py-2 rounded-lg text-xs font-bold transition-all shadow-sm ${accountTab === 'profile' ? 'bg-gradient-to-r from-rose-500 to-orange-500 text-white' : 'bg-transparent text-slate-500 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
        >
          Profile
        </button>
        {showCustomerTabs && (
          <>
            <button 
              onClick={() => setAccountTab('history')}
              className={`flex-1 min-w-[100px] px-3 py-2 rounded-lg text-xs font-bold transition-all shadow-sm ${accountTab === 'history' ? 'bg-gradient-to-r from-rose-500 to-orange-500 text-white' : 'bg-transparent text-slate-500 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
            >
              History
            </button>
            <button 
              onClick={() => setAccountTab('addresses')}
              className={`flex-1 min-w-[100px] px-3 py-2 rounded-lg text-xs font-bold transition-all shadow-sm ${accountTab === 'addresses' ? 'bg-gradient-to-r from-rose-500 to-orange-500 text-white' : 'bg-transparent text-slate-500 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
            >
              Addresses
            </button>
          </>
        )}
        <button 
          onClick={() => setAccountTab('wallet')}
          className={`flex-1 min-w-[100px] px-3 py-2 rounded-lg text-xs font-bold transition-all shadow-sm ${accountTab === 'wallet' ? 'bg-gradient-to-r from-rose-500 to-orange-500 text-white' : 'bg-transparent text-slate-500 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
        >
          Wallet / Earnings
        </button>
      </div>

      <div className="flex-1 overflow-y-auto overscroll-none pr-1">
        {accountTab === 'profile' && (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-300">Full Name</label>
              <input 
                type="text" 
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                disabled={!!initialName}
                className={`w-full px-4 py-3 rounded-xl border border-rose-500/20 dark:border-rose-500/30 bg-white/20 dark:bg-slate-900/20 backdrop-blur-md text-sm font-medium text-slate-900 dark:text-[#f0ede6] outline-none transition-colors ${!!initialName ? 'opacity-70 cursor-not-allowed' : 'focus:border-rose-500/50'}`}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-300">Email Address</label>
              <input 
                type="email" 
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
                disabled={!!initialEmail}
                className={`w-full px-4 py-3 rounded-xl border border-rose-500/20 dark:border-rose-500/30 bg-white/20 dark:bg-slate-900/20 backdrop-blur-md text-sm font-medium text-slate-900 dark:text-[#f0ede6] outline-none transition-colors ${!!initialEmail ? 'opacity-70 cursor-not-allowed' : 'focus:border-rose-500/50'}`}
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

            {(!initialName || !initialEmail) && (
              <div className="pt-4">
                <button 
                  onClick={saveProfile}
                  disabled={isSaving || !editName || !editEmail}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-rose-500 to-orange-500 text-white font-bold text-sm shadow-md shadow-rose-500/20 active:scale-[0.98] transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isSaving ? 'Saving...' : 'Save Profile Changes'}
                </button>
              </div>
            )}

            <div className="pt-6 border-t border-rose-500/10">
              <div className="flex justify-between items-center mb-3">
                <h4 className="text-sm font-bold text-slate-900 dark:text-[#f0ede6]">Logged-in Devices</h4>
              </div>
              <div className="space-y-2">
                {isLoadingSessions ? (
                  <div className="text-center py-6 text-sm font-bold text-slate-500 dark:text-slate-400">
                    Loading sessions...
                  </div>
                ) : sessions.length === 0 ? (
                  <div className="text-center py-6 text-sm font-bold text-slate-500 dark:text-slate-400">
                    No active sessions found.
                  </div>
                ) : (
                  sessions.map((session: any) => (
                    <div key={session.sessionId} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex justify-between items-center">
                      <div>
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                          {session.serviceName ? <span className="uppercase text-[9px] bg-rose-100 dark:bg-rose-500/20 text-rose-600 px-1.5 py-0.5 rounded-full mr-2">{session.serviceName}</span> : null}
                          {session.os} • {session.browser}
                        </p>
                        <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-1">{session.deviceInfo}</p>
                        <p className="text-[9px] text-rose-500 mt-0.5">Last Active: {new Date(session.lastActive).toLocaleString()}</p>
                      </div>
                      <button
                        onClick={() => revokeSession(session.sessionId)}
                        className="text-xs text-rose-500 hover:text-rose-600 font-bold p-1 shrink-0"
                      >
                        Remove
                      </button>
                    </div>
                  ))
                )}
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
        )}

        {showCustomerTabs && accountTab === 'history' && (
          <div className="space-y-4">
            {isLoadingOrders && paginatedOrders.length === 0 ? (
              <div className="text-center text-slate-500 text-sm py-8">Loading history...</div>
            ) : paginatedOrders.length === 0 ? (
              <div className="text-center text-slate-500 text-sm py-8">No order history found.</div>
            ) : (
              paginatedOrders.map((order: any) => (
                <div key={order.id} className="p-4 rounded-2xl border border-rose-500/20 dark:border-rose-500/30 bg-white/20 dark:bg-slate-900/20 backdrop-blur-md">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 dark:text-slate-300 font-mono block">{order.id.substring(0, 8)}</span>
                      <h5 className="font-bold text-sm text-slate-900 dark:text-[#f0ede6]">{order.restaurantName}</h5>
                    </div>
                    <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-200/60 dark:border-rose-500/30 shadow-[0_0_12px_rgba(244,63,94,0.4)] dark:shadow-[0_0_12px_rgba(244,63,94,0.5)] tracking-wider`}>
                      {getFriendlyStatusMessage(order.status, order.deliveryStatus)}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-300 mb-3">
                    <div className="mb-1 font-semibold">{order.items?.length || 0} items • ${(order.totalAmount || order.total || 0).toFixed(2)}</div>
                    {order.items && order.items.length > 0 && (
                      <ul className="list-disc pl-4 space-y-0.5 text-slate-400">
                        {order.items.map((it: any, idx: number) => (
                          <li key={idx}>{it.quantity || 1}x {it.item?.name || it.name || 'Item'}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <button 
                    onClick={() => {
                      if (setTrackingOrder) setTrackingOrder(order);
                      onBack();
                    }}
                    className="w-full py-2 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-[#f0ede6] rounded-lg text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer mt-3"
                  >
                    {[OrderStatus.HANDED_OVER, OrderStatus.CANCELLED, OrderStatus.CANCELLED_BY_RESTAURANT].includes(order.status) ? "View Invoice" : "View Details"}
                  </button>
                </div>
              ))
            )}
            {hasMoreOrders && !isLoadingOrders && (
              <button 
                onClick={() => fetchOrders(currentPageOrders + 1, 'history')}
                className="w-full py-2.5 rounded-xl border border-rose-500/30 text-rose-500 font-bold text-xs hover:bg-rose-500/10 transition-colors"
              >
                Load More History
              </button>
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
                    className="flex items-start gap-3 p-4 rounded-xl border border-rose-500/20 dark:border-rose-500/30 bg-white/20 dark:bg-slate-900/20 backdrop-blur-md"
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
              <div className="text-center py-10 bg-white/20 dark:bg-slate-900/20 rounded-2xl border border-rose-500/20 dark:border-rose-500/30">
                <MapPin className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <p className="text-sm font-bold text-slate-500 dark:text-slate-300">No saved addresses</p>
              </div>
            )}

            {!isAddressModalOpen ? (
              <button 
                onClick={() => {
                  if (setIsAddressModalOpen) setIsAddressModalOpen(true);
                }}
                className="w-full py-3 mt-2 rounded-xl border-2 border-dashed border-rose-500/30 dark:border-rose-500/40 text-rose-600 dark:text-rose-400 text-sm font-bold flex items-center justify-center gap-2 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all cursor-pointer"
              >
                <MapPin className="w-4 h-4" />
                Add / Manage Addresses
              </button>
            ) : (
              <div className="mt-4">
                <CustomerAddressModal
                  isAddressModalOpen={isAddressModalOpen}
                  setIsAddressModalOpen={setIsAddressModalOpen}
                  addressSearchQuery={addressSearchQuery}
                  setAddressSearchQuery={setAddressSearchQuery}
                  address={address}
                  setAddress={setAddress}
                  savedAddresses={savedAddresses}
                  onAddApiLog={onAddApiLog}
                  customerId={customerId}
                  onSelectDeliveryLocation={onSelectDeliveryLocation}
                />
              </div>
            )}
          </div>
        )}

        {showCustomerTabs && accountTab === 'wallet' && (
          <div className="space-y-6 pb-6">
            <div className="bg-white/50 dark:bg-slate-900/40 backdrop-blur-md border border-rose-500/20 rounded-2xl p-6 text-center">
              <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wide">Available Balance</p>
              <h2 className="text-4xl font-black text-slate-900 dark:text-[#f0ede6]">₹{walletBalance.toFixed(2)}</h2>
            </div>
            
            <div>
              <h3 className="font-bold text-lg text-slate-900 dark:text-[#f0ede6] mb-4">Transaction History</h3>
              <TransactionHistoryTable 
                transactions={transactions}
                isLoading={txLoading}
                page={txPage}
                totalPages={txTotalPages}
                onPageChange={setTxPage}
              />
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
