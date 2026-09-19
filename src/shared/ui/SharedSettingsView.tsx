import type { Order } from '../../schemas/order';
/* eslint-disable react-hooks/set-state-in-effect */
import { MyReviewsList } from '@features/reviews';
import { Button, FormField, Input, ActiveSessions } from "@shared/ui";
import { SettingsAddressesTab } from "./SettingsAddressesTab";
import { SettingsHistoryTab } from "./SettingsHistoryTab";
import { SettingsWalletTab } from "./SettingsWalletTab";
import { Tabs } from "./navigation/Tabs";
import { LogOut, X } from 'lucide-react';
import { motion } from 'motion/react';
import { useMotionPresets } from '@shared/ui';
import { useEffect, useState } from 'react';
import { z } from 'zod';
import { useToast } from '../../contexts/ToastContext';
import { identityApi } from '../../lib/zodiosClients';

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
  initialTab?: 'profile' | 'history' | 'addresses' | 'wallet' | 'reviews';
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
  const [accountTab, setAccountTab] = useState<'profile' | 'history' | 'addresses' | 'wallet' | 'reviews'>(initialTab);
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

  



  const handleLogout = () => {
    if (onLogout) onLogout();
  };


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

  const presets = useMotionPresets();
  return (
    <motion.div {...presets.fade} 
      className="flex-1 overflow-y-auto w-full p-5 flex flex-col space-y-4 bg-transparent max-w-3xl mx-auto mt-2"
    >
      <div className="flex items-center gap-3 shrink-0 mb-2">
        <Button size="icon" variant="ghost" aria-label="Close settings" onClick={onBack}>
          <X className="w-5 h-5" />
        </Button>
        <div>
          <h4 className="font-bold text-xl text-slate-900 dark:text-[#f0ede6]">Account Settings</h4>
          <p className="text-xs text-slate-500 dark:text-slate-300">Manage your profile{showCustomerTabs ? ' and orders' : ''}</p>
        </div>
      </div>

      <Tabs
        label="Account settings"
        className="mb-4 shrink-0"
        value={accountTab}
        onChange={setAccountTab}
        items={[
          { key: 'profile', label: 'Profile' },
          { key: 'history', label: 'History', hidden: !showCustomerTabs },
          { key: 'addresses', label: 'Addresses', hidden: !showCustomerTabs },
          { key: 'reviews', label: 'My Reviews', hidden: !showCustomerTabs },
          { key: 'wallet', label: showCustomerTabs ? 'Store Credit' : 'Wallet / Earnings' },
        ]}
      />

      <div className="flex-1 overflow-y-auto overscroll-none pr-1">
        {showCustomerTabs && accountTab === 'reviews' && (
          /* Mounted only while the tab is open, so opening Settings does not fetch a review list
             nobody asked for. Reviews are immutable -- this is the only place a customer can see
             what they said, including their own driver ratings, which are redacted everywhere else. */
          <MyReviewsList />
        )}

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
          <SettingsHistoryTab setTrackingOrder={setTrackingOrder} />
        )}

        {showCustomerTabs && accountTab === 'addresses' && (
          <SettingsAddressesTab
            savedAddresses={savedAddresses}
            onDeleteAddress={onDeleteAddress}
            isAddressModalOpen={isAddressModalOpen}
            setIsAddressModalOpen={setIsAddressModalOpen}
            addressSearchQuery={addressSearchQuery}
            setAddressSearchQuery={setAddressSearchQuery}
            address={address}
            setAddress={setAddress}
            onAddApiLog={onAddApiLog}
            customerId={customerId}
            onSelectDeliveryLocation={onSelectDeliveryLocation}
            deliveryLat={deliveryLat}
            deliveryLng={deliveryLng}
            onAddressAdded={onAddressAdded}
          />
        )}

        {showCustomerTabs && accountTab === 'wallet' && (
          <SettingsWalletTab customerId={customerId} />
        )}
      </div>
    </motion.div>
  );
}
