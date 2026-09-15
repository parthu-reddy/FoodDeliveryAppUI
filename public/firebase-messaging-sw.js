/* global clients */

// The FCM token is created against this explicit service-worker registration. Handling the
// browser PushEvent directly keeps Firebase project credentials out of this static file.
self.addEventListener('push', event => {
  if (!event.data) return;

  let payload;
  try {
    payload = event.data.json();
  } catch (_error) {
    payload = { notification: { body: event.data.text() } };
  }

  const notification = payload.notification || payload.data?.notification || {};
  const data = payload.data || {};
  const title = notification.title || data.title || 'New delivery update';
  const options = {
    body: notification.body || data.body || 'Open the app to view this delivery request.',
    icon: notification.icon || '/favicon.ico',
    badge: notification.badge || '/favicon.ico',
    data,
    tag: data.orderId ? `delivery-order-${data.orderId}` : 'delivery-update',
    renotify: true,
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil((async () => {
    const windows = await clients.matchAll({ type: 'window', includeUncontrolled: true });
    const existing = windows.find(client => 'focus' in client);
    if (existing) {
      await existing.focus();
      existing.postMessage({
        type: 'NEW_ORDER_DISPATCH',
        orderId: event.notification.data?.orderId,
      });
      return;
    }
    await clients.openWindow('/');
  })());
});
