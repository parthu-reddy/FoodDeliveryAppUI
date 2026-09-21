import { useEffect, useState } from 'react';
import { deliveryApi, identityApi } from '@/lib/zodiosClients';

/**
 * The rider's own record: who they are, what they drive, and whether the platform has
 * cleared them to work.
 *
 * Lifted verbatim out of a 1,124-line `DeliveryDashboard`. The two fetches and the four
 * separate "is this profile usable" conclusions they reach were interleaved with the job
 * queue, the OTP forms and the whole render, which is why nothing here could be read without
 * reading all of it.
 */

interface UseRiderProfileOptions {
  riderPhone: string;
  showToast: (message: string) => void;
  /** Online state lives with the job queue; the profile only reports what the server had. */
  setIsOnline: (online: boolean) => void;
}

export function useRiderProfile({ riderPhone, showToast, setIsOnline }: UseRiderProfileOptions) {
  const [deliveryExecutiveId, setRiderId] = useState('');
  const [deliveryExecutiveName, setRiderName] = useState('');
  const [cityId, setCityId] = useState('');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [isProfileMandatory, setIsProfileMandatory] = useState(false);
  const [showProfileRequiredPrompt, setShowProfileRequiredPrompt] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [verificationStatus, setVerificationStatus] =
    useState<{ allDocsApproved?: boolean; bankApproved?: boolean } | null>(null);
  const [isVerificationLoaded, setIsVerificationLoaded] = useState(false);

useEffect(() => {
  // Fetch unified profile first
  identityApi.user.get(`/api/v1/users/profile`, { headers: { "X-User-Id": "" } }).catch((err) => {
    if (err?.status !== 404)
      console.warn("Failed to fetch unified profile:", err);
  });

  // Fetch delivery-specific profile details
  deliveryApi.deliveryExecutive
    .get("/api/delivery/profile", { queries: { phoneNumber: riderPhone }, headers: { "X-User-Id": "" } })
    .then((data) => {
      if (data.success && data.data) {
        const profile = data.data;
        if (!deliveryExecutiveName) setRiderName(profile.fullName || "");
        setVehicleNumber(profile.vehicleNumber || "");
        setPhotoUrl(profile.photoUrl || "");
        setCityId(profile.cityId || "");
        setIsOnline(
          profile.status === "ONLINE" || profile.status === "ON_DELIVERY"
        );
        setRiderId(profile.id ?? "");

        if (!profile.vehicleNumber || !profile.fullName) {
          setIsProfileMandatory(true);
          setShowProfileRequiredPrompt(true);
        } else {
          setIsProfileMandatory(false);
        }
      } else {
        setIsProfileMandatory(true);
        setShowProfileRequiredPrompt(true);
      }
    })
    .catch((err) => {
      if (err?.status === 404) {
        setIsProfileMandatory(true);
        setShowProfileRequiredPrompt(true);
      } else {
        console.error("Profile fetch error:", err);
        const errObj = err as { response?: { data?: { message?: string, error?: string } }, message?: string };
        showToast(errObj.response?.data?.message || errObj.response?.data?.error || errObj.message || "Failed to load profile");
      }
    })
    .finally(() => setIsLoadingProfile(false));

  // Fetch verification status
  deliveryApi.deliveryVerification
    .get("/api/delivery/verification/status", {})
    .then((res) => {
      if (res?.data) {
        setVerificationStatus({
          allDocsApproved: res.data.fullyVerified === true || (res.data.fullyVerified as unknown) === 'true',
          bankApproved: res.data.bankStatus === 'APPROVED' || res.data.bankStatus === 'VERIFIED'
        });
      }
    })
    .catch((err) => console.warn("Failed to fetch verification status", err))
    .finally(() => setIsVerificationLoaded(true));
 
// eslint-disable-next-line react-hooks/exhaustive-deps
}, [riderPhone]);
  /** Re-read the delivery profile after the rider edits it in settings. */
  const refresh = () =>
    deliveryApi.deliveryExecutive
      .get('/api/delivery/profile', { queries: { phoneNumber: riderPhone }, headers: { 'X-User-Id': '' } })
      .then((data) => {
        if (!data.success || !data.data) return null;
        const profile = data.data;
        setRiderName(profile.fullName || '');
        setVehicleNumber(profile.vehicleNumber || '');
        setPhotoUrl(profile.photoUrl || '');
        return profile;
      });

  return {
    deliveryExecutiveId,
    deliveryExecutiveName,
    cityId,
    vehicleNumber,
    photoUrl,
    isProfileMandatory,
    setIsProfileMandatory,
    showProfileRequiredPrompt,
    setShowProfileRequiredPrompt,
    isLoadingProfile,
    verificationStatus,
    setVerificationStatus,
    isVerificationLoaded,
    refresh,
  };
}
