import React, { useState, useEffect } from "react";
import { useToast } from "@/context/ToastContext";
import {
  Bike,
  DollarSign,
  Check,
  ShieldAlert,
  Store,
  Sun,
  Moon,
  AlertCircle,
  User,
  ArrowLeft,
  X,
  MapPinOff,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { z } from "zod";
import { Order, OrderStatus, DeliveryStatus } from "@/types";
import LaBouffeLogo from '@shared/ui/LaBouffeLogo';
import {
  customerApi,
  deliveryApi,
  identityApi,
  restaurantApi,
  walletApi,
  adminApi,
  trackingApi,
} from "@/lib/zodiosClients";
import { getUserProfile } from "@/lib/tokenStore";
import RiderSettingsView from "@features/delivery-tasks/components/RiderSettingsView";
import RiderOnboardingWizard from "@features/delivery-tasks/components/RiderOnboardingWizard";
import ImageLoader from '@shared/ui/ImageLoader';
import { ChatWidget } from "@features/communication/components/ChatWidget";
import { CallOverlay } from "@features/communication/components/CallOverlay";
import { ErrorBoundary } from "@shared/ui";
import { useDeliveryOrders } from "@features/delivery-tasks/model/useDeliveryOrders";
import { DeliveryAvailableJobs } from "@features/delivery-tasks/components/DeliveryAvailableJobs";
import { DeliveryHistoryPanel } from "@features/delivery-tasks/components/DeliveryHistoryPanel";
import { DeliveryActiveJob } from "@features/delivery-tasks/components/DeliveryActiveJob";
import { DeliveryOnlineToggle } from "@features/delivery-tasks/components/DeliveryOnlineToggle";
import { Button, Modal } from '@shared/ui';
import { useTheme } from "@/context/ThemeContext";
import { parseApiError } from '@/lib/parseApiError';

const otpSchema = z
  .string()
  .length(6, "OTP must be exactly 6 digits")
  .regex(/^\d+$/, "OTP must contain only digits");

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
  onAddApiLog?: (log: any) => void;
}

export default function DeliveryDashboard({
  riderPhone,
  activeOrders: externalOrders,
  onUpdateOrderStatus: externalUpdateStatus,
  onLogout,
  onAddApiLog,
}: DeliveryDashboardProps) {
  const { theme, toggleTheme } = useTheme();
  const { showError, showSuccess, showInfo } = useToast();
  const [user, setUser] = useState(getUserProfile());
  const [isOnline, setIsOnline] = useState(false);
  const [showPermissionsPrompt, setShowPermissionsPrompt] = useState(false);
  const [showProfileRequiredPrompt, setShowProfileRequiredPrompt] =
    useState(false);
  const [isProfileMandatory, setIsProfileMandatory] = useState(false);

  const [verificationStatus, setVerificationStatus] = useState<any>(null);
  const [isVerificationLoaded, setIsVerificationLoaded] = useState(false);

  const [enteredOtp, setEnteredOtp] = useState("");
  const [enteredPickupOtp, setEnteredPickupOtp] = useState("");
  const [pickupOtpError, setPickupOtpError] = useState("");
  const [otpError, setOtpError] = useState("");

  const [isUpdatingPickup, setIsUpdatingPickup] = useState(false);
  const [isUpdatingDelivery, setIsUpdatingDelivery] = useState(false);

  const [goOfflineAfter, setGoOfflineAfter] = useState(false);
  const [waitTimerSeconds, setWaitTimerSeconds] = useState(0);
  const [isWaitTimerActive, setIsWaitTimerActive] = useState(false);

  const [riderId, setRiderId] = useState("");
  const [riderName, setRiderName] = useState("");
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [view, setView] = useState<"home" | "settings">("home");

  const {
    activeOrders,
    wsConnected,
    historyDateFilter,
    setHistoryDateFilter,
    historyPage,
    setHistoryPage,
    showHistory,
    setShowHistory,
    activeJobId,
    setActiveJobId,
    currentJob,
    pingJob,
    setPingJob,
    pingTimer,
    setPingTimer,
    rejectedIds,
    setRejectedIds,
    availableJobs,
    todayEarnings,
    todayCompletedCount,
    paginatedHistoryJobs,
    totalHistoryPages,
    historyRef,
    onUpdateOrderStatus,
  } = useDeliveryOrders({
    riderId,
    riderName,
    isOnline,
    setIsOnline,
    showToast,
    externalOrders,
    externalUpdateStatus,
    setShowPermissionsPrompt,
    onAddApiLog,
  });

  useEffect(() => {
    // Fetch unified profile first
    identityApi.user.get(`/api/v1/users/profile`, {}).catch((err) => {
      if (err?.status !== 404)
        console.warn("Failed to fetch unified profile:", err);
    });

    // Fetch delivery-specific profile details
    deliveryApi.deliveryExecutive
      .get("/api/delivery/profile")
      .then((data) => {
        if (data.success) {
          const profile = data.data;
          if (!riderName) setRiderName(profile.fullName || profile.name || "");
          setVehicleNumber(profile.vehicleNumber || "");
          setPhotoUrl(profile.photoUrl || "");
          setIsOnline(
            profile.isOnline ||
              profile.status === "ONLINE" ||
              profile.status === "ON_DELIVERY"
          );
          setRiderId(profile.id);

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
          showToast(err.response?.data?.message || err.response?.data?.error || err.message || "Failed to load profile");
        }
      })
      .finally(() => setIsLoadingProfile(false));

    // Fetch verification status
    deliveryApi.deliveryVerification
      .get("/api/delivery/verification/status", {})
      .then((res) => {
        if (res?.data) setVerificationStatus(res.data);
      })
      .catch((err) => console.warn("Failed to fetch verification status", err))
      .finally(() => setIsVerificationLoaded(true));
  }, [riderPhone]);

  const requestPermissionsAndGoOnline = async () => {
    if ("Notification" in window && Notification.permission !== "granted") {
      const notifyPermission = await Notification.requestPermission();
      if (notifyPermission !== "granted") {
        showToast(
          "Notification permission is required. Please enable in browser settings if denied."
        );
        setShowPermissionsPrompt(false);
        return;
      }
    }

    if (!navigator.geolocation) {
      showToast("Geolocation is not supported by your browser");
      setShowPermissionsPrompt(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        setShowPermissionsPrompt(false);
        try {
          await deliveryApi.deliveryExecutive.post(
            `/api/delivery/status`,
            { driverId: riderId, available: true },
            {}
          );
          setIsOnline(true);
        } catch (e) {
          console.error("Failed to toggle status", e);
        }
      },
      (error) => {
        setShowPermissionsPrompt(false);
        showToast(
          "Location permission is required. Please enable in browser settings if denied."
        );
        console.error("Error getting location", error);
      },
      { enableHighAccuracy: true }
    );
  };

  const handleToggleOnline = async () => {
    if (!riderId || isProfileMandatory) {
      setShowProfileRequiredPrompt(true);
      return;
    }
    if (!isOnline) {
      let notifyGranted = false;
      if ("Notification" in window && Notification.permission === "granted") {
        notifyGranted = true;
      }

      let locationGranted = false;
      try {
        if (navigator.permissions) {
          const perm = await navigator.permissions.query({
            name: "geolocation",
          });
          if (perm.state === "granted") {
            locationGranted = true;
          }
        }
      } catch (e) {
        // Fallback or ignore if navigator.permissions is not supported
      }

      if (notifyGranted && locationGranted) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            try {
              await deliveryApi.deliveryExecutive.post(
                `/api/delivery/status`,
                { driverId: riderId, available: true },
                {}
              );
              setIsOnline(true);
            } catch (e) {
              console.error("Failed to toggle status", e);
            }
          },
          (error) => {
            setShowPermissionsPrompt(true);
            console.error("Error getting location", error);
          },
          { enableHighAccuracy: true }
        );
      } else {
        setShowPermissionsPrompt(true);
      }
    } else {
      try {
        await deliveryApi.deliveryExecutive.post(
          `/api/delivery/status`,
          { driverId: riderId, available: false },
          {}
        );
        setIsOnline(false);
      } catch (e) {
        console.error("Failed to toggle status", e);
      }
    }
  };

  const handleAcceptPing = async (job: Order) => {
    // Optimistic UI update
    setActiveJobId(job.id);
    onUpdateOrderStatus(job.id, job.status, DeliveryStatus.ASSIGNED, {
      name: riderName,
    });
    try {
      await deliveryApi.deliveryExecutive.post(
        "/api/delivery/drivers/:driverId/orders/:orderId/accept",
        undefined,
        { params: { driverId: riderId, orderId: job.id } }
      );
    } catch (e: any) {
      // Revert on error
      setActiveJobId(null);
      // Wait, can't easily revert onUpdateOrderStatus without knowing previous state, but we can rely on polling to fix it soon
      showToast(
        e.response?.data?.message ||
          "Failed to accept order. Ping expired or order already accepted."
      );
    } finally {
      setPingJob(null);
    }
  };

  const handleRejectPing = async (jobId: string) => {
    // Optimistic UI update
    setRejectedIds((prev) => new Set(prev).add(jobId));
    setPingJob(null);
    try {
      await deliveryApi.deliveryExecutive.post(
        "/api/delivery/drivers/:driverId/orders/:orderId/reject",
        undefined,
        { params: { driverId: riderId, orderId: jobId } }
      );
    } catch (e) {
      // Revert on error (optional, mostly fire and forget)
      setRejectedIds((prev) => {
        const n = new Set(prev);
        n.delete(jobId);
        return n;
      });
    }
  };

  const handleAcceptJob = async (order: Order) => {
    // Optimistic UI update
    setActiveJobId(order.id);
    onUpdateOrderStatus(order.id, order.status, DeliveryStatus.ASSIGNED, {
      name: riderName,
    });
    try {
      await deliveryApi.deliveryExecutive.post(
        "/api/delivery/drivers/:driverId/orders/:orderId/accept",
        undefined,
        { params: { driverId: riderId, orderId: order.id } }
      );
    } catch (e: any) {
      console.error("Failed to accept job", e);
      // Revert on error
      setActiveJobId(null);
      showError(e.response?.data?.message || "Failed to accept job.");
    }
  };

  const handleArrivedAtRestaurant = async () => {
    if (!currentJob) return;
    const previousStatus = currentJob.status;
    onUpdateOrderStatus(
      currentJob.id,
      currentJob.status,
      DeliveryStatus.AT_RESTAURANT
    );
    try {
      await deliveryApi.deliveryExecutive.post(
        "/api/delivery/drivers/:driverId/orders/:orderId/status",
        { status: DeliveryStatus.AT_RESTAURANT },
        { params: { driverId: riderId, orderId: currentJob.id } }
      );
    } catch (e: any) {
      onUpdateOrderStatus(
        currentJob.id,
        previousStatus,
        currentJob.deliveryStatus
      );
      showToast(e.response?.data?.message || "Failed to update status.");
    }
  };

  const handleAbortJob = async () => {
    if (!currentJob) return;
    if (
      !confirm(
        "Are you sure you want to abort this delivery? This will impact your rating."
      )
    )
      return;

    try {
      await deliveryApi.deliveryExecutive.post(
        "/api/delivery/drivers/:driverId/orders/:orderId/abort",
        undefined,
        { params: { driverId: riderId, orderId: currentJob.id } }
      );
      setActiveJobId(null);
      showToast("Delivery aborted. You will be placed back in the pool.");
    } catch (e: any) {
      showToast(e.response?.data?.message || "Failed to abort delivery.");
    }
  };

  const handleCustomerUnavailable = async () => {
    if (!currentJob) return;
    if (
      !confirm(
        "Are you sure the customer is unavailable? You should try calling them first."
      )
    )
      return;

    const previousStatus = currentJob.status;
    onUpdateOrderStatus(
      currentJob.id,
      currentJob.status,
      DeliveryStatus.FAILED
    );
    try {
      await deliveryApi.deliveryExecutive.post(
        "/api/delivery/drivers/:driverId/orders/:orderId/status",
        { status: DeliveryStatus.FAILED, goOfflineAfter },
        { params: { driverId: riderId, orderId: currentJob.id } }
      );
      setActiveJobId(null);

      if (goOfflineAfter) {
        setIsOnline(false);
      }
      showToast("Delivery marked as failed.");
    } catch (e: any) {
      onUpdateOrderStatus(
        currentJob.id,
        previousStatus,
        currentJob.deliveryStatus
      );
      showToast(e.response?.data?.message || "Failed to mark as unavailable.");
    }
  };

  const handlePickUpFood = async (e: React.FormEvent) => {
    e.preventDefault();
    setPickupOtpError("");
    const validation = otpSchema.safeParse(enteredPickupOtp);
    if (!validation.success) {
      setPickupOtpError(validation.error.issues[0].message);
      return;
    }

    if (!currentJob) return;
    const previousStatus = currentJob.status;
    onUpdateOrderStatus(
      currentJob.id,
      OrderStatus.HANDED_OVER,
      DeliveryStatus.OUT_FOR_DELIVERY
    );
    setIsUpdatingPickup(true);

    try {
      await deliveryApi.deliveryExecutive.post(
        "/api/delivery/drivers/:driverId/orders/:orderId/status",
        {
          status: DeliveryStatus.OUT_FOR_DELIVERY,
          pickupOtp: enteredPickupOtp,
        },
        { params: { driverId: riderId, orderId: currentJob.id } }
      );
      setIsUpdatingPickup(false);
      setEnteredPickupOtp("");
    } catch (e: any) {
      setIsUpdatingPickup(false);
      onUpdateOrderStatus(
        currentJob.id,
        previousStatus,
        currentJob.deliveryStatus
      );
      setPickupOtpError(e.response?.data?.message || "Failed to verify OTP.");
    }
  };

  const handleCompleteDelivery = async (e: React.FormEvent) => {
    e.preventDefault();
    setOtpError("");
    const validation = otpSchema.safeParse(enteredOtp);
    if (!validation.success) {
      setOtpError(validation.error.issues[0].message);
      return;
    }

    if (!currentJob) return;
    const previousStatus = currentJob.status;
    onUpdateOrderStatus(
      currentJob.id,
      OrderStatus.HANDED_OVER,
      DeliveryStatus.DELIVERED
    );
    setIsUpdatingDelivery(true);

    try {
      await deliveryApi.deliveryExecutive.post(
        "/api/delivery/drivers/:driverId/orders/:orderId/status",
        {
          status: DeliveryStatus.DELIVERED,
          deliveryOtp: enteredOtp,
          goOfflineAfter,
        },
        { params: { driverId: riderId, orderId: currentJob.id } }
      );
      setIsUpdatingDelivery(false);

      historyRef.current = [
        { ...currentJob, deliveryStatus: DeliveryStatus.DELIVERED },
        ...historyRef.current,
      ];

      setActiveJobId(null);
      if (goOfflineAfter) {
        setIsOnline(false);
      }
    } catch (e: any) {
      setIsUpdatingDelivery(false);
      onUpdateOrderStatus(
        currentJob.id,
        previousStatus,
        currentJob.deliveryStatus
      );
      setOtpError(
        e.response?.data?.message || "Failed to verify Delivery OTP."
      );
    }
  };

  useEffect(() => {
    if (currentJob?.status) {
      setIsUpdatingPickup(false);
      setIsUpdatingDelivery(false);

      if (
        currentJob.deliveryStatus === DeliveryStatus.OUT_FOR_DELIVERY &&
        !isWaitTimerActive
      ) {
        setIsWaitTimerActive(true);
        setWaitTimerSeconds(0);
      }
    }
  }, [currentJob?.status]);

  useEffect(() => {
    let interval: any;
    if (
      isWaitTimerActive &&
      currentJob?.deliveryStatus === DeliveryStatus.OUT_FOR_DELIVERY
    ) {
      interval = setInterval(() => {
        setWaitTimerSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      setIsWaitTimerActive(false);
      setWaitTimerSeconds(0);
    }
    return () => clearInterval(interval);
  }, [isWaitTimerActive, currentJob?.status]);

  if (isLoadingProfile) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-0 bg-transparent h-full">
        <div className="w-8 h-8 rounded-full border-2 border-rose-500/20 border-t-rose-500 animate-spin" />
      </div>
    );
  }

  if (!isVerificationLoaded) {
    return (
      <div className="flex-1 flex flex-col w-full h-[100dvh] items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-500">
        <div className="w-8 h-8 border-4 border-rose-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-xs font-bold uppercase tracking-widest">
          Verifying Account
        </p>
      </div>
    );
  }

  if (
    !verificationStatus ||
    !verificationStatus.allDocsApproved ||
    !verificationStatus.bankApproved
  ) {
    return (
      <RiderOnboardingWizard
        riderPhone={riderPhone}
        theme={theme}
        onComplete={() =>
          setVerificationStatus({
            ...verificationStatus,
            allDocsApproved: true,
            bankApproved: true,
          })
        }
        userId={user?.id || ""}
        initialName={riderName}
        onLogout={onLogout}
      />
    );
  }

  return (
    <div className="flex-1 w-full flex flex-col max-w-3xl mx-auto min-h-0 relative z-0">
      <CallOverlay />
      <div className="flex-1 flex flex-col w-full max-w-3xl mx-auto overflow-y-auto overflow-x-hidden min-h-0 bg-transparent text-slate-800 dark:text-[#f0ede6] h-full pb-20">
        {/* Global Toast */}
        <AnimatePresence>
          {toastMessage && (
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              className="fixed top-12 left-0 right-0 mx-auto max-w-sm z-[100] px-4"
            >
              <div className="bg-rose-500/90 backdrop-blur-xl border border-rose-500/50 shadow-2xl rounded-2xl p-4 flex items-start gap-3">
                <AlertCircle className="w-6 h-6 text-white shrink-0" />
                <p className="text-white font-medium text-sm pt-0.5">
                  {toastMessage}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Header Area */}
        <header className="sticky top-0 bg-white/20 dark:bg-white/5 backdrop-blur-xl px-5 py-3 flex flex-col sm:flex-row sm:items-center justify-between border-b border-rose-500/20 dark:border-rose-500/30 z-30 shrink-0 shadow-[0_2px_15px_rgba(0,0,0,0.01)] gap-3">
          <div className="flex items-center gap-3.5 flex-wrap">
            <LaBouffeLogo
              showText={false}
              iconSize="w-8 h-8"
              textColorClass="text-slate-800 dark:text-[#f0ede6] text-xs"
              subColorClass="text-rose-500 text-[8px]"
            />
            <div className="hidden sm:flex h-6 w-[1px] bg-slate-200 dark:bg-slate-800" />
            <button
              onClick={() => setView("settings")}
              className="flex items-center gap-2 text-left hover:bg-slate-100 dark:hover:bg-slate-900 p-1.5 -ml-1.5 rounded-xl transition-colors cursor-pointer"
            >
              {photoUrl ? (
                <ImageLoader
                  src={photoUrl}
                  alt="Profile"
                  className="w-8 h-8 rounded-full object-cover border border-rose-500/20"
                  containerClassName="w-8 h-8 rounded-full"
                  loading="lazy"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-500">
                  <Bike className="w-4 h-4" />
                </div>
              )}
              <div>
                <h3 className="font-extrabold text-xs tracking-tight leading-none text-slate-900 dark:text-[#f0ede6]">
                  {riderName || "Rider Portal"}
                </h3>
                {vehicleNumber && (
                  <span className="text-[9px] text-slate-400 dark:text-slate-300 font-bold block mt-0.5">
                    {vehicleNumber}
                  </span>
                )}
              </div>
            </button>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <DeliveryOnlineToggle
              isOnline={isOnline}
              riderId={riderId}
              isProfileMandatory={isProfileMandatory}
              handleToggleOnline={handleToggleOnline}
            />

            <button
              onClick={() =>
                view === "settings" ? setView("home") : setView("settings")
              }
              className={`p-2.5 rounded-xl transition-all cursor-pointer ${
                view === "settings"
                  ? "bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 shadow-sm shadow-indigo-500/10"
                  : "bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-500 dark:text-[#f0ede6]"
              }`}
              title="Profile Settings"
            >
              <User className="w-4 h-4 text-indigo-500" />
            </button>

            <button
              onClick={toggleTheme}
              className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-500 dark:text-[#f0ede6] transition-all cursor-pointer"
              title="Toggle Light/Dark Mode"
            >
              {theme === "dark" ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-indigo-500" />
              )}
            </button>
          </div>
        </header>

        {/* Connection Banner */}
        <AnimatePresence>
          {isOnline && !wsConnected && view === "home" && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-rose-500/10 border-b border-rose-500/20 px-5 py-2 flex items-center gap-2"
            >
              <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse shrink-0" />
              <p className="text-xs font-bold text-rose-600 dark:text-rose-400">
                Connection lost. Reconnecting to dispatch...
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {view === "settings" ? (
          <div className="flex-1 flex flex-col w-full max-w-3xl mx-auto overflow-y-auto overflow-x-hidden min-h-0 text-slate-800 dark:text-[#f0ede6] h-full mt-4">
            <RiderSettingsView
              onBack={() => setView("home")}
              theme={theme}
              onLogout={onLogout}
              isProfileMandatory={isProfileMandatory}
              riderPhone={riderPhone}
              onProfileUpdated={() => {
                deliveryApi.deliveryExecutive
                  .get("/api/delivery/profile")
                  .then((data) => {
                    if (data.success) {
                      const profile = data.data;
                      setRiderName(profile.fullName || profile.name || "");
                      setVehicleNumber(profile.vehicleNumber || "");
                      setPhotoUrl(profile.photoUrl || "");

                      const wasMandatory = isProfileMandatory;
                      setIsProfileMandatory(false);
                      setView("home");

                      if (wasMandatory) {
                        handleToggleOnline();
                      }
                    }
                  });
              }}
            />
          </div>
        ) : (
          <>
            {/* Driver Statistics Panel */}
            <div className="p-5 grid grid-cols-2 gap-4 shrink-0">
              <div className="glass-card p-4 flex items-center gap-3">
                <div className="p-2.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl">
                  <DollarSign className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 dark:text-[#f0ede6] uppercase font-mono block">
                    Today's Earnings
                  </span>
                  <span className="text-base font-black text-slate-800 dark:text-[#f0ede6]">
                    ₹{todayEarnings.toFixed(2)}
                  </span>
                </div>
              </div>

              <button
                onClick={() => setShowHistory(true)}
                className={`glass-card p-4 flex items-center gap-3 text-left transition-all cursor-pointer hover:border-indigo-500/30 ${
                  showHistory
                    ? "ring-2 ring-indigo-500 border-transparent dark:border-transparent"
                    : ""
                }`}
              >
                <div className="p-2.5 bg-orange-500/10 text-orange-600 dark:text-orange-400 rounded-xl">
                  <Check className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 dark:text-[#f0ede6] uppercase font-mono block">
                    Trips Completed
                  </span>
                  <span className="text-base font-black text-slate-800 dark:text-[#f0ede6]">
                    {todayCompletedCount} orders
                  </span>
                </div>
              </button>
            </div>

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
                <motion.div
                  key="offline"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex-1 flex flex-col items-center justify-center p-12 text-center text-slate-400 dark:text-slate-300 space-y-4"
                >
                  <div className="p-4 bg-slate-200 dark:bg-slate-900 text-slate-500 dark:text-slate-300 rounded-full">
                    <ShieldAlert className="w-12 h-12" />
                  </div>
                  <h4 className="font-bold text-lg text-slate-800 dark:text-[#f0ede6]">
                    You are currently Duty Offline
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-300 max-w-xs leading-relaxed">
                    Switch your duty status to Online at the top right to start
                    receiving dispatch jobs, navigating maps, and pocketing
                    payouts.
                  </p>
                </motion.div>
              ) : currentJob ? (
                <ErrorBoundary fallbackLabel="Active Job">
                  <DeliveryActiveJob
                    currentJob={currentJob}
                    enteredPickupOtp={enteredPickupOtp}
                    setEnteredPickupOtp={setEnteredPickupOtp}
                    pickupOtpError={pickupOtpError}
                    isUpdatingPickup={isUpdatingPickup}
                    handleArrivedAtRestaurant={handleArrivedAtRestaurant}
                    handlePickUpFood={handlePickUpFood}
                    handleAbortJob={handleAbortJob}
                    handleCompleteDelivery={handleCompleteDelivery}
                    enteredOtp={enteredOtp}
                    setEnteredOtp={setEnteredOtp}
                    otpError={otpError}
                    isUpdatingDelivery={isUpdatingDelivery}
                    goOfflineAfter={goOfflineAfter}
                    setGoOfflineAfter={setGoOfflineAfter}
                    waitTimerSeconds={waitTimerSeconds}
                    handleCustomerUnavailable={handleCustomerUnavailable}
                  />
                </ErrorBoundary>
              ) : (
                <ErrorBoundary fallbackLabel="Available Jobs">
                  <DeliveryAvailableJobs
                    availableJobs={availableJobs}
                    handleAcceptJob={handleAcceptJob}
                  />
                </ErrorBoundary>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {pingJob && (
                <motion.div
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 50 }}
                  className="fixed inset-x-4 bottom-4 z-50 bg-slate-900 border border-rose-500/30 p-5 rounded-3xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent pointer-events-none" />
                  <div className="relative flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-white font-black text-lg uppercase flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                        New Dispatch
                      </h3>
                      <p className="text-emerald-400 text-xs font-mono font-bold mt-1">
                        Est. Payout:{" "}
                        {pingJob.payout
                          ? `₹${pingJob.payout.toFixed(2)}`
                          : "Calculating..."}
                      </p>
                    </div>
                    <div className="w-10 h-10 rounded-full border-2 border-emerald-500/50 flex items-center justify-center text-emerald-400 font-bold font-mono text-sm relative">
                      <svg className="absolute inset-0 w-full h-full -rotate-90">
                        <circle
                          cx="18"
                          cy="18"
                          r="16"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeDasharray="100"
                          strokeDashoffset={100 - (pingTimer / 60) * 100}
                          className="text-emerald-500 transition-all duration-1000 ease-linear"
                        />
                      </svg>
                      {pingTimer}s
                    </div>
                  </div>
                  <div className="space-y-3 mb-5 relative">
                    <div className="flex items-start gap-3">
                      <div className="mt-1 w-6 h-6 rounded bg-emerald-500/20 flex items-center justify-center shrink-0">
                        <Store className="w-3.5 h-3.5 text-emerald-400" />
                      </div>
                      <div>
                        <span className="block text-[10px] text-slate-400 dark:text-slate-300 font-bold uppercase tracking-wider">
                          Pickup
                        </span>
                        <span className="block text-sm text-slate-200 font-medium">
                          {pingJob.restaurantName}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="mt-1 w-6 h-6 rounded bg-indigo-500/20 flex items-center justify-center shrink-0">
                        <MapPinOff className="w-3.5 h-3.5 text-indigo-400" />
                      </div>
                      <div>
                        <span className="block text-[10px] text-slate-400 dark:text-slate-300 font-bold uppercase tracking-wider">
                          Dropoff
                        </span>
                        <span className="block text-sm text-slate-200 font-medium">
                          {pingJob.deliveryAddress}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-3 relative">
                    <Button
                      onClick={() => handleRejectPing(pingJob.id)}
                      variant="outline"
                      className="flex-1 !py-3.5 !rounded-xl !border-rose-500/30 !text-slate-400 dark:!text-slate-300 hover:!bg-slate-800 transition-colors hover:shadow-[0_0_12px_rgba(244,63,94,0.4)] dark:hover:shadow-[0_0_12px_rgba(244,63,94,0.5)] hover:!border-rose-500/50 transition-all !text-xs"
                    >
                      Decline
                    </Button>
                    <Button
                      onClick={() => handleAcceptPing(pingJob)}
                      variant="success"
                      className="flex-[2] !py-3.5 !rounded-xl !bg-emerald-500 !text-slate-950 uppercase tracking-wide hover:!bg-emerald-400 transition-colors shadow-lg shadow-emerald-500/20"
                    >
                      Accept Order
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <Modal
              isOpen={showPermissionsPrompt}
              onClose={() => setShowPermissionsPrompt(false)}
              size="sm"
            >
              <div className="p-8 pb-6 flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-blue-500/10 flex items-center justify-center mb-6 text-blue-500">
                  <AlertCircle className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">
                  Permissions Required
                </h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed mb-8">
                  To receive order assignments and go on duty, we need your
                  permission to access your location and send notifications.
                </p>
                <Button
                  onClick={requestPermissionsAndGoOnline}
                  variant="primary"
                  fullWidth
                >
                  Enable Permissions
                </Button>
              </div>
            </Modal>

            <Modal
              isOpen={showProfileRequiredPrompt}
              onClose={() => setShowProfileRequiredPrompt(false)}
              size="sm"
            >
              <div className="p-8 pb-6 flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-rose-500/10 flex items-center justify-center mb-6 text-rose-500">
                  <User className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">
                  Profile Required
                </h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed mb-8">
                  Please complete your driver profile (Name, Vehicle) before you
                  can go on duty and start receiving orders.
                </p>
                <Button
                  onClick={() => {
                    setShowProfileRequiredPrompt(false);
                    setView("settings");
                  }}
                  variant="primary"
                  fullWidth
                >
                  Complete Profile
                </Button>
              </div>
            </Modal>
          </>
        )}

        {currentJob && (
          <ChatWidget
            orderId={currentJob.id}
            order={currentJob}
            currentUserType="DELIVERY"
            otherParticipants={[
              ...(currentJob.customerId
                ? [
                    {
                      userId: currentJob.customerId,
                      entityType: "CUSTOMER" as const,
                      displayName: currentJob.customerName || "Customer",
                    },
                  ]
                : []),
              ...(currentJob.restaurantId
                ? [
                    {
                      userId: currentJob.restaurantId,
                      entityType: "RESTAURANT" as const,
                      displayName: currentJob.restaurantName || "Restaurant",
                    },
                  ]
                : []),
            ]}
          />
        )}
      </div>
    </div>
  );
}
