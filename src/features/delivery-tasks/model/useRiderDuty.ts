import {
  getNotificationPermission,
  requestNotificationPermission,
} from '@/lib/notificationPermissions';
import { requestGoOffline, requestGoOnline } from './dutyApi';
import { apiErrorMessage } from './dutyStatus';

/**
 * Going on and off duty: the permission gauntlet, the location fix, and the status call.
 *
 * Going online is the most consequential thing a rider does in this app -- it is what makes their
 * phone start ringing. It used to exist four times over, and two of the copies went online without
 * a location ("proceeding online") after a timeout. Dispatch finds riders by location, so that rider
 * read "Online Duty", was offered nothing, and was quietly taken off duty by the server a minute
 * later. Every copy also swallowed the server's refusal (selfie due, not yet approved) into the
 * console, so the button simply did nothing.
 *
 * Now there is one path, it needs a fix, and the screen changes only when the server agrees.
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

const LOCATION_OPTIONS: PositionOptions = { enableHighAccuracy: true, timeout: 10000 };

export function useRiderDuty({
  deliveryExecutiveId,
  isProfileMandatory,
  isOnline,
  setIsOnline,
  showToast,
  setShowPermissionsPrompt,
  setShowProfileRequiredPrompt,
}: UseRiderDutyOptions) {
  /** Takes a fix, then asks the server to put the rider on duty there. */
  const goOnline = () => {
    if (!navigator.geolocation) {
      showToast('Geolocation is not supported by your browser');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          await requestGoOnline(deliveryExecutiveId, position.coords.latitude, position.coords.longitude);
          setIsOnline(true);
        } catch (e: unknown) {
          showToast(apiErrorMessage(e, 'Could not go online. Please try again.'));
        }
      },
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          setShowPermissionsPrompt(true);
        } else {
          showToast("Couldn't find your location. Move somewhere with a clear signal and try again.");
        }
      },
      LOCATION_OPTIONS,
    );
  };

  /** Asks the server to take the rider off duty. True when it did. */
  const goOffline = async ({ quiet = false }: { quiet?: boolean } = {}): Promise<boolean> => {
    try {
      await requestGoOffline(deliveryExecutiveId);
      setIsOnline(false);
      return true;
    } catch (e: unknown) {
      if (!quiet) showToast(apiErrorMessage(e, 'Could not go offline. Please try again.'));
      return false;
    }
  };

  const requestPermissionsAndGoOnline = async () => {
    let notificationPermission;
    try {
      notificationPermission = await requestNotificationPermission();
    } catch (error) {
      console.error('Failed to request notification permission', error);
      showToast('Unable to request notification permission on this device.');
      setShowPermissionsPrompt(false);
      return;
    }
    setShowPermissionsPrompt(false);
    if (notificationPermission === 'unsupported') {
      showToast('Notifications are not supported in this browser. Install the app or use a supported browser.');
      return;
    }
    if (notificationPermission !== 'granted') {
      showToast('Notification permission is required. Enable it in your device or browser settings.');
      return;
    }
    goOnline();
  };

  const handleToggleOnline = async () => {
    if (!deliveryExecutiveId || isProfileMandatory) {
      setShowProfileRequiredPrompt(true);
      return;
    }
    if (isOnline) {
      await goOffline();
      return;
    }

    let notificationGranted = false;
    try {
      notificationGranted = (await getNotificationPermission()) === 'granted';
    } catch (error) {
      console.error('Failed to read notification permission', error);
    }
    let locationGranted = false;
    try {
      if (navigator.permissions) {
        const perm = await navigator.permissions.query({ name: 'geolocation' });
        locationGranted = perm.state === 'granted';
      }
    } catch (_e: unknown) {
      // navigator.permissions is missing or does not know "geolocation": ask through the prompt.
    }

    if (notificationGranted && locationGranted) {
      goOnline();
    } else {
      setShowPermissionsPrompt(true);
    }
  };

  return { requestPermissionsAndGoOnline, handleToggleOnline, goOffline };
}
