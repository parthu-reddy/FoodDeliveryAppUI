import { ConfirmProvider, Spinner, ZodErrorBoundary, Surface } from '@shared/ui';
import React, { Suspense, useState } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import { CallProvider } from './contexts/CallContext';
import { ConfigProvider } from './contexts/ConfigContext';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { ToastProvider } from './contexts/ToastContext';
import { logout as authLogout } from './lib/authStore';
import { getUserProfile } from './lib/tokenStore';
import { RoleName, UserRole } from './types';
import { RoleGuard } from '@shared/ui';

// Lazy load route components for code splitting and bundle optimization
const LoginScreen = React.lazy(() => import("@features/identity/components/LoginScreen"));
const CustomerDashboard = React.lazy(() => import("@/pages/customer/CustomerDashboard"));
const RestaurantDashboard = React.lazy(() => import('@/pages/restaurant/RestaurantDashboard'));
const DeliveryDashboard = React.lazy(() => import("@/pages/delivery/DeliveryDashboard"));
const AdminPortal = React.lazy(() => import("@/pages/admin/AdminPortal"));

function AppRoutes() {
  const [phone, setPhone] = useState(() => {
    const profile = getUserProfile();
    return profile?.phone || '';
  });
  const [userName, setUserName] = useState(() => {
    const profile = getUserProfile();
    return profile?.name || '';
  });
  
  const { theme } = useTheme();
  const navigate = useNavigate();

  const handleLoginSuccess = (selectedRole: UserRole, userPhone: string, displayName: string) => {
    // Clear cart when logging in successfully to ensure previous session data is removed.
    localStorage.removeItem('food_delivery_cart');
    localStorage.removeItem('food_delivery_cart_restaurant');
    
    setPhone(userPhone);
    setUserName(displayName);
    
    const rolePaths: Record<string, string> = {
      [RoleName.CUSTOMER]: '/customer',
      [RoleName.RESTAURANT]: '/restaurant',
      [RoleName.DELIVERY]: '/delivery',
      [RoleName.ADMIN]: '/admin',
    };
    
    navigate(rolePaths[selectedRole] || '/login');
  };

  const handleLogout = async () => {
    await authLogout();
    setPhone('');
    setUserName('');
    navigate('/login');
  };

  const renderFallback = () => (
    <div className="flex-1 flex flex-col min-h-0 w-full h-full z-10 p-0 overflow-hidden relative items-center justify-center">
      <Surface elevation={2} radius="xl" className="px-6 py-4 rounded-2xl flex flex-col items-center gap-3">
        <Spinner size="md" color="var(--color-action)" />
        <span className="text-xs font-bold tracking-wider uppercase">Loading Workspace...</span>
      </Surface>
    </div>
  );

  return (
    <div className={`app-background flex-1 flex flex-col overflow-hidden relative w-full h-[100dvh] ${theme === 'dark' ? 'dark text-[#f0ede6]' : 'text-slate-900'}`}>
      <div className="flex-1 flex flex-col min-h-0 w-full h-full z-10 p-0 overflow-hidden relative">
        <Suspense fallback={renderFallback()}>
          <Routes>
            <Route path="/login" element={
              <ZodErrorBoundary contextName="Login Screen">
                <LoginScreen onLoginSuccess={handleLoginSuccess} />
              </ZodErrorBoundary>
            } />
            
            <Route path="/customer/*" element={<RoleGuard allowedRole={RoleName.CUSTOMER} />}>
              <Route path="*" element={
                <CallProvider>
                  <ZodErrorBoundary contextName="Customer Dashboard">
                    <CustomerDashboard 
                      userName={userName || 'Customer'} 
                      userPhone={phone}
                      onLogout={handleLogout}
                    />
                  </ZodErrorBoundary>
                </CallProvider>
              } />
            </Route>

            <Route path="/restaurant/*" element={<RoleGuard allowedRole={RoleName.RESTAURANT} />}>
              <Route path="*" element={
                <CallProvider>
                  <ZodErrorBoundary contextName="Restaurant Dashboard">
                    <RestaurantDashboard 
                      restaurantId=""
                      onLogout={handleLogout}
                    />
                  </ZodErrorBoundary>
                </CallProvider>
              } />
            </Route>

            <Route path="/delivery/*" element={<RoleGuard allowedRole={RoleName.DELIVERY} />}>
              <Route path="*" element={
                <CallProvider>
                  <ZodErrorBoundary contextName="Delivery Dashboard">
                    <DeliveryDashboard 
                      riderPhone={phone}
                      onLogout={handleLogout}
                    />
                  </ZodErrorBoundary>
                </CallProvider>
              } />
            </Route>

            <Route path="/admin/*" element={<RoleGuard allowedRole={RoleName.ADMIN} />}>
              <Route path="*" element={
                <CallProvider>
                  <ZodErrorBoundary contextName="Admin Portal">
                    <AdminPortal 
                      onLogout={handleLogout}
                    />
                  </ZodErrorBoundary>
                </CallProvider>
              } />
            </Route>

            {/* Root Redirect */}
            <Route path="*" element={<RootRedirect />} />
          </Routes>
        </Suspense>
      </div>
    </div>
  );
}

function RootRedirect() {
  const profile = getUserProfile();
  if (!profile || !profile.role) {
    return <Navigate to="/login" replace />;
  }
  
  const rolePaths: Record<string, string> = {
    [RoleName.CUSTOMER]: '/customer',
    [RoleName.RESTAURANT]: '/restaurant',
    [RoleName.DELIVERY]: '/delivery',
    [RoleName.ADMIN]: '/admin',
  };
  
  return <Navigate to={rolePaths[profile.role] || '/login'} replace />;
}

export default function App() {
  return (
    <ThemeProvider>
      <ConfigProvider>
        <ToastProvider>
          <ConfirmProvider>
            <BrowserRouter>
              <AppRoutes />
            </BrowserRouter>
          </ConfirmProvider>
        </ToastProvider>
      </ConfigProvider>
    </ThemeProvider>
  );
}
