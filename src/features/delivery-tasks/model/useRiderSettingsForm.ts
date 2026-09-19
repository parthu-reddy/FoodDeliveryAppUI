import { deliveryApi, identityApi } from '@/lib/zodiosClients';
import { useToast } from '@/contexts/ToastContext';
import React, { useEffect, useState } from 'react';
import { z } from 'zod';

const riderProfileSchema = z.object({
  name: z.string().min(1, 'Please enter your full name.').max(100, 'Name cannot exceed 100 characters.'),
  email: z.string().min(1, 'Please enter your email address.').email('Please enter a valid email address.').max(255, 'Email cannot exceed 255 characters.'),
  vehicle: z.string().min(1, 'Please enter your vehicle registration.').max(50, 'Vehicle registration cannot exceed 50 characters.'),
  vehicleType: z.string().min(1, 'Please select your vehicle type.'),
  photoUrl: z.string().url('Please enter a valid URL for your profile photo.').max(1000, 'URL cannot exceed 1000 characters.').optional().or(z.literal(''))
});

interface UseRiderSettingsFormOptions {
  riderPhone: string;
  /** The dashboard re-reads the unified profile once a save lands. */
  onProfileUpdated: () => void;
}

/**
 * Everything the rider settings screen edits: the identity profile, the delivery profile and
 * the verification state the platform reports back.
 *
 * Lifted verbatim out of RiderSettingsView, which held this, the earnings wallet and the
 * whole render in one 390-line file. `useRiderProfile` next door is a different thing -- it
 * reads the rider's record for the dashboard; this one owns the editable form.
 */
export function useRiderSettingsForm({ riderPhone, onProfileUpdated }: UseRiderSettingsFormOptions) {
  // Identity Service Profile
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [userId, setUserId] = useState('');
  const [initialName, setInitialName] = useState('');
  const [initialEmail, setInitialEmail] = useState('');

  // Delivery Profile
  const [editVehicle, setEditVehicle] = useState('');
  const [editVehicleType, setEditVehicleType] = useState('BICYCLE');
  const [editPhoto, setEditPhoto] = useState('');

  // Document Verification State

  const [verificationStatus, setVerificationStatus] = useState<{ allDocsApproved?: boolean; bankApproved?: boolean } | null>(null);

  // State
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const { showSuccess } = useToast();

  useEffect(() => {
    const loadData = async () => {
      try {
        // Load Identity Profile
        const identityRes = await identityApi.user.get('/api/v1/users/profile', { headers: { "X-User-Id": riderPhone || "" } });
        if (identityRes?.data) {
          setEditName(identityRes.data.name || '');
          setInitialName(identityRes.data.name || '');
          setEditEmail(identityRes.data.email || '');
          setInitialEmail(identityRes.data.email || '');
          setUserId(identityRes.data.id || '');
        }

        // Load Delivery Profile
        const deliveryRes = await deliveryApi.deliveryExecutive.get('/api/delivery/profile', { queries: { phoneNumber: riderPhone || "" }, headers: { "X-User-Id": riderPhone || "" } });
        if (deliveryRes && deliveryRes.data) {
          const profile = deliveryRes.data;
          setEditVehicle(profile.vehicleNumber || '');
          setEditVehicleType(profile.vehicleType || 'BICYCLE');
          setEditPhoto(profile.photoUrl || '');
          if (profile.fullName && !identityRes?.data?.name) {
             setEditName(profile.fullName);
             setInitialName(profile.fullName);
          }
        }

        // Load Verification Status
        try {
          const verRes = await deliveryApi.deliveryVerification.get(`/api/delivery/verification/status`, {});
          if (verRes?.data) {
            setVerificationStatus({
              allDocsApproved: verRes.data.fullyVerified === true || String(verRes.data.fullyVerified) === 'true',
              bankApproved: verRes.data.bankStatus === 'APPROVED' || verRes.data.bankStatus === 'VERIFIED'
            });
          }
        } catch (verErr: unknown) {
          console.error("Error loading verification status:", verErr);
        }
      } catch (e: unknown) {
        // @ts-expect-error auto-migration type suppression
        if (e?.status !== 404) {
          console.error("Error loading profile:", e);
        }
      }
    };

    loadData();
  }, [riderPhone]);

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    
    const validation = riderProfileSchema.safeParse({
      name: editName.trim(),
      email: editEmail.trim(),
      vehicle: editVehicle.trim(),
      vehicleType: editVehicleType,
      photoUrl: editPhoto.trim()
    });

    if (!validation.success) {
      setErrorMsg(validation.error.issues[0].message);
      return;
    }

    setIsSaving(true);
    
    try {
      // 1. Update Identity Profile if not set
      if (!initialName || !initialEmail) {
         await identityApi.user.put('/api/v1/users/profile', {
                    id: userId,
                    name: editName,
                    email: editEmail,
                    phone: riderPhone
                  }, { headers: { "X-User-Id": userId || riderPhone || "" } });
      }

      // 2. Onboard/Update Delivery Profile
      await deliveryApi.deliveryExecutive.post('/api/delivery/onboard', {
              phoneNumber: riderPhone,
              fullName: editName,
              vehicleNumber: editVehicle,
              vehicleType: editVehicleType as "BICYCLE" | "EV_TWO_WHEELER" | "MCWG" | "LMV",
              photoUrl: editPhoto
            });

      // Refresh unified profile data in parent dashboard
      onProfileUpdated();
      showSuccess('Profile updated successfully');

    } catch (e: unknown) {
      console.error(e);
      const typedErr = e as { response?: { data?: { error?: string } }, message?: string };
      setErrorMsg(typedErr.response?.data?.error || typedErr.message || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  return {
    editName, setEditName,
    editEmail, setEditEmail,
    editVehicle, setEditVehicle,
    editVehicleType, setEditVehicleType,
    editPhoto, setEditPhoto,
    userId,
    initialName,
    initialEmail,
    verificationStatus,
    isSaving,
    errorMsg,
    saveProfile,
  };
}
