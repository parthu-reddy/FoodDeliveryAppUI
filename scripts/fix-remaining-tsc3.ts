import fs from 'fs';

const fixes = [
  {
    file: 'src/components/restaurant/OutletMenuEditor.tsx',
    target: '/api/v1/outlets/:selectedOutlet/menu-overrides/:newMasterdataid',
    replace: '/api/v1/outlets/:outletId/menu-overrides/:masterMenuItemId'
  },
  {
    file: 'src/components/restaurant/OutletMenuEditor.tsx',
    target: 'selectedOutlet: string',
    replace: 'outletId: string'
  },
  {
    file: 'src/components/restaurant/OutletMenuEditor.tsx',
    target: 'newMasterdataid',
    replace: 'masterMenuItemId'
  },
  {
    file: 'src/components/restaurant/OutletRegistration.tsx',
    target: 'mapsApi',
    replace: 'logisticsApi.maps' // Assumes maps is under logisticsApi
  },
  {
    file: 'src/components/restaurant/OutletRegistration.tsx',
    target: '"/api/v1/brands/:brandId/outlets"',
    replace: '"/api/v1/brands"' // Needs proper checking actually, we might need a regex
  },
  {
    file: 'src/components/restaurant/OutletSettingsEditor.tsx',
    target: 'outletid: selectedOutlet.id',
    replace: 'outletId: selectedOutlet.id'
  },
  {
    file: 'src/components/restaurant/RestaurantOrderDetailsModal.tsx',
    target: 'orderrestaurantId:',
    replace: 'restaurantId:'
  },
  {
    file: 'src/components/restaurant/useRestaurantOrders.ts',
    target: 'selectedOutletId:',
    replace: 'restaurantId:'
  },
  {
    file: 'src/components/shared/ChatWidget.tsx',
    target: 'chatApi',
    replace: 'communicationApi'
  },
  {
    file: 'src/components/shared/DocumentUploadField.tsx',
    target: '(customerApi.customerProfile as any).get(\':uploadEndpoint\'',
    replace: '(customerApi as any).get(\':uploadEndpoint\''
  },
  {
    file: 'src/components/shared/SessionManagementModal.tsx',
    target: 'phone:',
    replace: 'phoneNumber:'
  },
  {
    file: 'src/components/shared/SharedSettingsView.tsx',
    target: '"/api/v1/wallets/CUSTOMER/:customerId"',
    replace: '"/api/v1/wallets/:entityType/:entityId"'
  },
  {
    file: 'src/components/shared/SharedSettingsView.tsx',
    target: '"/api/v1/wallets/CUSTOMER/:customerId/transactions"',
    replace: '"/api/v1/wallets/:entityType/:entityId/transactions"'
  },
  {
    file: 'src/contexts/ConfigContext.tsx',
    target: 'identityApi.user.get',
    replace: 'identityApi.internalUser.get'
  },
  {
    file: 'src/hooks/useWebRTC.ts',
    target: 'chatApi.',
    replace: 'communicationApi.chat.'
  }
];

for (const fix of fixes) {
  if (fs.existsSync(fix.file)) {
    let content = fs.readFileSync(fix.file, 'utf8');
    if (content.includes(fix.target)) {
      content = content.replace(new RegExp(fix.target.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), fix.replace);
      fs.writeFileSync(fix.file, content);
      console.log(`Fixed ${fix.file}`);
    }
  }
}

// Fix menuStore.ts
if (fs.existsSync('src/lib/menuStore.ts')) {
  let content = fs.readFileSync('src/lib/menuStore.ts', 'utf8');
  content = content.replace(/import { apiGet, apiPost, apiPut, apiDelete } from '\.\/apiClient';/, 
`async function apiGet(url: string) { const res = await fetch(url); return { data: await res.json() }; }
async function apiPost(url: string, body: any) { const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }); return { data: await res.json() }; }
async function apiPut(url: string, body: any) { const res = await fetch(url, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }); return { data: await res.json() }; }
async function apiDelete(url: string) { await fetch(url, { method: 'DELETE' }); }`);
  fs.writeFileSync('src/lib/menuStore.ts', content);
  console.log('Fixed src/lib/menuStore.ts');
}

