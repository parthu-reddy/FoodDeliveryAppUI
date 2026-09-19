import { ConfirmProvider, Spinner, ZodErrorBoundary, Surface } from '@shared/ui';
import React, { Suspense, useState } from 'react';
import { CallProvider } from './contexts/CallContext';
import { ConfigProvider } from './contexts/ConfigContext';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { ToastProvider } from './contexts/ToastContext';
import { logout as authLogout } from './lib/authStore';
import { getUserProfile } from './lib/tokenStore';
import { RoleName, UserRole } from './types';

// Lazy load route components for code splitting and bundle optimization
const LoginScreen = React.lazy(() => import("@features/identity/components/LoginScreen"));
const CustomerDashboard = React.lazy(() => import("@/pages/customer/CustomerDashboard"));
const RestaurantDashboard = React.lazy(() => import('@/pages/restaurant/RestaurantDashboard'));
const DeliveryDashboard = React.lazy(() => import("@/pages/delivery/DeliveryDashboard"));
const AdminPortal = React.lazy(() => import("@/pages/admin/AdminPortal"));

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
    // Clear cart when logging in successfully to ensure previous session data is removed.
    localStorage.removeItem('food_delivery_cart');
    localStorage.removeItem('food_delivery_cart_restaurant');
    
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
      <Surface elevation={2} radius="xl" className="px-6 py-4 rounded-2xl flex flex-col items-center gap-3">
        <Spinner size="md" color="var(--color-action)" />
        <span className="text-xs font-bold tracking-wider uppercase">Loading Workspace...</span>
      </Surface>
    </div>
  );

  return (
    <div className={`app-background flex-1 flex flex-col overflow-hidden relative w-full h-[100dvh] ${theme === 'dark' ? 'dark text-[#f0ede6]' : 'text-slate-900'}`}>
      {/* No full-bleed photograph here. `.app-background` is the paper ground the design
          specifies (--color-paper with three faint brand gradients); a photo on top of it
          hid that on EVERY screen and put a pastel wash over all content, which is why the
          app read as low-contrast and muddy. Food photography belongs inside the cards,
          edge-to-edge, not behind the interface. The photo remains on the sign-in screen,
          where there is no content for it to compete with. */}

      <div className="flex-1 flex flex-col min-h-0 w-full h-full z-10 p-0 overflow-hidden relative">
        <Suspense fallback={renderFallback()}>
          {!userRole ? (
            // No centring wrapper: RoleShell is a full-height frame that manages its own
            // header, scroll region and insets, and `justify-center` fought it.
            <ZodErrorBoundary contextName="Login Screen">
              <LoginScreen onLoginSuccess={handleLoginSuccess} />
            </ZodErrorBoundary>
          ) : (
            <CallProvider>
              <div className="flex-1 flex flex-col w-full h-full overflow-hidden relative">
                {userRole === RoleName.CUSTOMER && (
                  <ZodErrorBoundary contextName="Customer Dashboard">
                    <CustomerDashboard 
                      userName={userName || 'Customer'} 
                      userPhone={phone}
                      onLogout={handleLogout}
                    />
                  </ZodErrorBoundary>
                )}
                {userRole === RoleName.RESTAURANT && (
                  <ZodErrorBoundary contextName="Restaurant Dashboard">
                    <RestaurantDashboard 
                      restaurantId=""
                      onLogout={handleLogout}
                    />
                  </ZodErrorBoundary>
                )}
                {userRole === RoleName.DELIVERY && (
                  <ZodErrorBoundary contextName="Delivery Dashboard">
                    <DeliveryDashboard 
                      riderPhone={phone}
                      onLogout={handleLogout}
                    />
                  </ZodErrorBoundary>
                )}
                {userRole === RoleName.ADMIN && (
                  <ZodErrorBoundary contextName="Admin Portal">
                    <AdminPortal 
                      onLogout={handleLogout}
                    />
                  </ZodErrorBoundary>
                )}
              </div>
            </CallProvider>
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
          <ConfirmProvider>
            <AppContent />
          </ConfirmProvider>
        </ToastProvider>
      </ConfigProvider>
    </ThemeProvider>
  );
}
