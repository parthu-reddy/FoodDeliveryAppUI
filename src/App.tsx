import React, { useState } from 'react';
import { RoleName } from './types/backend-enums';
import { UserRole } from './types';
import LoginScreen from './components/LoginScreen';
import CinematicFoodBackground from './components/CinematicFoodBackground';
import CustomerDashboard from './components/CustomerDashboard';
import RestaurantDashboard from './components/RestaurantDashboard';
import DeliveryDashboard from './components/DeliveryDashboard';
import AdminPortal from './components/AdminPortal';
import { getUserProfile } from './lib/tokenStore';
import { logout as authLogout } from './lib/authStore';
import { ToastProvider } from './context/ToastContext';

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

  return (
    <ToastProvider>
      <div className={`flex-1 flex flex-col overflow-hidden relative w-full h-[100dvh] ${m3Theme === 'dark' ? 'dark text-[#f0ede6]' : 'text-slate-900'}`}>
      {!userRole ? (
        <div className="w-full h-full flex-1 flex flex-col overflow-hidden relative ">
          <CinematicFoodBackground theme={m3Theme} />
          <div className="flex-1 flex flex-col min-h-0 w-full h-full z-10 p-0 overflow-hidden relative">
            <div className="flex-1 flex flex-col w-full h-full justify-center items-center overflow-hidden relative">
              <LoginScreen 
                onLoginSuccess={handleLoginSuccess} 
                theme={m3Theme} 
                onToggleTheme={handleToggleTheme}
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col w-full h-full overflow-hidden  relative">
          {userRole === RoleName.CUSTOMER && (
            <div className="w-full h-full flex-1 flex flex-col overflow-hidden relative ">
              <CinematicFoodBackground theme={m3Theme} />
              <div className="flex-1 flex flex-col min-h-0 w-full h-full z-10 p-0 overflow-hidden relative">
                <CustomerDashboard 
                  userName={userName || 'Customer'} 
                  userPhone={phone}
                  onLogout={handleLogout}
                  theme={m3Theme}
                  onToggleTheme={handleToggleTheme}
                />
              </div>
            </div>
          )}
          {userRole === RoleName.RESTAURANT && (
            <div className="w-full h-full flex-1 flex flex-col overflow-hidden relative ">
              <CinematicFoodBackground theme={m3Theme} />
              <div className="flex-1 flex flex-col min-h-0 w-full h-full z-10 p-0 overflow-hidden relative">
                <RestaurantDashboard 
                  restaurantId=""
                  onLogout={handleLogout}
                  theme={m3Theme}
                  onToggleTheme={handleToggleTheme}
                />
              </div>
            </div>
          )}
          {userRole === RoleName.DELIVERY && (
            <div className="w-full h-full flex-1 flex flex-col overflow-hidden relative ">
              <CinematicFoodBackground theme={m3Theme} />
              <div className="flex-1 flex flex-col min-h-0 w-full h-full z-10 p-0 overflow-hidden relative">
                <DeliveryDashboard 
                  riderPhone={phone}
                  onLogout={handleLogout}
                  theme={m3Theme}
                  onToggleTheme={handleToggleTheme}
                />
              </div>
            </div>
          )}
          {userRole === RoleName.ADMIN && (
            <div className="w-full h-full flex-1 flex flex-col overflow-hidden relative ">
              <CinematicFoodBackground theme={m3Theme} />
              <div className="flex-1 flex flex-col min-h-0 w-full h-full z-10 p-0 overflow-hidden relative">
                <AdminPortal 
                  onLogout={handleLogout}
                  theme={m3Theme}
                  onToggleTheme={handleToggleTheme}
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
    </ToastProvider>
  );
}
