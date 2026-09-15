import { getApp, getApps, initializeApp } from 'firebase/app';
import {
  deleteToken,
  getMessaging,
  getToken as getFcmToken,
  isSupported,
  onMessage,
  type Messaging,
} from 'firebase/messaging';
import { env } from './env';
import { logger } from './logger';
import { getToken as getAuthToken } from './tokenStore';

const STORED_FCM_TOKEN = 'delivery_fcm_token';
let messagingPromise: Promise<Messaging | null> | null = null;
let foregroundListenerRegistered = false;

const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID,
};

export const isDeliveryPushConfigured = () =>
  Object.values(firebaseConfig).every(value => typeof value === 'string' && value.length > 0)
  && Boolean(env.VITE_FIREBASE_VAPID_KEY);

const getDeliveryMessaging = async (): Promise<Messaging | null> => {
  if (!messagingPromise) {
    messagingPromise = (async () => {
      if (!isDeliveryPushConfigured() || !(await isSupported())) {
        return null;
      }
      const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
      return getMessaging(app);
    })();
  }
  return messagingPromise;
};

const notificationApiUrl = (suffix = '') => {
  const base = (env.VITE_API_BASE_URL || '').replace(/\/$/, '');
  return `${base}/api/v1/notifications/devices${suffix}`;
};

const authenticatedFetch = async (url: string, init: RequestInit) => {
  const authToken = getAuthToken();
  if (!authToken) {
    throw new Error('Cannot register push notifications without an authenticated session');
  }
  const response = await fetch(url, {
    ...init,
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${authToken}`,
      ...(init.headers || {}),
    },
  });
  if (!response.ok) {
    throw new Error(`Push device registration failed with HTTP ${response.status}`);
  }
};

export type PushRegistrationResult = 'registered' | 'unsupported' | 'unconfigured';

export const registerDeliveryPushNotifications = async (): Promise<PushRegistrationResult> => {
  if (!isDeliveryPushConfigured()) {
    return 'unconfigured';
  }
  if (!('serviceWorker' in navigator) || !(await isSupported())) {
    return 'unsupported';
  }
  if (Notification.permission !== 'granted') {
    throw new Error('Notification permission has not been granted');
  }

  const messaging = await getDeliveryMessaging();
  if (!messaging) {
    return 'unsupported';
  }
  const serviceWorkerRegistration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
  const fcmToken = await getFcmToken(messaging, {
    vapidKey: env.VITE_FIREBASE_VAPID_KEY,
    serviceWorkerRegistration,
  });
  if (!fcmToken) {
    throw new Error('Firebase did not return a browser registration token');
  }

  await authenticatedFetch(notificationApiUrl(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fcmToken, platform: 'WEB' }),
  });
  localStorage.setItem(STORED_FCM_TOKEN, fcmToken);

  if (!foregroundListenerRegistered) {
    onMessage(messaging, payload => {
      window.dispatchEvent(new CustomEvent('delivery-push', { detail: payload.data || {} }));
      if (document.visibilityState !== 'visible' && Notification.permission === 'granted') {
        const title = payload.notification?.title || 'New delivery update';
        new Notification(title, {
          body: payload.notification?.body,
          data: payload.data,
          tag: payload.data?.orderId ? `delivery-order-${payload.data.orderId}` : undefined,
        });
      }
    });
    foregroundListenerRegistered = true;
  }

  return 'registered';
};

export const unregisterDeliveryPushNotifications = async () => {
  const storedToken = localStorage.getItem(STORED_FCM_TOKEN);
  if (storedToken && getAuthToken()) {
    try {
      await authenticatedFetch(notificationApiUrl(`/${encodeURIComponent(storedToken)}`), {
        method: 'DELETE',
      });
    } catch (error) {
      logger.warn('Failed to deactivate browser push token on the server', { error: String(error) });
    }
  }

  const messaging = await getDeliveryMessaging();
  if (messaging) {
    await deleteToken(messaging).catch(error => {
      logger.warn('Failed to delete local Firebase registration token', { error: String(error) });
    });
  }
  localStorage.removeItem(STORED_FCM_TOKEN);
};
