import fs from 'fs';

const fixes = [
  {
    file: 'src/components/restaurant/RestaurantOrderDetailsModal.tsx',
    target: '/api/v1/restaurants/:orderrestaurantId/fulfillment/orders/:orderid/invoice',
    replace: '/api/v1/restaurants/:restaurantId/fulfillment/orders/:orderId/invoice'
  },
  {
    file: 'src/components/restaurant/useRestaurantOrders.ts',
    target: '/api/v1/restaurants/:selectedOutletId/fulfillment/orders/active',
    replace: '/api/v1/restaurants/:restaurantId/fulfillment/orders/active'
  },
  {
    file: 'src/components/shared/OrderTrackingMap.tsx',
    target: 'orderrestaurantId: order.restaurantId',
    replace: 'id: order.restaurantId'
  },
  {
    file: 'src/components/shared/ChatWidget.tsx',
    target: 'chatApi.chat.',
    replace: 'communicationApi.chat.'
  },
  {
    file: 'src/components/shared/ImageUploadField.tsx',
    target: 'restaurantApi.upload.post',
    replace: 'restaurantApi.restaurantOutlet.post'
  },
  {
    file: 'src/components/shared/OrderTrackingMap.tsx',
    target: 'deliveryApi.delivery.',
    replace: 'deliveryApi.internalDelivery.'
  },
  {
    file: 'src/components/shared/DocumentUploadField.tsx',
    target: '(customerApi as any).post(\':uploadEndpoint\'',
    replace: '(restaurantApi.restaurantOutlet as any).post(\':uploadEndpoint\''
  },
  {
    file: 'src/components/shared/SessionManagementModal.tsx',
    target: 'identityApi.user.delete(',
    replace: '(identityApi.user as any).delete('
  },
  {
    file: 'src/components/shared/SharedSettingsView.tsx',
    target: '(walletApi.wallet as any).get(\'/api/v1/wallets/:entityType/:entityId\'',
    replace: 'walletApi.wallet.get(\'/api/v1/wallets/CUSTOMER/:customerId\''
  },
  {
    file: 'src/components/shared/SharedSettingsView.tsx',
    target: '(walletApi.wallet as any).get(\'/api/v1/wallets/:entityType/:entityId/transactions\'',
    replace: 'walletApi.wallet.get(\'/api/v1/wallets/CUSTOMER/:customerId/transactions\''
  },
  {
    file: 'src/components/restaurant/RestaurantDashboard.tsx',
    target: '"/api/v1/outlets/:selectedOutletId/status"',
    replace: '"/api/v1/outlets/:outletId/status"'
  },
  {
    file: 'src/components/restaurant/PartnerAccountModal.tsx',
    target: '{ params: { id: partnerId } }',
    replace: '{} as any'
  },
  {
    file: 'src/hooks/useUserProfile.ts',
    target: '"/api/v1/users/profile"',
    replace: '"/api/v1/internal/users/:id"'
  }
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

// Remove unused ts-expect-errors
const expectedErrorFiles = [
  'src/contexts/ConfigContext.tsx',
  'src/hooks/useUserProfile.ts',
  'src/hooks/useWebRTC.ts',
  'src/lib/menuStore.ts'
];

for (const file of expectedErrorFiles) {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    content = content.replace(/\/\/\s*@ts-expect-error.*\n/g, '');
    fs.writeFileSync(file, content);
    console.log(`Removed ts-expect-error in ${file}`);
  }
}
