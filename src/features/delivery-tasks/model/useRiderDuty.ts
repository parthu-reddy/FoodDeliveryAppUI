import {
  getNotificationPermission,
  requestNotificationPermission,
} from '@/lib/notificationPermissions';
import { deliveryApi } from '@/lib/zodiosClients';

/**
 * Going on and off duty: the permission gauntlet, the location fix, and the status call.
 *
 * Lifted verbatim from `DeliveryDashboard`. Going online is the most consequential thing a
 * rider does in this app -- it is what makes their phone start ringing -- and the logic for
 * it was buried in the middle of a 1,124-line file between the profile fetch and the OTP
 * handlers.
 */

interface UseRiderDutyOptions {
  deliveryExecutiveId: string;
  isProfileMandatory: boolean;
  isOnline: boolean;
  setIsOnline: (online: boolean) => void;
  showToast: (message: string) => void;
  setShowPermissionsPrompt: (open: boolean) => void;
  setShowProfileRequiredPrompt: (open: boolean) => void;
}

export function useRiderDuty({
  deliveryExecutiveId,
  isProfileMandatory,
  isOnline,
  setIsOnline,
  showToast,
  setShowPermissionsPrompt,
  setShowProfileRequiredPrompt,
}: UseRiderDutyOptions) {
const requestPermissionsAndGoOnline = async () => {
  let notificationPermission;
  try {
    notificationPermission = await requestNotificationPermission();
  } catch (error) {
    console.error("Failed to request notification permission", error);
    showToast("Unable to request notification permission on this device.");
    setShowPermissionsPrompt(false);
    return;
  }
  if (notificationPermission === "unsupported") {
    showToast("Notifications are not supported in this browser. Install the app or use a supported browser.");
    setShowPermissionsPrompt(false);
    return;
  }
  if (notificationPermission !== "granted") {
    showToast("Notification permission is required. Enable it in your device or browser settings.");
    setShowPermissionsPrompt(false);
    return;
  }

  if (!navigator.geolocation) {
    showToast("Geolocation is not supported by your browser");
    setShowPermissionsPrompt(false);
    return;
  }

  navigator.geolocation.getCurrentPosition(
    async (_position) => {
      setShowPermissionsPrompt(false);
      try {
        await deliveryApi.deliveryExecutive.post(
          `/api/delivery/status`,
          { driverId: deliveryExecutiveId, available: true },
          {}
        );
        setIsOnline(true);
      } catch (e: unknown) {
        console.error("Failed to toggle status", e);
      }
    },
    async (error) => {
      setShowPermissionsPrompt(false);
      console.error("Error getting location", error);
      
      // If permission is denied, block going online
      if (error.code === error.PERMISSION_DENIED) {
        showToast(
          "Location permission is required. Please enable in browser settings if denied."
        );
      } else {
        // If it's a timeout or position unavailable (e.g. on desktop/emulator), 
        // still allow going online since they granted permission.
        showToast("Warning: Could not determine exact location, but proceeding online.");
        try {
          await deliveryApi.deliveryExecutive.post(
            `/api/delivery/status`,
            { driverId: deliveryExecutiveId, available: true },
            {}
          );
          setIsOnline(true);
        } catch (e: unknown) {
          console.error("Failed to toggle status", e);
        }
      }
    },
    { enableHighAccuracy: true, timeout: 10000 }
  );
};

const handleToggleOnline = async () => {
  if (!deliveryExecutiveId || isProfileMandatory) {
    setShowProfileRequiredPrompt(true);
    return;
  }
  if (!isOnline) {
    let notificationGranted = false;
    try {
      notificationGranted = (await getNotificationPermission()) === "granted";
    } catch (error) {
      console.error("Failed to read notification permission", error);
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
    } catch (_e: unknown) {
      // Fallback or ignore if navigator.permissions is not supported
    }

    if (notificationGranted && locationGranted) {
      navigator.geolocation.getCurrentPosition(
        async (_position) => {
          try {
            await deliveryApi.deliveryExecutive.post(
              `/api/delivery/status`,
              { driverId: deliveryExecutiveId, available: true },
              {}
            );
            setIsOnline(true);
          } catch (e: unknown) {
            console.error("Failed to toggle status", e);
          }
        },
        async (error) => {
          console.error("Error getting location", error);
          if (error.code === error.PERMISSION_DENIED) {
            setShowPermissionsPrompt(true);
          } else {
            showToast("Warning: Could not determine exact location, but proceeding online.");
            try {
              await deliveryApi.deliveryExecutive.post(
                `/api/delivery/status`,
                { driverId: deliveryExecutiveId, available: true },
                {}
              );
              setIsOnline(true);
            } catch (e: unknown) {
              console.error("Failed to toggle status", e);
            }
          }
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } else {
      setShowPermissionsPrompt(true);
    }
  } else {
    try {
      await deliveryApi.deliveryExecutive.post(
        `/api/delivery/status`,
        { driverId: deliveryExecutiveId, available: false },
        {}
      );
      setIsOnline(false);
    } catch (e: unknown) {
      console.error("Failed to toggle status", e);
    }
  }
};
  return { requestPermissionsAndGoOnline, handleToggleOnline };
}
