import { useCallback, useEffect, useState } from 'react';
import { getUserProfile } from '@/lib/tokenStore';
import { customerApi, identityApi } from '@/lib/zodiosClients';
import { RoleName } from '@/types';

/**
 * Where the customer wants their food, and the addresses they have saved.
 *
 * Lifted verbatim out of an 887-line `CustomerDashboard`. The delivery address is written to
 * localStorage on every change because it has to survive a reload mid-order — that effect and
 * the fetch that seeds it were 100 lines apart in the original, which is how the two came to
 * disagree about what an empty address means.
 */

interface UseCustomerAddressesOptions {
  /** Opened when the fetched profile turns out to be incomplete. */
  setShowProfileModal: (open: boolean) => void;
  /** Reopened when the address that was selected is the one just deleted. */
  setIsAddressSelectorOpen: (open: boolean) => void;
  showError: (message: string) => void;
  showSuccess: (message: string) => void;
}

export function useCustomerAddresses({
  setShowProfileModal,
  setIsAddressSelectorOpen,
  showError,
  showSuccess,
}: UseCustomerAddressesOptions) {
  const [deliveryLat, setDeliveryLat] = useState<number | null>(() => {
    const stored = localStorage.getItem('deliveryLat');
    return stored ? Number(stored) : null;
  });
  const [deliveryLng, setDeliveryLng] = useState<number | null>(() => {
    const stored = localStorage.getItem('deliveryLng');
    return stored ? Number(stored) : null;
  });
  const [address, setAddress] = useState(() => localStorage.getItem('deliveryAddress') || 'Please add an address');
  const [deliveryAddressId, setDeliveryAddressId] = useState<string>(() => localStorage.getItem('deliveryAddressId') || '');
  const [savedAddresses, setSavedAddresses] = useState<Record<string, unknown>[]>([]);
  const [showLocationPrompt, setShowLocationPrompt] = useState(false);

const refreshAddresses = useCallback(() => {
  const profile = getUserProfile();
  if (!profile?.id) return;

  customerApi.customerAddress.get('/api/v1/customers/:customerId/addresses', {
    params: { customerId: profile.id }
   
  })
    .then((addrRes: { data?: Array<Record<string, unknown>> }) => {
      if (addrRes.data) {
         
        setSavedAddresses(addrRes.data);
      }
    })
    .catch((err: unknown) => console.error(err));
}, []);

const handleDeleteAddress = useCallback(async (addressId: string) => {
  const profile = getUserProfile();
  if (!profile?.id) return;
  try {
    await customerApi.customerAddress.deleteAddress(undefined, {
      params: { customerId: profile.id, addressId }
    });
    showSuccess('Address deleted successfully');
    refreshAddresses();
    if (deliveryAddressId === addressId) {
      setDeliveryAddressId('');
      setAddress('Please select an address');
      setDeliveryLat(null);
      setDeliveryLng(null);
      localStorage.removeItem('deliveryAddress');
       
      localStorage.removeItem('deliveryAddressId');
      localStorage.removeItem('deliveryLat');
      localStorage.removeItem('deliveryLng');
       
      setIsAddressSelectorOpen(true);
    }
  } catch (error) {
    console.error(error);
    showError('Failed to delete address');
  }
}, [refreshAddresses, showSuccess, showError, deliveryAddressId, setIsAddressSelectorOpen]);

useEffect(() => {
  localStorage.setItem('deliveryAddress', address);
  if (deliveryLat !== null) localStorage.setItem('deliveryLat', String(deliveryLat));
  else localStorage.removeItem('deliveryLat');
   
  if (deliveryLng !== null) localStorage.setItem('deliveryLng', String(deliveryLng));
  else localStorage.removeItem('deliveryLng');
  localStorage.setItem('deliveryAddressId', deliveryAddressId);
}, [address, deliveryLat, deliveryLng, deliveryAddressId]);

// Fetch profile and addresses
useEffect(() => {
  const profile = getUserProfile();
  if (profile && profile.role === RoleName.CUSTOMER) {
    const profilePromise = (identityApi.user.get(`/api/v1/users/profile`, { headers: { "X-User-Id": "" } })).catch(e => { console.error(e); return { data: null }; });
    const addressesPromise = profile.id ? customerApi.customerAddress.get('/api/v1/customers/:customerId/addresses', { params: { customerId: profile.id } }).catch((e: unknown) => { console.error(e); return { data: null }; }) : Promise.resolve({ data: null });
 

     
    Promise.all([profilePromise, addressesPromise]).then(([profileRes, addrRes]) => {
      // Handle Profile
       
      if (profileRes.data) {
        const p = profileRes.data;
        if (!p.name || !p.email || p.name.trim() === '' || p.email.trim() === '') {
           
          setShowProfileModal(true);
        }
      }

      // Handle Addresses
      if (addrRes.data) {
         
        setSavedAddresses(addrRes.data);
        const currentId = localStorage.getItem('deliveryAddressId');
        const storedLabel = localStorage.getItem('deliveryAddress') || '';
        const storedLat = localStorage.getItem('deliveryLat');
        const storedLng = localStorage.getItem('deliveryLng');
        // GPS is an explicit selection, rather than a missing saved-address ID.
        // Loading the saved list must not replace it or mix its coordinates with Home.
        const gpsSelected = !currentId && storedLabel.startsWith('Current Location')
          && storedLat !== null && storedLng !== null
          && Number.isFinite(Number(storedLat)) && Math.abs(Number(storedLat)) <= 90
          && Number.isFinite(Number(storedLng)) && Math.abs(Number(storedLng)) <= 180;
        if (gpsSelected) return;

        const selected = addrRes.data.find((a: Record<string, unknown>) => a.id === currentId)
          || addrRes.data[0];
        if (selected) {
          // Reconcile the entire selection from one server record, including when an
          // existing address was edited elsewhere or the previously selected ID vanished.
          setAddress(`${selected.label || 'Address'}: ${selected.addressLine1 || ''}${selected.addressLine2 ? ', ' + selected.addressLine2 : ''}, ${selected.city || ''}`);
          setDeliveryAddressId(selected.id ?? '');
          setDeliveryLat(typeof selected.latitude === 'number' && Number.isFinite(selected.latitude) ? selected.latitude : null);
          setDeliveryLng(typeof selected.longitude === 'number' && Number.isFinite(selected.longitude) ? selected.longitude : null);
        } else {
          setAddress('Please add an address');
          setDeliveryAddressId('');
          setDeliveryLat(null);
          setDeliveryLng(null);
          setIsAddressSelectorOpen(true);
        }
      }
    });
  }
 
}, [setShowProfileModal, setIsAddressSelectorOpen]);

  return {
    deliveryLat, setDeliveryLat,
    deliveryLng, setDeliveryLng,
    address, setAddress,
    deliveryAddressId, setDeliveryAddressId,
    savedAddresses, setSavedAddresses,
    showLocationPrompt, setShowLocationPrompt,
    refreshAddresses, handleDeleteAddress,
  };
}
