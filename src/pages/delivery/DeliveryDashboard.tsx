import { useTheme } from "@/contexts/ThemeContext";
import { useToast } from "@/contexts/ToastContext";
import { getUserProfile } from "@/lib/tokenStore";
import { DeliveryStatus, Order, OrderStatus } from "@/types";
import { CallOverlay } from "@features/communication/components/CallOverlay";
import { ChatWidget } from "@features/communication/components/ChatWidget";
import { DeliveryActiveJob } from "@features/delivery-tasks/components/DeliveryActiveJob";
import { DeliveryAvailableJobs } from "@features/delivery-tasks/components/DeliveryAvailableJobs";
import { DeliveryHistoryPanel } from "@features/delivery-tasks/components/DeliveryHistoryPanel";
import { DispatchPingCard } from "@features/delivery-tasks/components/DispatchPingCard";
import { PermissionsPrompt, ProfileRequiredPrompt } from "@features/delivery-tasks/components/RiderPrompts";
import { RiderHeader } from "@features/delivery-tasks/components/RiderHeader";
import { ConnectionBanner, LocationBanner, RiderOfflineState, RiderToast } from "@features/delivery-tasks/components/RiderNotices";
import { RiderStatsBar } from "@features/delivery-tasks/components/RiderStatsBar";
import RiderOnboardingWizard from "@features/delivery-tasks/components/RiderOnboardingWizard";
import RiderSettingsView from "@features/delivery-tasks/components/RiderSettingsView";
import { useDeliveryOrders } from "@features/delivery-tasks/model/useDeliveryOrders";
import { useRiderDuty } from "@features/delivery-tasks/model/useRiderDuty";
import { useRiderJobActions } from "@features/delivery-tasks/model/useRiderJobActions";
import { useRiderProfile } from "@features/delivery-tasks/model/useRiderProfile";
import { DeliveryShell, ErrorBoundary, Spinner, useConfirm } from "@shared/ui";
import { AnimatePresence } from "motion/react";
import React, { useState } from "react";
import { useNavigate, useLocation } from 'react-router-dom';

/**
 * The rider's screen.
 *
 * Was 1,124 lines: the profile fetch, the permission gauntlet, both OTP flows, the wait
 * timer, the dispatch ping, two modals and the whole render, in one function. The logic is
 * now three hooks under `model/` and the chrome is four components; what is left here is the
 * composition and the three states that decide which of them to show.
 */

interface DeliveryDashboardProps {
  riderPhone: string;
  activeOrders?: Order[];
  onUpdateOrderStatus?: (
    orderId: string,
    status: OrderStatus,
    deliveryStatus?: DeliveryStatus,
    riderInfo?: { name: string }
  ) => void;
  onLogout: () => void;
  onAddApiLog?: (log: unknown) => void;
}

export default function DeliveryDashboard({
  riderPhone,
  activeOrders: externalOrders,
  onUpdateOrderStatus: externalUpdateStatus,
  onLogout,
  onAddApiLog,
}: DeliveryDashboardProps) {
  const { theme } = useTheme();
  const { showError } = useToast();
  const confirm = useConfirm();
  const [user] = useState(getUserProfile());
  const [isOnline, setIsOnline] = useState(false);
  const [showPermissionsPrompt, setShowPermissionsPrompt] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const navigate = useNavigate();
  const location = useLocation();

  // Route-derived state
  const isSettingsView = location.pathname.includes('/delivery/settings');
  const view = isSettingsView ? 'settings' : 'home';
  const setView = (v: 'home' | 'settings') => navigate(v === 'settings' ? '/delivery/settings' : '/delivery');

  const showHistory = location.pathname.includes('/delivery/history');
  const setShowHistory = (show: boolean) => navigate(show ? '/delivery/history' : '/delivery');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const profile = useRiderProfile({ riderPhone, showToast, setIsOnline });

  const {
    wsConnected, hasLocationFix, historyDateFilter, setHistoryDateFilter, historyPage, setHistoryPage,
    setActiveJobId, currentJob, pingJob, setPingJob, pingTimer,
    setRejectedIds, availableJobs, todayEarnings, todayCompletedCount, paginatedHistoryJobs,
    totalHistoryPages, historyRef, onUpdateOrderStatus,
  } = useDeliveryOrders({
    deliveryExecutiveId: profile.deliveryExecutiveId,
    deliveryExecutiveName: profile.deliveryExecutiveName,
    cityId: profile.cityId,
    isOnline,
    setIsOnline,
    showToast,
    externalOrders,
    // @ts-expect-error auto-migration type suppression
    externalUpdateStatus,
    setShowPermissionsPrompt,
    onAddApiLog,
    showHistory,
  });

  const duty = useRiderDuty({
    deliveryExecutiveId: profile.deliveryExecutiveId,
    isProfileMandatory: profile.isProfileMandatory,
    isOnline,
    setIsOnline,
    showToast,
    setShowPermissionsPrompt,
    setShowProfileRequiredPrompt: profile.setShowProfileRequiredPrompt,
  });

  const job = useRiderJobActions({
    currentJob,
    deliveryExecutiveId: profile.deliveryExecutiveId,
    deliveryExecutiveName: profile.deliveryExecutiveName,
    historyRef,
    setActiveJobId,
    setPingJob,
    setRejectedIds,
    onUpdateOrderStatus,
    confirm,
    showToast,
    showError,
    setIsOnline,
  });

  if (profile.isLoadingProfile || !profile.isVerificationLoaded) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-0 h-full gap-4">
        <Spinner size="md" color="var(--color-action)" />
        {!profile.isLoadingProfile && (
          <p className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--color-ink-2)' }}>
            Verifying Account
          </p>
        )}
      </div>
    );
  }

  const verified =
    profile.verificationStatus?.allDocsApproved && profile.verificationStatus?.bankApproved;

  if (!verified) {
    return (
      <RiderOnboardingWizard
        riderPhone={riderPhone}
        theme={theme}
        onComplete={() => {
          profile.setVerificationStatus({
            ...profile.verificationStatus,
            allDocsApproved: true,
            bankApproved: true,
          });
          profile.refresh().then((p) => {
            if (p?.fullName && p?.vehicleNumber) {
              profile.setIsProfileMandatory(false);
              profile.setShowProfileRequiredPrompt(false);
            }
          });
        }}
        userId={user?.id || ""}
        initialName={profile.deliveryExecutiveName}
        onLogout={onLogout}
      />
    );
  }

  return (
    <DeliveryShell
      header={
        <RiderHeader
          name={profile.deliveryExecutiveName}
          vehicleNumber={profile.vehicleNumber}
          photoUrl={profile.photoUrl}
          isOnline={isOnline}
          deliveryExecutiveId={profile.deliveryExecutiveId}
          isProfileMandatory={profile.isProfileMandatory}
          onToggleOnline={duty.handleToggleOnline}
          inSettings={view === "settings"}
          onToggleSettings={() => setView(view === "settings" ? "home" : "settings")}
        />
      }
    >
      <CallOverlay />

      <RiderToast message={toastMessage} />

      <ConnectionBanner visible={isOnline && !wsConnected && view === "home"} />
      <LocationBanner visible={isOnline && wsConnected && !hasLocationFix && view === "home"} />

      {view === "settings" ? (
        <RiderSettingsView
          onBack={() => setView("home")}
          theme={theme}
          onLogout={onLogout}
          isProfileMandatory={profile.isProfileMandatory}
          riderPhone={riderPhone}
          onProfileUpdated={() => {
            profile.refresh().then((p) => {
              if (!p) return;
              const wasMandatory = profile.isProfileMandatory;
              profile.setIsProfileMandatory(false);
              setView("home");
              if (wasMandatory) duty.handleToggleOnline();
            });
          }}
        />
      ) : (
        <>
          <RiderStatsBar
            todayEarnings={todayEarnings}
            todayCompletedCount={todayCompletedCount}
            deliveryExecutiveId={profile.deliveryExecutiveId}
            historyOpen={showHistory}
            onOpenHistory={() => setShowHistory(true)}
          />

          <AnimatePresence mode="wait">
            {showHistory ? (
              <ErrorBoundary fallbackLabel="Delivery History">
                <DeliveryHistoryPanel
                  setShowHistory={setShowHistory}
                  historyDateFilter={historyDateFilter}
                  setHistoryDateFilter={setHistoryDateFilter}
                  setHistoryPage={setHistoryPage}
                  historyPage={historyPage}
                  totalHistoryPages={totalHistoryPages}
                  paginatedHistoryJobs={paginatedHistoryJobs}
                />
              </ErrorBoundary>
            ) : !isOnline ? (
              <RiderOfflineState />
            ) : currentJob ? (
              <ErrorBoundary fallbackLabel="Active Job">
                <DeliveryActiveJob
                  currentJob={currentJob}
                  enteredPickupOtp={job.enteredPickupOtp}
                  setEnteredPickupOtp={job.setEnteredPickupOtp}
                  pickupOtpError={job.pickupOtpError}
                  isUpdatingPickup={job.isUpdatingPickup}
                  handleArrivedAtRestaurant={job.handleArrivedAtRestaurant}
                  handlePickUpFood={job.handlePickUpFood}
                  handleAbortJob={job.handleAbortJob}
                  handleCompleteDelivery={job.handleCompleteDelivery}
                  enteredOtp={job.enteredOtp}
                  setEnteredOtp={job.setEnteredOtp}
                  otpError={job.otpError}
                  isUpdatingDelivery={job.isUpdatingDelivery}
                  goOfflineAfter={job.goOfflineAfter}
                  setGoOfflineAfter={job.setGoOfflineAfter}
                  waitTimerSeconds={job.waitTimerSeconds}
                  handleCustomerUnavailable={job.handleCustomerUnavailable}
                />
              </ErrorBoundary>
            ) : (
              <ErrorBoundary fallbackLabel="Available Jobs">
                <DeliveryAvailableJobs
                  availableJobs={availableJobs}
                  handleAcceptJob={job.handleAcceptJob}
                />
              </ErrorBoundary>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {pingJob && (
              <DispatchPingCard
                job={pingJob}
                secondsLeft={pingTimer}
                onAccept={job.handleAcceptPing}
                onDecline={job.handleRejectPing}
              />
            )}
          </AnimatePresence>

          <PermissionsPrompt
            open={showPermissionsPrompt}
            onClose={() => setShowPermissionsPrompt(false)}
            onAct={duty.requestPermissionsAndGoOnline}
          />
          <ProfileRequiredPrompt
            open={profile.showProfileRequiredPrompt}
            onClose={() => profile.setShowProfileRequiredPrompt(false)}
            onAct={() => {
              profile.setShowProfileRequiredPrompt(false);
              setView("settings");
            }}
          />
        </>
      )}

      {currentJob && (
        <ChatWidget
          orderId={currentJob.id}
          order={currentJob}
          currentUserType="DELIVERY"
          otherParticipants={[
            ...(currentJob.customerId
              ? [{ userId: currentJob.customerId, entityType: "CUSTOMER" as const, displayName: "Customer" }]
              : []),
            ...(currentJob.restaurantId
              ? [{ userId: currentJob.restaurantId, entityType: "RESTAURANT" as const, displayName: currentJob.restaurantName || "Restaurant" }]
              : []),
          ]}
        />
      )}
    </DeliveryShell>
  );
}
