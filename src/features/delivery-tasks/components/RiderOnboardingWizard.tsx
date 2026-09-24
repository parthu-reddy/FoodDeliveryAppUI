import { Surface, surfaceStyle } from '@shared/ui';
import { STEP_COUNT, useRiderOnboarding } from '@features/delivery-tasks/model/useRiderOnboarding';
import DocumentUploadField from "@features/kyc/components/DocumentUploadField";
import ImageUploadField from "@features/kyc/components/ImageUploadField";
import { Button, FormField, Input, Select, Spinner } from '@shared/ui';
import { AlertCircle, Car, CheckCircle, ChevronRight, FileText, Landmark, LogOut, UserSquare } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useMotionPresets } from '@shared/ui';

interface RiderOnboardingWizardProps {
  riderPhone: string;
  theme: 'light' | 'dark';
  onComplete: () => void;
  userId: string;
  initialName: string;
  onLogout?: () => void;
}

// One entry per step the hook counts; STEP_COUNT asserts they stay in step.
const steps = [
  { id: 'profile', title: 'Basic Profile', icon: UserSquare, description: 'Personal details & photo' },
  { id: 'dl', title: 'Driving License', icon: FileText, description: 'Verify your license' },
  { id: 'rc', title: 'Vehicle RC', icon: Car, description: 'Vehicle registration' },
  { id: 'bank', title: 'Bank Account', icon: Landmark, description: 'For your earnings' },
  { id: 'selfie', title: 'Face Match', icon: UserSquare, description: 'Biometric verification' }
];

if (steps.length !== STEP_COUNT) {
  throw new Error(`steps and STEP_COUNT disagree: ${steps.length} vs ${STEP_COUNT}`);
}

export default function RiderOnboardingWizard({ riderPhone, onComplete, userId, initialName, onLogout }: RiderOnboardingWizardProps) {
  const {
    currentStep, errorMsg, isSubmitting, verificationStatus,
    cityId, setCityId,
    name, setName, photo, setPhoto, vehicle, setVehicle, vehicleType, setVehicleType,
    dlNumber, setDlNumber, dob, setDob, dlDoc, setDlDoc,
    rcNumber, setRcNumber, rcDoc, setRcDoc,
    bankAccount, setBankAccount, ifsc, setIfsc, selfieDoc, setSelfieDoc,
    handleNext, submitProfile, submitDL, submitRC, submitBank, submitSelfie,
  } = useRiderOnboarding({ riderPhone, initialName, userId, onComplete });



  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-4">
            <FormField label="Full Name" required>
              <Input type="text" value={name} onChange={e => setName(e.target.value)} disabled={!!initialName} />
            </FormField>
            <FormField label="City" required>
              <Select
                selectSize="lg"
                aria-label="City"
                value={cityId}
                onChange={setCityId}
                options={[
                  { value: 'HYD', label: 'Hyderabad' },
                  { value: 'BLR', label: 'Bengaluru' },
                  { value: 'MUM', label: 'Mumbai' },
                ]}
              />
            </FormField>
            <FormField label="Vehicle Type" required>
              <Select
                selectSize="lg"
                aria-label="Vehicle Type"
                value={vehicleType}
                onChange={setVehicleType}
                options={[
                  { value: 'BICYCLE', label: 'Bicycle' },
                  { value: 'EV_TWO_WHEELER', label: 'EV Two-Wheeler' },
                  { value: 'MCWG', label: 'Motorcycle / Scooter' },
                  { value: 'LMV', label: 'Car / LMV' },
                ]}
              />
            </FormField>
            <FormField label="Vehicle Number (if applicable)">
              <Input type="text" value={vehicle} onChange={e => setVehicle(e.target.value)} />
            </FormField>
            <FormField label="Profile Photo" required>
              <ImageUploadField value={photo} onChange={setPhoto} folderId={userId || 'onboarding'} placeholder="Upload clear profile photo" />
            </FormField>
            <Button onClick={submitProfile} disabled={isSubmitting} size="touch" variant="primary" fullWidth className="!mt-4">
              {isSubmitting ? <Spinner size="xs" /> : <ChevronRight className="w-4 h-4" />}
              Save & Continue
            </Button>
          </div>
        );
      case 1:
        if (verificationStatus?.dlApproved) {
          return (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-amber-500" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Driving License Approved</h3>
                <p className="text-sm text-slate-500">Your DL has been verified successfully.</p>
              </div>
              <Button onClick={handleNext} size="touch" variant="primary" fullWidth>Continue</Button>
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
            <Button onClick={submitDL} disabled={isSubmitting} size="touch" variant="primary" fullWidth className="!mt-4">
              {isSubmitting ? <Spinner size="xs" /> : <ChevronRight className="w-4 h-4" />}
              Verify License
            </Button>
          </div>
        );
      case 2:
        if (verificationStatus?.rcApproved) {
          return (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-amber-500" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Vehicle RC Approved</h3>
                <p className="text-sm text-slate-500">Your vehicle registration is verified.</p>
              </div>
              <Button onClick={handleNext} size="touch" variant="primary" fullWidth>Continue</Button>
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
            <Button onClick={submitRC} disabled={isSubmitting} size="touch" variant="primary" fullWidth className="!mt-4">
              {isSubmitting ? <Spinner size="xs" /> : <ChevronRight className="w-4 h-4" />}
              Verify Vehicle
            </Button>
          </div>
        );
      case 3:
        if (verificationStatus?.bankApproved) {
          return (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-amber-500" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Bank Verified</h3>
                <p className="text-sm text-slate-500">Penny drop successful. Name matches.</p>
              </div>
              <Button onClick={handleNext} size="touch" variant="primary" fullWidth>Continue</Button>
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
            <Button onClick={submitBank} disabled={isSubmitting} size="touch" variant="primary" fullWidth className="!mt-4">
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
            <Button onClick={submitSelfie} disabled={isSubmitting} size="touch" variant="success" fullWidth className="!mt-4">
              {isSubmitting ? <Spinner size="xs" /> : <CheckCircle className="w-4 h-4" />}
              Complete Verification
            </Button>
          </div>
        );
      default:
        return null;
    }
  };

  const presets = useMotionPresets();
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 z-0">
        <Surface elevation={0} className="absolute inset-0" />
      </div>

      <motion.div {...presets.rise}
        className="w-full max-w-xl z-10 p-6 md:p-8 relative flex flex-col max-h-[90vh]"
        style={surfaceStyle({ variant: 'glass-overlay', radius: 'lg', elevation: 4 })}
      >
        {onLogout && (
          <div className="absolute top-4 right-4 md:top-6 md:right-6 z-20">
            <Button onClick={onLogout} size="touch" variant="danger" title="Logout">
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </Button>
          </div>
        )}

        <div className="text-center mb-8 shrink-0 mt-4 md:mt-0">
          <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-amber-500 mb-2">Partner Onboarding</h2>
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
                <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors duration-500 ${isActive ? 'bg-rose-500 text-white scale-110' : isPast ? 'bg-amber-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500'}`}>
                  {isPast ? <CheckCircle className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                </div>
              </div>
            );
          })}
        </div>

        {errorMsg && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-start gap-2 shrink-0">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="font-bold leading-relaxed">{errorMsg}</span>
          </div>
        )}

        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep} {...presets.slideInX}
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
