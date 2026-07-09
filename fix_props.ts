import * as fs from 'fs';

// Fix Account Modal
let accountModal = fs.readFileSync('src/components/CustomerAccountModal.tsx', 'utf-8');
accountModal = accountModal.replace('export default function CustomerAccountModal({', 'export default function CustomerAccountModal({\n  setIsAddressModalOpen,\n  activeOrders,\n  setTrackingOrder,');
accountModal = accountModal.replace('import { X, User, Package, LogOut, Moon, Sun } from \'lucide-react\';', 'import { X, User, Package, LogOut, Moon, Sun, MapPin } from \'lucide-react\';');
fs.writeFileSync('src/components/CustomerAccountModal.tsx', accountModal);

// Fix Cart Drawer
let cartDrawer = fs.readFileSync('src/components/CustomerCartDrawer.tsx', 'utf-8');
cartDrawer = cartDrawer.replace('export default function CustomerCartDrawer({', 'export default function CustomerCartDrawer({\n  address,\n  setAddress,\n  handleCheckout,');
cartDrawer = cartDrawer.replace('import { X, Plus, Minus, Package, Timer } from \'lucide-react\';', 'import { X, Plus, Minus, Package, Timer, ShieldCheck } from \'lucide-react\';');
fs.writeFileSync('src/components/CustomerCartDrawer.tsx', cartDrawer);

// Fix Dashboard
let dashboard = fs.readFileSync('src/components/CustomerDashboard.tsx', 'utf-8');
dashboard = dashboard.replace('<CustomerAccountModal', '<CustomerAccountModal\n        setIsAddressModalOpen={setIsAddressModalOpen}\n        activeOrders={activeOrders}\n        setTrackingOrder={setTrackingOrder}');
dashboard = dashboard.replace('<CustomerCartDrawer', '<CustomerCartDrawer\n        address={address}\n        setAddress={setAddress}\n        handleCheckout={handleCheckout}');
fs.writeFileSync('src/components/CustomerDashboard.tsx', dashboard);
