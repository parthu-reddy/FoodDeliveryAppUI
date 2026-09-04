import type { Order } from '../../schemas/order';
/* eslint-disable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */
import CustomerAddressModal from "@features/customer-orders/components/CustomerAddressModal";
import { getFriendlyStatusMessage } from '@features/customer-orders/model/statusMessaging';
import { Badge, Button, FormField, Input, TransactionHistoryTable, WalletTransaction, ActiveSessions } from "@shared/ui";
import { LogOut, MapPin, Trash2, X } from 'lucide-react';
import { motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { z } from 'zod';
import { useToast } from '../../contexts/ToastContext';
import { customerApi, identityApi, walletApi } from '../../lib/zodiosClients';
import { fromContract, asUntyped } from '../../lib/untypedResponse';
const sharedProfileSchema = z.object({
  name: z.string().min(1, 'Please enter your full name.').max(100, 'Name cannot exceed 100 characters.'),
  email: z.string().min(1, 'Please enter your email address.').email('Please enter a valid email address.').max(255, 'Email cannot exceed 255 characters.')
});

interface SharedSettingsViewProps {
  onBack: () => void;
  theme: 'light' | 'dark';
  // Extra props for Customer dashboard tabs
  showCustomerTabs?: boolean;
  setTrackingOrder?: (order: Order) => void;
  savedAddresses?: unknown[];
  initialTab?: 'profile' | 'history' | 'addresses' | 'wallet';
  isAddressModalOpen?: boolean;
  setIsAddressModalOpen?: (isOpen: boolean) => void;
  addressSearchQuery?: string;
  setAddressSearchQuery?: (q: string) => void;
  address?: string;
  setAddress?: (a: string) => void;
  onAddApiLog?: (log: unknown) => void;
  onLogout: () => void;
  customerId?: string;
  onSelectDeliveryLocation?: (addr: string) => void;
  deliveryLat?: number | string;
  deliveryLng?: number | string;
  onAddressAdded?: () => void;
  onDeleteAddress?: (addressId: string) => void;
}

export default function SharedSettingsView({
  onBack,
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
  onSelectDeliveryLocation,
  deliveryLat,
  deliveryLng,
  onAddressAdded,
  onDeleteAddress
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

  const [paginatedOrders, setPaginatedOrders] = useState<Order[]>([]);
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
      
      let rawRes: unknown;
      if (type === 'history') {
         rawRes = await customerApi.order.get('/api/v1/orders/history', { queries: { page } });
      } else {
         throw new Error(`Unsupported order type: ${type}`);
      }
      
      const res = asUntyped<unknown>(rawRes) as {data?: {content?: Order[], last?: boolean}} | {data?: Order[]} | undefined;
      
      if (res?.data && 'content' in res.data) {
        if (type === 'history') {
          const typedContent = (res.data as { content?: Order[] }).content || [];
          setPaginatedOrders(prev => page === 0 ? typedContent : [...prev, ...typedContent]);
          setHasMoreOrders(!res.data.last);
          setCurrentPageOrders(page);
        }
      } else if (res?.data && Array.isArray(res.data)) { // fallback
         if (type === 'history') {
             setPaginatedOrders(res.data as Order[]);
             setHasMoreOrders(false);
         }
      }
    } catch (e: unknown) {
      console.error(e);
      showError('Failed to fetch orders');
    } finally {
      if (type === 'history') {
          setIsLoadingOrders(false);
          setHasFetchedOrders(true);
      }
    }
  };

  const fetchWalletData = async () => {
    if (!customerId) return;
    setTxLoading(true);
    try {
      const balanceRes = await walletApi.wallet.get('/api/v1/wallets/:entityType/:entityId', { params: { entityType: 'CUSTOMER', entityId: customerId } });
      if (balanceRes) setWalletBalance(balanceRes.balance ?? 0);
      
      const txRes = await walletApi.wallet.get('/api/v1/wallets/:entityType/:entityId/transactions', { params: { entityType: 'CUSTOMER', entityId: customerId }, queries: { page: txPage } });
      if (txRes.data) {
        const typedTxRes = txRes as { content?: unknown[], totalPages?: number };
        setTransactions(fromContract(typedTxRes.content ?? []) as WalletTransaction[]);
        setTxTotalPages(typedTxRes.totalPages || 1);
      }
    } catch (e: unknown) {
      console.error(e);
      showError('Failed to fetch wallet data');
    } finally {
      setTxLoading(false);
      setHasFetchedWallet(true);
    }
  };

  const handleLogout = () => {
    if (onLogout) onLogout();
  };

  useEffect(() => {
    if (accountTab === 'history' && !hasFetchedOrders) {
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
        const res = await identityApi.user.get('/api/v1/users/profile', { headers: { "X-User-Id": "" } });
        if (res?.data) {
          setEditName(res.data.name || '');
          setInitialName(res.data.name || '');
          setEditEmail(res.data.email || '');
          setInitialEmail(res.data.email || '');
          setEditPhone(res.data.phone || res.data.phoneNumber || '');
          setUserId(res.data.id || '');
        }
      } catch (e: unknown) {
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
      await identityApi.user.put('/api/v1/users/profile', {
              id: userId,
              name: editName,
              email: editEmail,
              phone: editPhone
            }, { headers: { 'X-User-Id': '' } });
      showSuccess('Profile updated successfully');
    } catch (e: unknown) {
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
          className={`flex-1 min-w-[80px] px-3 py-2 rounded-lg text-xs font-bold transition-all shadow-sm border ${accountTab === 'profile' ? 'bg-gradient-to-r from-rose-500 to-orange-500 text-white border-transparent shadow-rose-500/20 shadow-md' : 'bg-white/40 dark:bg-white/10 backdrop-blur-sm text-slate-700 dark:text-slate-200 border-white/50 dark:border-white/10 hover:bg-white/60 dark:hover:bg-white/20'}`}
        >
          Profile
        </button>
        {showCustomerTabs && (
          <>
            <button 
              onClick={() => setAccountTab('history')}
              className={`flex-1 min-w-[100px] px-3 py-2 rounded-lg text-xs font-bold transition-all shadow-sm border ${accountTab === 'history' ? 'bg-gradient-to-r from-rose-500 to-orange-500 text-white border-transparent shadow-rose-500/20 shadow-md' : 'bg-white/40 dark:bg-white/10 backdrop-blur-sm text-slate-700 dark:text-slate-200 border-white/50 dark:border-white/10 hover:bg-white/60 dark:hover:bg-white/20'}`}
            >
              History
            </button>
            <button 
              onClick={() => setAccountTab('addresses')}
              className={`flex-1 min-w-[100px] px-3 py-2 rounded-lg text-xs font-bold transition-all shadow-sm border ${accountTab === 'addresses' ? 'bg-gradient-to-r from-rose-500 to-orange-500 text-white border-transparent shadow-rose-500/20 shadow-md' : 'bg-white/40 dark:bg-white/10 backdrop-blur-sm text-slate-700 dark:text-slate-200 border-white/50 dark:border-white/10 hover:bg-white/60 dark:hover:bg-white/20'}`}
            >
              Addresses
            </button>
          </>
        )}
        <button 
          onClick={() => setAccountTab('wallet')}
          className={`flex-1 min-w-[100px] px-3 py-2 rounded-lg text-xs font-bold transition-all shadow-sm border ${accountTab === 'wallet' ? 'bg-gradient-to-r from-rose-500 to-orange-500 text-white border-transparent shadow-rose-500/20 shadow-md' : 'bg-white/40 dark:bg-white/10 backdrop-blur-sm text-slate-700 dark:text-slate-200 border-white/50 dark:border-white/10 hover:bg-white/60 dark:hover:bg-white/20'}`}
        >
          Wallet / Earnings
        </button>
      </div>

      <div className="flex-1 overflow-y-auto overscroll-none pr-1">
        {accountTab === 'profile' && (
          <div className="space-y-4">
            <FormField label="Full Name">
              <Input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                disabled={!!initialName}
                className={initialName ? 'opacity-70 cursor-not-allowed' : 'focus:border-rose-500/50'}
              />
            </FormField>
            <FormField label="Email Address">
              <Input
                type="email"
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
                disabled={!!initialEmail}
                className={initialEmail ? 'opacity-70 cursor-not-allowed' : 'focus:border-rose-500/50'}
              />
            </FormField>
            <FormField label="Phone Number">
              <Input
                type="tel"
                value={editPhone}
                disabled
                className="opacity-70 cursor-not-allowed"
              />
            </FormField>

            {(!initialName || !initialEmail) && (
              <div className="pt-4">
                <Button
                  onClick={saveProfile}
                  disabled={isSaving || !editName || !editEmail}
                  variant="primary"
                  fullWidth
                >
                  {isSaving ? 'Saving...' : 'Save Profile Changes'}
                </Button>
              </div>
            )}

            <ActiveSessions callingService="CustomerApplication" onAddApiLog={onAddApiLog} />

            <div className="pt-6">
              <Button
                onClick={handleLogout}
                variant="danger"
                fullWidth
                icon={<LogOut className="w-4 h-4" />}
              >
                Log Out
              </Button>
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
              paginatedOrders.map((order: Order) => (
                <div 
                  key={order.id} 
                  onClick={() => setTrackingOrder && setTrackingOrder(order)}
                  className="p-4 rounded-2xl border border-rose-500/20 dark:border-rose-500/30 bg-white/20 dark:bg-slate-900/20 backdrop-blur-md cursor-pointer hover:bg-white/40 dark:hover:bg-slate-900/40 transition-colors"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 dark:text-slate-300 font-mono block">{order.id.substring(0, 8)}</span>
                      <h5 className="font-bold text-sm text-slate-900 dark:text-[#f0ede6]">{order.restaurantName}</h5>
                    </div>
                    <Badge variant="primary">
                      {getFriendlyStatusMessage(order.status, order.deliveryStatus)}
                    </Badge>
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-300 mb-3">
                    <div className="mb-1 font-semibold">{order.items?.length || 0} items • ${(order.totalAmount || (order as {total?:number}).total || 0).toFixed(2)}</div>
                    {order.items && order.items.length > 0 && (
                      <ul className="list-disc pl-4 space-y-0.5 text-slate-400">
                        {order.items.map((it: unknown, idx: number) => {
                          const item = asUntyped<unknown>(it) as { quantity?: number, item?: { name?: string }, name?: string };
                          return <li key={idx}>{item.quantity || 1}x {item.item?.name || item.name || 'Item'}</li>
                        })}
                      </ul>
                    )}
                  </div>
                  {/* Buttons removed for simplified history view */}
                </div>
              ))
            )}
            {hasMoreOrders && !isLoadingOrders && (
              <Button
                onClick={() => fetchOrders(currentPageOrders + 1, 'history')}
                variant="outline"
                fullWidth
              >
                Load More History
              </Button>
            )}
          </div>
        )}

        {showCustomerTabs && accountTab === 'addresses' && (
          <div className="space-y-4">
            {savedAddresses && savedAddresses.length > 0 ? (
              <div className="flex flex-col gap-3">
                {savedAddresses.map((a: unknown) => {
                  const addr = asUntyped<unknown>(a) as { id: string, label?: string, addressLine1?: string, addressLine2?: string, city?: string, state?: string, zipCode?: string };
                  return (
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
                    {onDeleteAddress && (
                      <button
                        onClick={() => onDeleteAddress(addr.id)}
                        className="w-10 h-10 rounded-full hover:bg-rose-100 dark:hover:bg-rose-900/50 flex items-center justify-center shrink-0 transition-colors duration-200"
                        title="Delete Address"
                      >
                        <Trash2 className="w-5 h-5 text-rose-500 hover:text-rose-600 dark:text-rose-400 dark:hover:text-rose-300 transition-colors" />
                      </button>
                    )}
                  </div>
                )})}
              </div>
            ) : (
              <div className="text-center py-10 bg-white/20 dark:bg-slate-900/20 rounded-2xl border border-rose-500/20 dark:border-rose-500/30">
                <MapPin className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <p className="text-sm font-bold text-slate-500 dark:text-slate-300">No saved addresses</p>
              </div>
            )}

            {!isAddressModalOpen ? (
              <Button
                onClick={() => {
                  if (setIsAddressModalOpen) setIsAddressModalOpen(true);
                }}
                variant="secondary"
                fullWidth
                icon={<MapPin className="w-4 h-4" />}
                className="mt-2 border-2 border-dashed border-rose-500/30 dark:border-rose-500/40 !text-rose-600 dark:!text-rose-400 !bg-transparent hover:!bg-rose-50 dark:hover:!bg-rose-500/10"
              >
                Add / Manage Addresses
              </Button>
            ) : (
              <div className="mt-4">
                <CustomerAddressModal
                  isAddressModalOpen={!!isAddressModalOpen}
                  setIsAddressModalOpen={setIsAddressModalOpen || (() => {})}
                  addressSearchQuery={addressSearchQuery || ''}
                  setAddressSearchQuery={setAddressSearchQuery || (() => {})}
                  address={address}
                  setAddress={setAddress}
                  savedAddresses={(savedAddresses || []) as { id: string; label: string; addressLine1: string; city: string; latitude: string; longitude: string; }[]}
                  onAddApiLog={onAddApiLog}
                  customerId={customerId}
                  onSelectDeliveryLocation={onSelectDeliveryLocation}
                  initialLat={deliveryLat}
                  initialLng={deliveryLng}
                  onAddressAdded={onAddressAdded}
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
