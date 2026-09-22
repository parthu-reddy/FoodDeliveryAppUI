 
import { parseApiError } from '@/lib/parseApiError';
import { deliveryApi, identityApi } from '@/lib/zodiosClients';
import { useToast } from '@/contexts/ToastContext';
import { useEffect, useState } from 'react';

/** Kept beside the step list the wizard renders; the hook only needs how many. */
export const STEP_COUNT = 5;

interface UseRiderOnboardingOptions {
  riderPhone: string;
  initialName?: string;
  userId?: string;
  /** Called once the last step lands. */
  onComplete: () => void;
}

/**
 * Every field, fetch and submit of rider onboarding.
 *
 * Split out of RiderOnboardingWizard, which held five steps, five submit handlers and the
 * whole render in one 407-line file. It is returned as one object so the step renderer takes
 * a single prop rather than the twenty-odd setters it would otherwise need.
 */
export function useRiderOnboarding({ riderPhone, initialName, userId, onComplete }: UseRiderOnboardingOptions) {
  const { showSuccess } = useToast();
  const [currentStep, setCurrentStep] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [verificationStatus, setVerificationStatus] = useState<Record<string, unknown> | null>(null);

  // Form State
  const [cityId, setCityId] = useState('BLR');
  const [name, setName] = useState(initialName || '');
  const [photo, setPhoto] = useState('');
  const [vehicle, setVehicle] = useState('');
  const [vehicleType, setVehicleType] = useState('BICYCLE');

  const [dlNumber, setDlNumber] = useState('');
  const [dob, setDob] = useState('');
  const [dlDoc, setDlDoc] = useState('');

  const [rcNumber, setRcNumber] = useState('');
  const [rcDoc, setRcDoc] = useState('');

  const [bankAccount, setBankAccount] = useState('');
  const [ifsc, setIfsc] = useState('');

  const [selfieDoc, setSelfieDoc] = useState('');

  useEffect(() => {
     
    // eslint-disable-next-line react-hooks/immutability
    loadStatus();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadStatus = async () => {
    try {
      const verRes = await deliveryApi.deliveryVerification.get(`/api/delivery/verification/status`, {});
      if (verRes?.data) {
        setVerificationStatus({
          ...verRes.data,
          dlApproved: verRes.data.dlStatus === 'VERIFIED' || verRes.data.dlStatus === 'APPROVED',
          rcApproved: verRes.data.rcStatus === 'VERIFIED' || verRes.data.rcStatus === 'APPROVED',
          bankApproved: verRes.data.bankStatus === 'VERIFIED' || verRes.data.bankStatus === 'APPROVED'
        });
      }

      const deliveryRes = await deliveryApi.deliveryExecutive.get('/api/delivery/profile', { queries: { phoneNumber: riderPhone }, headers: { "X-User-Id": userId } });
      if (deliveryRes?.data) {
        setVehicle(deliveryRes.data.vehicleNumber || '');
        setVehicleType(deliveryRes.data.vehicleType || 'BICYCLE');
        setPhoto(deliveryRes.data.photoUrl || '');
        if (deliveryRes.data.fullName && !name) setName(deliveryRes.data.fullName);
      }
    } catch (e: unknown) {
      console.error("Error loading onboarding status", e);
    }
  };

  const handleNext = () => {
    setErrorMsg('');
    setCurrentStep(s => Math.min(STEP_COUNT - 1, s + 1));
  };

  const submitProfile = async () => {
    if (!name || !vehicle) {
      setErrorMsg('Please fill in all required fields.');
      return;
    }
    setIsSubmitting(true);
    try {
      if (!initialName && userId) {
        await identityApi.user.put('/api/v1/users/profile', { id: userId, name, phone: riderPhone }, { headers: { "X-User-Id": userId } });
      }
      await deliveryApi.deliveryExecutive.post('/api/delivery/onboard', {
        cityId: cityId,
        phoneNumber: riderPhone,
        fullName: name,
        vehicleNumber: vehicle,
        vehicleType: vehicleType as "BICYCLE" | "EV_TWO_WHEELER" | "MCWG" | "LMV",
        photoUrl: photo
      }, {});
      showSuccess('Profile saved');
      await loadStatus();
      handleNext();
    } catch (e: unknown) {
      const axiosErr = e as { response?: { data?: { message?: string, error?: string } }, message?: string };
      setErrorMsg(axiosErr.response?.data?.message || axiosErr.response?.data?.error || axiosErr.message || 'Failed to save profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitDL = async () => {
    if (!dlNumber || !dob || !dlDoc) {
      setErrorMsg('Please complete all DL fields.');
      return;
    }
    setIsSubmitting(true);
    try {
      // @ts-expect-error auto-migration type suppression
      await deliveryApi.deliveryVerification.post(`/api/delivery/verification/driving-license`, { dlNumber, documentUrl: dlDoc, dob: dob });
      showSuccess('Driving License submitted');
      await loadStatus();
      handleNext();
    } catch (e: unknown) {
      const axiosErr = e as { response?: { data?: { error?: string } } };
      setErrorMsg(axiosErr.response?.data?.error || 'Failed to verify DL');
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitRC = async () => {
    if (!rcNumber || !rcDoc) {
      setErrorMsg('Please complete all RC fields.');
      return;
    }
    setIsSubmitting(true);
    try {
      await deliveryApi.deliveryVerification.post(`/api/delivery/verification/vehicle-rc`, { registrationNumber: rcNumber, documentUrl: rcDoc });
      showSuccess('Vehicle RC submitted');
      await loadStatus();
      handleNext();
    } catch (e: unknown) {
      const axiosErr = e as { response?: { data?: { error?: string } } };
      setErrorMsg(axiosErr.response?.data?.error || 'Failed to verify RC');
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitBank = async () => {
    if (!bankAccount || !ifsc) {
      setErrorMsg('Please complete all bank fields.');
      return;
    }
    setIsSubmitting(true);
    try {
      await deliveryApi.deliveryVerification.post(`/api/delivery/verification/bank-account`, { accountNumber: bankAccount, ifscCode: ifsc, kycFullName: name });
      showSuccess('Bank Verification Initiated (Penny Drop)');
      await loadStatus();
      handleNext();
    } catch (e: unknown) {
      setErrorMsg(parseApiError(e, 'Failed to verify bank').message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitSelfie = async () => {
    if (!selfieDoc) {
      setErrorMsg('Please upload a selfie.');
      return;
    }
    setIsSubmitting(true);
    try {
      await deliveryApi.deliveryVerification.post(`/api/delivery/verification/biometric`, { selfieUrl: selfieDoc });
      showSuccess('Biometric check complete!');
      await loadStatus();
      onComplete(); // Done!
    } catch (e: unknown) {
      setErrorMsg(parseApiError(e, 'Face match failed').message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    currentStep, setCurrentStep,
    errorMsg, setErrorMsg,
    isSubmitting,
    verificationStatus,
    cityId, setCityId,
    name, setName,
    photo, setPhoto,
    vehicle, setVehicle,
    vehicleType, setVehicleType,
    dlNumber, setDlNumber,
    dob, setDob,
    dlDoc, setDlDoc,
    rcNumber, setRcNumber,
    rcDoc, setRcDoc,
    bankAccount, setBankAccount,
    ifsc, setIfsc,
    selfieDoc, setSelfieDoc,
    handleNext,
    submitProfile, submitDL, submitRC, submitBank, submitSelfie,
  };
}
