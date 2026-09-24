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
        {/* The photographic background has been removed as per user request */}

        <OtpNotification
          open={login.showNotification}
          otp={login.generatedOtp}
          onAutofill={login.autofillOtp}
        />

        {/* `relative z-10` is load-bearing, not decoration.

            `CinematicFoodBackground` is `position: fixed; z-0`. This content div was NOT
            positioned, and in CSS paint order a non-positioned block paints BELOW a positioned
            element with z-index 0 -- so the scrim was painting over the role cards, not behind
            them. Every card on this screen was being seen THROUGH the overlay. That is why the
            sign-in screen read as washed out no matter what the cards themselves were styled
            like, and it is invisible to a hit test because the background layer is
            `pointer-events-none`. */}
        <div className="relative z-10 flex-1 flex flex-col justify-start my-3 sm:my-6 w-full max-w-7xl mx-auto px-4 sm:px-8">
          {/* No mode="wait" and keyed branches: both children are components, not motion
              elements, so under "wait" an unreported exit would leave sign-in stuck on the role
              picker. The keys differ from the ones the children put on their own motion roots
              (presence_audit.mjs R1-R3). */}
          <AnimatePresence initial={false}>
            {!login.selectedRole ? (
              <RoleSelector key="panel-role" onSelectRole={login.setSelectedRole} />
            ) : (
              <AuthForm
                key="panel-auth"
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

        <div className="relative z-10">
          <LoginFooter specialIndex={specialIndex} />
        </div>
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
