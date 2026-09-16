export type AppNotificationPermission = "granted" | "denied" | "prompt" | "unsupported";

interface DeliveryNotificationBridge {
  getPermissionStatus?: () => Promise<string>;
  requestPermission: () => Promise<string>;
  showNotification?: (notification: {
    title: string;
    body: string;
    tag: string;
    data?: Record<string, string>;
  }) => Promise<void> | void;
}

declare global {
  interface Window {
    deliveryNotificationBridge?: DeliveryNotificationBridge;
  }
}

const normalizePermission = (permission: string): AppNotificationPermission => {
  if (permission === "granted" || permission === "provisional") return "granted";
  if (permission === "denied") return "denied";
  if (permission === "default" || permission === "prompt") return "prompt";
  return "unsupported";
};

async function getNotificationServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!("serviceWorker" in navigator)) return null;
  try {
    const existing = await navigator.serviceWorker.getRegistration("/");
    return existing ?? navigator.serviceWorker.register("/delivery-notifications-sw.js", { scope: "/" });
  } catch (error) {
    console.warn("Unable to register the notification service worker", error);
    return null;
  }
}

export async function getNotificationPermission(): Promise<AppNotificationPermission> {
  const bridge = window.deliveryNotificationBridge;
  if (bridge?.getPermissionStatus) {
    return normalizePermission(await bridge.getPermissionStatus());
  }
  if (typeof Notification !== "undefined") {
    return normalizePermission(Notification.permission);
  }
  return "unsupported";
}

export async function requestNotificationPermission(): Promise<AppNotificationPermission> {
  const bridge = window.deliveryNotificationBridge;
  if (bridge) {
    return normalizePermission(await bridge.requestPermission());
  }
  if (typeof Notification !== "undefined") {
    const permission = normalizePermission(await Notification.requestPermission());
    if (permission === "granted") {
      await getNotificationServiceWorker();
    }
    return permission;
  }
  return "unsupported";
}

export async function showDeliveryAssignmentNotification(orderId: string): Promise<void> {
  if (await getNotificationPermission() !== "granted") return;

  const notification = {
    title: "New delivery request",
    body: `Order ${orderId.slice(0, 8)} is available. Open the app to accept it.`,
    tag: `delivery-assignment-${orderId}`,
    data: { orderId, type: "NEW_ORDER_DISPATCH" },
  };

  const bridge = window.deliveryNotificationBridge;
  if (bridge?.showNotification) {
    await bridge.showNotification(notification);
    return;
  }

  const serviceWorker = await getNotificationServiceWorker();
  if (serviceWorker) {
    await serviceWorker.showNotification(notification.title, {
      body: notification.body,
      tag: notification.tag,
      data: notification.data,
    });
    return;
  }

  if (typeof Notification !== "undefined") {
    const browserNotification = new Notification(notification.title, {
      body: notification.body,
      tag: notification.tag,
      data: notification.data,
    });
    browserNotification.onclick = () => {
      window.focus();
      browserNotification.close();
    };
  }
}
