import React, { useState, Suspense } from 'react';
import { RoleName } from './types/backend-enums';
import { UserRole } from './types';
import CinematicFoodBackground from './components/shared/CinematicFoodBackground';
import { getUserProfile } from './lib/tokenStore';
import { logout as authLogout } from './lib/authStore';
import { ToastProvider } from './context/ToastContext';
import { CallProvider } from './context/CallContext';
import { ErrorBoundary } from './components/shared/ErrorBoundary';

// Lazy load route components for code splitting and bundle optimization
const LoginScreen = React.lazy(() => import('./components/auth/LoginScreen'));
const CustomerDashboard = React.lazy(() => import('./components/customer/CustomerDashboard'));
const RestaurantDashboard = React.lazy(() => import('./components/restaurant/RestaurantDashboard'));
const DeliveryDashboard = React.lazy(() => import('./components/delivery/DeliveryDashboard'));
const AdminPortal = React.lazy(() => import('./components/admin/AdminPortal'));

export default function App() {
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
  const [m3Theme, setM3Theme] = useState<'light' | 'dark'>('light');

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

  const handleToggleTheme = () => {
    setM3Theme(m3Theme === 'dark' ? 'light' : 'dark');
  };

  const renderFallback = () => (
    <div className="w-full h-full flex-1 flex flex-col overflow-hidden relative">
      <CinematicFoodBackground theme={m3Theme} />
      <div className="flex-1 flex flex-col min-h-0 w-full h-full z-10 p-0 overflow-hidden relative items-center justify-center">
        <div className="flex flex-col items-center gap-3 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md px-6 py-4 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800">
          <div className="w-8 h-8 border-3 border-rose-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-bold tracking-wider uppercase text-slate-700 dark:text-slate-300">Loading Workspace...</span>
        </div>
      </div>
    </div>
  );

  return (
    <ToastProvider>
      <CallProvider>
        <div className={`flex-1 flex flex-col overflow-hidden relative w-full h-[100dvh] ${m3Theme === 'dark' ? 'dark text-[#f0ede6]' : 'text-slate-900'}`}>
          <Suspense fallback={renderFallback()}>
          {!userRole ? (
            <div className="w-full h-full flex-1 flex flex-col overflow-hidden relative ">
              <CinematicFoodBackground theme={m3Theme} />
              <div className="flex-1 flex flex-col min-h-0 w-full h-full z-10 p-0 overflow-hidden relative">
                <div className="flex-1 flex flex-col w-full h-full justify-center items-center overflow-hidden relative">
                  <ErrorBoundary fallbackLabel="Login Screen">
                    <LoginScreen 
                      onLoginSuccess={handleLoginSuccess} 
                      theme={m3Theme} 
                      onToggleTheme={handleToggleTheme}
                    />
                  </ErrorBoundary>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col w-full h-full overflow-hidden relative">
              {userRole === RoleName.CUSTOMER && (
                <div className="w-full h-full flex-1 flex flex-col overflow-hidden relative ">
                  <CinematicFoodBackground theme={m3Theme} />
                  <div className="flex-1 flex flex-col min-h-0 w-full h-full z-10 p-0 overflow-hidden relative">
                    <ErrorBoundary fallbackLabel="Customer Dashboard">
                    <CustomerDashboard 
                      userName={userName || 'Customer'} 
                      userPhone={phone}
                      onLogout={handleLogout}
                      theme={m3Theme}
                      onToggleTheme={handleToggleTheme}
                    />
                    </ErrorBoundary>
                  </div>
                </div>
              )}
              {userRole === RoleName.RESTAURANT && (
                <div className="w-full h-full flex-1 flex flex-col overflow-hidden relative ">
                  <CinematicFoodBackground theme={m3Theme} />
                  <div className="flex-1 flex flex-col min-h-0 w-full h-full z-10 p-0 overflow-hidden relative">
                    <ErrorBoundary fallbackLabel="Restaurant Dashboard">
                    <RestaurantDashboard 
                      restaurantId=""
                      onLogout={handleLogout}
                      theme={m3Theme}
                      onToggleTheme={handleToggleTheme}
                    />
                    </ErrorBoundary>
                  </div>
                </div>
              )}
              {userRole === RoleName.DELIVERY && (
                <div className="w-full h-full flex-1 flex flex-col overflow-hidden relative ">
                  <CinematicFoodBackground theme={m3Theme} />
                  <div className="flex-1 flex flex-col min-h-0 w-full h-full z-10 p-0 overflow-hidden relative">
                    <ErrorBoundary fallbackLabel="Delivery Dashboard">
                    <DeliveryDashboard 
                      riderPhone={phone}
                      onLogout={handleLogout}
                      theme={m3Theme}
                      onToggleTheme={handleToggleTheme}
                    />
                    </ErrorBoundary>
                  </div>
                </div>
              )}
              {userRole === RoleName.ADMIN && (
                <div className="w-full h-full flex-1 flex flex-col overflow-hidden relative ">
                  <CinematicFoodBackground theme={m3Theme} />
                  <div className="flex-1 flex flex-col min-h-0 w-full h-full z-10 p-0 overflow-hidden relative">
                    <ErrorBoundary fallbackLabel="Admin Portal">
                    <AdminPortal 
                      onLogout={handleLogout}
                      theme={m3Theme}
                      onToggleTheme={handleToggleTheme}
                    />
                    </ErrorBoundary>
                  </div>
                </div>
              )}
            </div>
          )}
        </Suspense>
      </div>
      </CallProvider>
    </ToastProvider>
  );
}

