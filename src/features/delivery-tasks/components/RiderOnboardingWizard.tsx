import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertCircle, CheckCircle, ChevronRight, FileText, Car, Landmark, UserSquare, Loader2, LogOut } from 'lucide-react';
import { customerApi, deliveryApi, identityApi, restaurantApi, walletApi, adminApi, trackingApi } from "@/lib/zodiosClients";
import DocumentUploadField from "@features/kyc/components/DocumentUploadField";
import ImageUploadField from "@features/kyc/components/ImageUploadField";
import { z } from 'zod';
import { CinematicFoodBackground } from "@shared/ui";
import { useToast } from "@/context/ToastContext";
import { FormField, Input, Button, Spinner } from '@shared/ui';

interface RiderOnboardingWizardProps {
  riderPhone: string;
  theme: 'light' | 'dark';
  onComplete: () => void;
  userId: string;
  initialName: string;
  onLogout?: () => void;
}

const steps = [
  { id: 'profile', title: 'Basic Profile', icon: UserSquare, description: 'Personal details & photo' },
  { id: 'dl', title: 'Driving License', icon: FileText, description: 'Verify your license' },
  { id: 'rc', title: 'Vehicle RC', icon: Car, description: 'Vehicle registration' },
  { id: 'bank', title: 'Bank Account', icon: Landmark, description: 'For your earnings' },
  { id: 'selfie', title: 'Face Match', icon: UserSquare, description: 'Biometric verification' }
];

export default function RiderOnboardingWizard({ riderPhone, theme, onComplete, userId, initialName, onLogout }: RiderOnboardingWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showSuccess, showError } = useToast();

  const [verificationStatus, setVerificationStatus] = useState<any>(null);

  // Form State
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
    loadStatus();
  }, []);

  const loadStatus = async () => {
    try {
      const verRes = await deliveryApi.deliveryVerification.get(`/api/delivery/verification/status`, {});
      if (verRes?.data) {
        setVerificationStatus(verRes.data);
      }
      
      const deliveryRes = await deliveryApi.deliveryExecutive.get('/api/delivery/profile');
      if (deliveryRes?.data) {
        setVehicle(deliveryRes.data.vehicleNumber || '');
        setVehicleType(deliveryRes.data.vehicleType || 'BICYCLE');
        setPhoto(deliveryRes.data.photoUrl || '');
        if (deliveryRes.data.fullName && !name) setName(deliveryRes.data.fullName);
      }
    } catch (e) {
      console.error("Error loading onboarding status", e);
    }
  };

  const handleNext = () => {
    setErrorMsg('');
    setCurrentStep(s => Math.min(steps.length - 1, s + 1));
  };

  const submitProfile = async () => {
    if (!name || !vehicle) {
      setErrorMsg('Please fill in all required fields.');
      return;
    }
    setIsSubmitting(true);
    try {
      if (!initialName && userId) {
        await identityApi.user.put('/api/v1/users/profile', { id: userId, name, phone: riderPhone }, {});
      }
      await deliveryApi.deliveryExecutive.post('/api/delivery/onboard', {
              phoneNumber: riderPhone,
              fullName: name,
              vehicleNumber: vehicle,
              vehicleType: vehicleType as "BICYCLE" | "EV_TWO_WHEELER" | "MCWG" | "LMV",
              photoUrl: photo
            }, {});
      showSuccess('Profile saved');
      handleNext();
    } catch (e: any) {
      setErrorMsg(e.response?.data?.message || e.response?.data?.error || e.message || 'Failed to save profile');
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
      await deliveryApi.deliveryVerification.post(`/api/delivery/verification/driving-license`, { dlNumber, documentUrl: dlDoc, dob: dob });
      showSuccess('Driving License submitted');
      await loadStatus();
      handleNext();
    } catch (e: any) {
      setErrorMsg(e.response?.data?.error || 'Failed to verify DL');
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
    } catch (e: any) {
      setErrorMsg(e.response?.data?.error || 'Failed to verify RC');
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
    } catch (e: any) {
      setErrorMsg(e.response?.data?.error || 'Failed to verify bank');
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
    } catch (e: any) {
      setErrorMsg(e.response?.data?.error || 'Face match failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepContent = () => {
    switch(currentStep) {
      case 0:
        return (
          <div className="space-y-4">
            <FormField label="Full Name" required>
              <Input type="text" value={name} onChange={e => setName(e.target.value)} disabled={!!initialName} />
            </FormField>
            <FormField label="Vehicle Type" required>
              <select value={vehicleType} onChange={e => setVehicleType(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-rose-500/20 bg-white/20 dark:bg-slate-900/20 backdrop-blur-md text-sm font-bold text-slate-900 dark:text-white outline-none focus:border-rose-500/50">
                <option value="BICYCLE">Bicycle</option>
                <option value="EV_TWO_WHEELER">EV Two-Wheeler</option>
                <option value="MCWG">Motorcycle / Scooter</option>
                <option value="LMV">Car / LMV</option>
              </select>
            </FormField>
            <FormField label="Vehicle Number (if applicable)">
              <Input type="text" value={vehicle} onChange={e => setVehicle(e.target.value)} />
            </FormField>
            <FormField label="Profile Photo" required>
              <ImageUploadField value={photo} onChange={setPhoto} folderId={userId || 'onboarding'} placeholder="Upload clear profile photo" />
            </FormField>
            <Button onClick={submitProfile} disabled={isSubmitting} variant="primary" fullWidth className="!mt-4 !py-3.5 shadow-md">
              {isSubmitting ? <Spinner size="xs" /> : <ChevronRight className="w-4 h-4" />}
              Save & Continue
            </Button>
          </div>
        );
      case 1:
        if (verificationStatus?.dlApproved) {
          return (
             <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
                <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-8 h-8 text-emerald-500" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">Driving License Approved</h3>
                  <p className="text-sm text-slate-500">Your DL has been verified successfully.</p>
                </div>
                <Button onClick={handleNext} variant="primary" fullWidth>Continue</Button>
             </div>
          );
        }
        return (
          <div className="space-y-4">
            <FormField label="DL Number" required>
              <Input type="text" value={dlNumber} onChange={e => setDlNumber(e.target.value)} />
            </FormField>
            <FormField label="Date of Birth" required>
              <Input type="date" value={dob} onChange={e => setDob(e.target.value)} />
            </FormField>
            <FormField label="Upload DL Image" required>
              <DocumentUploadField value={dlDoc} onChange={setDlDoc} docType="DRIVING_LICENSE" placeholder="Upload Front of DL" />
            </FormField>
            <Button onClick={submitDL} disabled={isSubmitting} variant="primary" fullWidth className="!mt-4 !py-3.5 shadow-md">
              {isSubmitting ? <Spinner size="xs" /> : <ChevronRight className="w-4 h-4" />}
              Verify License
            </Button>
          </div>
        );
      case 2:
        if (verificationStatus?.rcApproved) {
          return (
             <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
                <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-8 h-8 text-emerald-500" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">Vehicle RC Approved</h3>
                  <p className="text-sm text-slate-500">Your vehicle registration is verified.</p>
                </div>
                <Button onClick={handleNext} variant="primary" fullWidth>Continue</Button>
             </div>
          );
        }
        return (
          <div className="space-y-4">
            <FormField label="Registration Number (Plate)" required>
              <Input type="text" value={rcNumber} onChange={e => setRcNumber(e.target.value)} />
            </FormField>
            <FormField label="Upload RC Document" required>
              <DocumentUploadField value={rcDoc} onChange={setRcDoc} docType="RC" placeholder="Upload RC PDF/Image" />
            </FormField>
            <Button onClick={submitRC} disabled={isSubmitting} variant="primary" fullWidth className="!mt-4 !py-3.5 shadow-md">
              {isSubmitting ? <Spinner size="xs" /> : <ChevronRight className="w-4 h-4" />}
              Verify Vehicle
            </Button>
          </div>
        );
      case 3:
        if (verificationStatus?.bankApproved) {
          return (
             <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
                <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-8 h-8 text-emerald-500" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">Bank Verified</h3>
                  <p className="text-sm text-slate-500">Penny drop successful. Name matches.</p>
                </div>
                <Button onClick={handleNext} variant="primary" fullWidth>Continue</Button>
             </div>
          );
        }
        return (
          <div className="space-y-4">
            <FormField label="Account Number" required>
              <Input type="text" value={bankAccount} onChange={e => setBankAccount(e.target.value)} />
            </FormField>
            <FormField label="IFSC Code" required>
              <Input type="text" value={ifsc} onChange={e => setIfsc(e.target.value)} />
            </FormField>
            <Button onClick={submitBank} disabled={isSubmitting} variant="primary" fullWidth className="!mt-4 !py-3.5 shadow-md">
              {isSubmitting ? <Spinner size="xs" /> : <ChevronRight className="w-4 h-4" />}
              Initiate Penny Drop
            </Button>
          </div>
        );
      case 4:
        return (
          <div className="space-y-4">
            <p className="text-sm text-slate-500 mb-4">Please upload a clear selfie to match against your Driving License photo.</p>
            <FormField label="Upload Selfie" required>
              <DocumentUploadField value={selfieDoc} onChange={setSelfieDoc} docType="SELFIE" placeholder="Take a clear selfie" />
            </FormField>
            <Button onClick={submitSelfie} disabled={isSubmitting} variant="success" fullWidth className="!mt-4 !py-3.5 shadow-md">
              {isSubmitting ? <Spinner size="xs" /> : <CheckCircle className="w-4 h-4" />}
              Complete Verification
            </Button>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 z-0">
         <CinematicFoodBackground theme={theme} />
         <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      </div>
      
      <motion.div 
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className={`w-full max-w-xl z-10 p-6 md:p-8 rounded-3xl shadow-2xl border ${theme === 'dark' ? 'bg-slate-900/90 border-slate-800' : 'bg-white/95 border-white'} backdrop-blur-xl relative flex flex-col max-h-[90vh]`}
      >
        {onLogout && (
          <div className="absolute top-4 right-4 md:top-6 md:right-6 z-20">
            <Button onClick={onLogout} variant="danger" title="Logout">
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </Button>
          </div>
        )}
        
        <div className="text-center mb-8 shrink-0 mt-4 md:mt-0">
          <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-orange-500 mb-2">Partner Onboarding</h2>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Complete your KYC to start delivering</p>
        </div>

        {/* Stepper */}
        <div className="flex items-center justify-between mb-8 relative shrink-0">
          <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-slate-200 dark:bg-slate-800 -z-10 -translate-y-1/2" />
          {steps.map((step, idx) => {
            const Icon = step.icon;
            const isActive = currentStep === idx;
            const isPast = currentStep > idx;
            return (
              <div key={step.id} className="flex flex-col items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors duration-500 shadow-sm ${isActive ? 'bg-rose-500 text-white scale-110' : isPast ? 'bg-emerald-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500'}`}>
                  {isPast ? <CheckCircle className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                </div>
              </div>
            );
          })}
        </div>

        {errorMsg && (
          <div className="mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs flex items-start gap-2 shrink-0">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="font-bold leading-relaxed">{errorMsg}</span>
          </div>
        )}

        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -20, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <div className="mb-6">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  {steps[currentStep].title}
                </h3>
                <p className="text-xs font-medium text-slate-500">{steps[currentStep].description}</p>
              </div>
              
              {renderStepContent()}
            </motion.div>
          </AnimatePresence>
        </div>
        
      </motion.div>
    </div>
  );
}
