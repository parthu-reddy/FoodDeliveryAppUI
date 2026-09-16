self.addEventListener("notificationclick", event => {
  event.notification.close();
  const orderId = event.notification.data?.orderId;
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(clients => {
      const existingClient = clients.find(client => "focus" in client);
      if (existingClient) {
        existingClient.postMessage({ type: "NEW_ORDER_DISPATCH", orderId });
        return existingClient.focus();
      }
      return self.clients.openWindow("/");
    })
  );
});
