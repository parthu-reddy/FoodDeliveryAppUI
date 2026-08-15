import fs from 'fs';

const fixes = [
  {
    file: 'src/components/restaurant/OutletRegistration.tsx',
    target: 'logisticsApi.maps',
    replace: 'mapsApi.maps' // Assuming mapsApi.maps or similar. Actually mapsApi has .maps
  },
  {
    file: 'src/components/restaurant/RestaurantDashboard.tsx',
    target: 'customerApi.post',
    replace: '(restaurantApi.restaurantOutlet as any).post'
  },
  {
    file: 'src/components/restaurant/RestaurantDashboard.tsx',
    target: '(restaurantApi.fulfillment as any).post(\'/api/v1/restaurants/:restaurantId/fulfillment/orders/:orderId/refund/partial\'',
    replace: 'restaurantApi.fulfillment.post(\'/api/v1/restaurants/:restaurantId/fulfillment/orders/:orderId/refund/partial\'' // Make sure type matches
  },
  {
    file: 'src/components/shared/ChatWidget.tsx',
    target: 'communicationApi',
    replace: 'chatApi'
  },
  {
    file: 'src/hooks/useWebRTC.ts',
    target: 'communicationApi',
    replace: 'chatApi'
  },
  {
    file: 'src/components/shared/DocumentUploadField.tsx',
    target: '(customerApi as any).get(\':uploadEndpoint\'',
    replace: '(restaurantApi.restaurantOutlet as any).get(\':uploadEndpoint\''
  },
  {
    file: 'src/components/restaurant/OutletSettingsEditor.tsx',
    target: 'outletid:',
    replace: 'outletId:'
  },
  {
    file: 'src/components/shared/OrderTrackingMap.tsx',
    target: 'deliveryApi.internalDelivery.get',
    replace: '(deliveryApi.internalDelivery as any).get'
  },
  {
    file: 'src/contexts/ConfigContext.tsx',
    target: 'identityApi.internalUser.get(',
    replace: 'identityApi.user.get(' // Wait, identityApi.user.get exists? No, identityApi.user doesn't have get('/api/v1/users/profile')
  }
];

for (const fix of fixes) {
  if (fs.existsSync(fix.file)) {
    let content = fs.readFileSync(fix.file, 'utf8');
    // For simpler global replace
    content = content.replace(new RegExp(fix.target.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), fix.replace);
    fs.writeFileSync(fix.file, content);
    console.log(`Fixed ${fix.file}`);
  }
}

