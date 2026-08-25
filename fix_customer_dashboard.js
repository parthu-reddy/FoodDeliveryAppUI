const fs = require('fs');

function fixCustomerDashboard() {
  let file = fs.readFileSync('src/pages/customer/CustomerDashboard.tsx', 'utf8');
  
  // Fix getCartTotal return type
  file = file.replace(/const getCartTotal = \(restaurantId\?: string\): unknown => \{/g, 'const getCartTotal = (restaurantId?: string) => {');
  
  // Remove deliveryLat and deliveryLng from CustomerOutletSelectorModal props again
  file = file.replace(/\s*deliveryLat=\{deliveryLat \?\? undefined\}/g, '');
  file = file.replace(/\s*deliveryLng=\{deliveryLng \?\? undefined\}/g, '');

  fs.writeFileSync('src/pages/customer/CustomerDashboard.tsx', file);
}

function fixUseCustomerCart() {
  let file = fs.readFileSync('src/features/customer-orders/model/useCustomerCart.ts', 'utf8');
  file = file.replace(/orderPayload as unknown as Parameters/g, 'orderPayload as never');
  fs.writeFileSync('src/features/customer-orders/model/useCustomerCart.ts', file);
}

function fixOutletRegistration() {
  let file = fs.readFileSync('src/features/catalog/components/restaurant/OutletRegistration.tsx', 'utf8');
  file = file.replace(/newOutlet as never/g, 'newOutlet as any');
  fs.writeFileSync('src/features/catalog/components/restaurant/OutletRegistration.tsx', file);
}

function fixOutletShiftEditor() {
  let file = fs.readFileSync('src/features/catalog/components/restaurant/OutletShiftEditor.tsx', 'utf8');
  file = file.replace(/\{ timings: formattedTimings \} as never/g, '{ timings: formattedTimings } as any');
  fs.writeFileSync('src/features/catalog/components/restaurant/OutletShiftEditor.tsx', file);
}

fixCustomerDashboard();
fixUseCustomerCart();
fixOutletRegistration();
fixOutletShiftEditor();
console.log('Fixed files');
