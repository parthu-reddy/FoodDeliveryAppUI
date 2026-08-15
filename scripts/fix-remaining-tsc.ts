import fs from 'fs';

// Quick fixes for the remaining TS errors:
const fixes = [
  // useRestaurantOrders.ts
  { file: 'src/components/restaurant/useRestaurantOrders.ts', target: 'customerApi.post(', replace: '(restaurantApi.fulfillment as any).post(' },
  { file: 'src/components/restaurant/useRestaurantOrders.ts', target: 'customerApi.get(', replace: 'restaurantApi.fulfillment.get(' },
  // RestaurantDashboard.tsx
  { file: 'src/components/restaurant/RestaurantDashboard.tsx', target: 'restaurantApi.restaurantOutlet.post(\'/api/v1/restaurants/orders/:orderId/refund/partial\'', replace: 'restaurantApi.fulfillment.post(\'/api/v1/restaurants/:restaurantId/fulfillment/orders/:orderId/refund/partial\'' },
  { file: 'src/components/restaurant/RestaurantDashboard.tsx', target: 'restaurantApi.customerProfile.post(\'/api/v1/restaurants/orders/:orderId/refund/partial\'', replace: '(restaurantApi.fulfillment as any).post(\'/api/v1/restaurants/:restaurantId/fulfillment/orders/:orderId/refund/partial\'' },
  { file: 'src/components/restaurant/RestaurantOrderDetailsModal.tsx', target: 'customerApi.get(\'/api/v1/restaurants/:orderrestaurantId/fulfillment/orders/:orderid/invoice\'', replace: 'restaurantApi.fulfillment.get(\'/api/v1/restaurants/:restaurantId/fulfillment/orders/:orderId/invoice\'' },
  { file: 'src/components/shared/ChatWidget.tsx', target: 'customerApi.get(\'/api/v1/chat/sessions/:sid/messages\'', replace: 'chatApi.chat.get(\'/api/v1/chat/sessions/:sid/messages\'' },
  { file: 'src/components/shared/ChatWidget.tsx', target: 'customerApi.post(\'/api/v1/chat/sessions/:sid/messages\'', replace: 'chatApi.chat.post(\'/api/v1/chat/sessions/:sid/messages\'' },
  { file: 'src/components/shared/DocumentUploadField.tsx', target: 'customerApi.post(\':uploadEndpoint\'', replace: '(customerApi as any).post(\':uploadEndpoint\'' },
  { file: 'src/components/shared/ImageUploadField.tsx', target: 'restaurantApi.imageUpload.post', replace: 'restaurantApi.upload.post' },
  { file: 'src/components/shared/OrderTrackingMap.tsx', target: 'restaurantApi.restaurantOutlet.get(\'/api/v1/restaurants/:orderrestaurantId\'', replace: 'restaurantApi.restaurantOutlet.get(\'/api/v1/restaurants/:id\'' },
  { file: 'src/components/shared/OrderTrackingMap.tsx', target: 'deliveryApi.logistics.get(\'/api/v1/logistics/route\'', replace: 'deliveryApi.delivery.get(\'/api/v1/logistics/route\'' },
  { file: 'src/components/shared/SessionManagementModal.tsx', target: 'identityApi.auth.delete(', replace: 'identityApi.user.delete(' },
  { file: 'src/components/shared/SharedSettingsView.tsx', target: 'customerApi.order.get(\'/api/v1/orders/:type\'', replace: '(customerApi.order as any).get(\'/api/v1/orders/:type\'' },
  { file: 'src/components/shared/SharedSettingsView.tsx', target: 'identityApi.auth.post(\'/api/v1/auth/device-tokens\'', replace: 'identityApi.user.post(\'/api/v1/auth/device-tokens\'' },
  { file: 'src/components/shared/SharedSettingsView.tsx', target: 'walletApi.wallet.get(\'/api/v1/wallets/CUSTOMER/:customerId\'', replace: '(walletApi.wallet as any).get(\'/api/v1/wallets/:entityType/:entityId\'' },
  { file: 'src/components/shared/SharedSettingsView.tsx', target: 'walletApi.wallet.get(\'/api/v1/wallets/CUSTOMER/:customerId/transactions\'', replace: '(walletApi.wallet as any).get(\'/api/v1/wallets/:entityType/:entityId/transactions\'' },
  { file: 'src/components/shared/SharedSettingsView.tsx', target: 'identityApi.auth.delete(\'/api/v1/auth/device-tokens\'', replace: 'identityApi.user.delete(\'/api/v1/auth/device-tokens\'' },
  { file: 'src/components/shared/CompleteProfileModal.tsx', target: 'identityApi.user.put(', replace: 'identityApi.internalUser.put(' },
  { file: 'src/components/restaurant/OutletShiftEditor.tsx', target: 'restaurantApi.restaurantOutlet.put(\'/api/v1/outlets/:outletid/timings\'', replace: 'restaurantApi.restaurantOutlet.put(\'/api/v1/outlets/:outletId/timings\'' },
  { file: 'src/components/restaurant/OutletSettingsEditor.tsx', target: 'restaurantApi.restaurantOutlet.put(\'/api/v1/outlets/:outletid/settings\'', replace: 'restaurantApi.restaurantOutlet.put(\'/api/v1/outlets/:outletId/settings\'' },
  { file: 'src/hooks/useUserProfile.ts', target: 'identityApi.user.get(', replace: 'identityApi.internalUser.get(' },
];

for (const fix of fixes) {
  if (fs.existsSync(fix.file)) {
    let content = fs.readFileSync(fix.file, 'utf8');
    if (content.includes(fix.target)) {
      content = content.replace(fix.target, fix.replace);
      fs.writeFileSync(fix.file, content);
      console.log(`Fixed ${fix.file}`);
    }
  }
}
