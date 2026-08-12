import React, { useState, Suspense } from 'react';
import { RoleName } from './types/backend-enums';
import { UserRole } from './types';
import CinematicFoodBackground from './components/shared/CinematicFoodBackground';
import { getUserProfile } from './lib/tokenStore';
import { logout as authLogout } from './lib/authStore';
import { ToastProvider } from './context/ToastContext';
import { CallProvider } from './context/CallContext';
import { ErrorBoundary } from './components/shared/ErrorBoundary';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { ConfigProvider } from './contexts/ConfigContext';

// Lazy load route components for code splitting and bundle optimization
const LoginScreen = React.lazy(() => import('./components/auth/LoginScreen'));
const CustomerDashboard = React.lazy(() => import('./components/customer/CustomerDashboard'));
const RestaurantDashboard = React.lazy(() => import('./components/restaurant/RestaurantDashboard'));
const DeliveryDashboard = React.lazy(() => import('./components/delivery/DeliveryDashboard'));
const AdminPortal = React.lazy(() => import('./components/admin/AdminPortal'));

function AppContent() {
  // Initialize auth state SYNCHRONOUSLY from localStorage.
  // This ensures the correct dashboard renders on the first render
  // and LoginScreen never briefly mounts when a session exists.
  const [userRole, setUserRole] = useState<RoleName | null>(() => {
    const profile = getUserProfile();
    return profile?.role ? (profile.role as RoleName) : null;
  });
  const [phone, setPhone] = useState(() => {
    const profile = getUserProfile();
    return profile?.phone || '';
  });
  const [userName, setUserName] = useState(() => {
    const profile = getUserProfile();
    return profile?.name || '';
  });
  
  const { theme } = useTheme();

  const handleLoginSuccess = (selectedRole: UserRole, userPhone: string, displayName: string) => {
    setUserRole(selectedRole as RoleName);
    setPhone(userPhone);
    setUserName(displayName);
  };

  const handleLogout = async () => {
    await authLogout();
    setUserRole(null);
    setPhone('');
    setUserName('');
  };

  const renderFallback = () => (
    <div className="flex-1 flex flex-col min-h-0 w-full h-full z-10 p-0 overflow-hidden relative items-center justify-center">
      <div className="glass-panel px-6 py-4 rounded-2xl flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-3 border-rose-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-bold tracking-wider uppercase">Loading Workspace...</span>
      </div>
    </div>
  );

  return (
    <div className={`app-background flex-1 flex flex-col overflow-hidden relative w-full h-[100dvh] ${theme === 'dark' ? 'dark text-[#f0ede6]' : 'text-slate-900'}`}>
      <CinematicFoodBackground theme={theme} />
      
      <div className="flex-1 flex flex-col min-h-0 w-full h-full z-10 p-0 overflow-hidden relative">
        <Suspense fallback={renderFallback()}>
          {!userRole ? (
            <div className="flex-1 flex flex-col w-full h-full justify-center items-center overflow-hidden relative">
              <ErrorBoundary fallbackLabel="Login Screen">
                <LoginScreen onLoginSuccess={handleLoginSuccess} />
              </ErrorBoundary>
            </div>
          ) : (
            <div className="flex-1 flex flex-col w-full h-full overflow-hidden relative">
              {userRole === RoleName.CUSTOMER && (
                <ErrorBoundary fallbackLabel="Customer Dashboard">
                  <CustomerDashboard 
                    userName={userName || 'Customer'} 
                    userPhone={phone}
                    onLogout={handleLogout}
                  />
                </ErrorBoundary>
              )}
              {userRole === RoleName.RESTAURANT && (
                <ErrorBoundary fallbackLabel="Restaurant Dashboard">
                  <RestaurantDashboard 
                    restaurantId=""
                    onLogout={handleLogout}
                  />
                </ErrorBoundary>
              )}
              {userRole === RoleName.DELIVERY && (
                <ErrorBoundary fallbackLabel="Delivery Dashboard">
                  <DeliveryDashboard 
                    riderPhone={phone}
                    onLogout={handleLogout}
                  />
                </ErrorBoundary>
              )}
              {userRole === RoleName.ADMIN && (
                <ErrorBoundary fallbackLabel="Admin Portal">
                  <AdminPortal 
                    onLogout={handleLogout}
                  />
                </ErrorBoundary>
              )}
            </div>
          )}
        </Suspense>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <ConfigProvider>
        <ToastProvider>
          <CallProvider>
            <AppContent />
          </CallProvider>
        </ToastProvider>
      </ConfigProvider>
    </ThemeProvider>
  );
}

