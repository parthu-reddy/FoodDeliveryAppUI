import * as fs from 'fs';

const code = fs.readFileSync('src/components/CustomerDashboard.tsx', 'utf-8');
const lines = code.split('\n');

const cartDrawerCode = lines.slice(1494, 1594).join('\n');
const accountModalCode = lines.slice(1594, 1726).join('\n');
const addressModalCode = lines.slice(1726, 1819).join('\n');
const paymentModalCode = lines.slice(1819, 1883).join('\n');

fs.writeFileSync('src/components/CustomerCartDrawer.tsx', `
import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Plus, Minus, Package, Timer } from 'lucide-react';
import { Restaurant, CartItem, MenuItem } from '../types';

export default function CustomerCartDrawer({
  isCartOpen,
  setIsCartOpen,
  selectedRestaurant,
  cart,
  removeFromCart,
  addToCart,
  getCartTotal,
  setIsPaymentModalOpen
}: any) {
  return (
${cartDrawerCode}
  );
}
`);

fs.writeFileSync('src/components/CustomerAccountModal.tsx', `
import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, User, Package, LogOut, Moon, Sun } from 'lucide-react';

export default function CustomerAccountModal({
  isAccountModalOpen,
  setIsAccountModalOpen,
  accountTab,
  setAccountTab,
  editName,
  setEditName,
  editPhone,
  setEditPhone,
  userName,
  userPhone,
  onLogout,
  theme,
  onToggleTheme
}: any) {
  return (
${accountModalCode}
  );
}
`);

fs.writeFileSync('src/components/CustomerAddressModal.tsx', `
import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Search, MapPin } from 'lucide-react';

export default function CustomerAddressModal({
  isAddressModalOpen,
  setIsAddressModalOpen,
  addressSearchQuery,
  setAddressSearchQuery,
  address,
  setAddress,
  onAddApiLog
}: any) {
  return (
${addressModalCode}
  );
}
`);

fs.writeFileSync('src/components/CustomerPaymentModal.tsx', `
import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck, Check } from 'lucide-react';

export default function CustomerPaymentModal({
  isPaymentModalOpen,
  setIsPaymentModalOpen,
  paymentStatus,
  getCartTotal,
  processPaymentAndOrder
}: any) {
  return (
${paymentModalCode}
  );
}
`);

// Now replace in CustomerDashboard
const newDashboardLines = [
  ...lines.slice(0, 1494),
  `      <CustomerCartDrawer 
        isCartOpen={isCartOpen}
        setIsCartOpen={setIsCartOpen}
        selectedRestaurant={selectedRestaurant}
        cart={cart}
        removeFromCart={removeFromCart}
        addToCart={addToCart}
        getCartTotal={getCartTotal}
        setIsPaymentModalOpen={setIsPaymentModalOpen}
      />`,
  `      <CustomerAccountModal
        isAccountModalOpen={isAccountModalOpen}
        setIsAccountModalOpen={setIsAccountModalOpen}
        accountTab={accountTab}
        setAccountTab={setAccountTab}
        editName={editName}
        setEditName={setEditName}
        editPhone={editPhone}
        setEditPhone={setEditPhone}
        userName={userName}
        userPhone={userPhone}
        onLogout={onLogout}
        theme={theme}
        onToggleTheme={onToggleTheme}
      />`,
  `      <CustomerAddressModal
        isAddressModalOpen={isAddressModalOpen}
        setIsAddressModalOpen={setIsAddressModalOpen}
        addressSearchQuery={addressSearchQuery}
        setAddressSearchQuery={setAddressSearchQuery}
        address={address}
        setAddress={setAddress}
        onAddApiLog={onAddApiLog}
      />`,
  `      <CustomerPaymentModal
        isPaymentModalOpen={isPaymentModalOpen}
        setIsPaymentModalOpen={setIsPaymentModalOpen}
        paymentStatus={paymentStatus}
        getCartTotal={getCartTotal}
        processPaymentAndOrder={processPaymentAndOrder}
      />`,
  ...lines.slice(1883)
];

let finalCode = newDashboardLines.join('\n');
// add imports
const importBlock = `
import CustomerCartDrawer from './CustomerCartDrawer';
import CustomerAccountModal from './CustomerAccountModal';
import CustomerAddressModal from './CustomerAddressModal';
import CustomerPaymentModal from './CustomerPaymentModal';
`;
finalCode = finalCode.replace("import ImageLoader from './ImageLoader';", "import ImageLoader from './ImageLoader';\n" + importBlock);

fs.writeFileSync('src/components/CustomerDashboard.tsx', finalCode);

