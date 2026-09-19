import React, { useEffect, useState } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import type { UserRole } from '@/types';
import { RoleSelector } from '@features/identity/components/RoleSelector';
import SessionManagementModal from '@features/identity/components/SessionManagementModal';
import { useOtpLogin } from '@features/identity/model/useOtpLogin';
import { SPECIALS_COUNT } from '@features/identity/model/specials';
import { CompleteProfileModal, RoleShell } from '@shared/ui';
import { AnimatePresence } from 'motion/react';
import { AuthForm } from './AuthForm';
import { LoginFooter } from './LoginFooter';
import { LoginHeader } from './LoginHeader';
import { OtpNotification } from './OtpNotification';

/**
 * Sign in: pick a role, enter a phone number, enter the OTP.
 *
 * Was 470 lines holding the auth flow, the chrome, the SMS simulation, two modals and four
 * separate safe-area calculations. The flow is now `model/useOtpLogin`, the chrome is three
 * components, and the insets belong to `RoleShell` — which is what the Phase 4 gate checks.
 */

interface LoginScreenProps {
  onLoginSuccess: (role: UserRole, phoneNumber: string, name: string) => void;
  onAddApiLog?: (log: unknown) => void;
}

export default function LoginScreen({ onLoginSuccess, onAddApiLog }: LoginScreenProps) {
  const { theme } = useTheme();
  const login = useOtpLogin({ onLoginSuccess, onAddApiLog });
  const [scrollTop, setScrollTop] = useState(0);
  const [specialIndex, setSpecialIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setSpecialIndex((i) => (i + 1) % SPECIALS_COUNT), 5000);
    return () => clearInterval(timer);
  }, []);

  const back = () => {
    setScrollTop(0);
    login.back();
  };

  return (
    <RoleShell
      label="Sign in"
      onScroll={setScrollTop}
      header={
        <LoginHeader hasRole={Boolean(login.selectedRole)} scrollTop={scrollTop} onBack={back} />
      }
    >
      <div className="relative flex flex-col min-h-full">
        <OtpNotification
          open={login.showNotification}
          otp={login.generatedOtp}
          onAutofill={login.autofillOtp}
        />

        <div className="flex-1 flex flex-col justify-start my-3 sm:my-6 w-full max-w-7xl mx-auto px-4 sm:px-8">
          <AnimatePresence mode="wait">
            {!login.selectedRole ? (
              <RoleSelector onSelectRole={login.setSelectedRole} />
            ) : (
              <AuthForm
                selectedRole={login.selectedRole}
                phone={login.phoneNumber}
                setPhone={login.setPhone}
                otpCode={login.otpCode}
                setOtpCode={login.setOtpCode}
                otpSent={login.otpSent}
                loading={login.loading}
                error={login.error}
                onSendOtp={login.sendOtp}
                onVerifyOtp={login.verifyOtp}
                onResendOtp={login.resendOtp}
                onAutofillOtp={login.autofillOtp}
              />
            )}
          </AnimatePresence>
        </div>

        <LoginFooter specialIndex={specialIndex} />
      </div>

      <SessionManagementModal
        isOpen={login.showSessionModal}
        onClose={() => login.setShowSessionModal(false)}
        sessions={login.activeSessions}
        phoneNumber={login.phoneNumber}
        otpCode={login.otpCode}
        serviceName={login.serviceName}
        theme={theme}
        onSuccess={login.onSessionResolved}
      />

      <CompleteProfileModal
        isOpen={login.showProfileModal}
        theme={theme}
        profileId={login.pendingLoginData?.id || ''}
        onComplete={login.onProfileCompleted}
      />
    </RoleShell>
  );
}
