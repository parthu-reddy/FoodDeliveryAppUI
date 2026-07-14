import React, { useState, useEffect } from 'react';
import { UserRole } from './types';
import LoginScreen from './components/LoginScreen';
import CinematicFoodBackground from './components/CinematicFoodBackground';
import CustomerDashboard from './components/CustomerDashboard';
import RestaurantDashboard from './components/RestaurantDashboard';
import DeliveryDashboard from './components/DeliveryDashboard';
import AdminPortal from './components/AdminPortal';
import { getUserProfile, logout as authLogout } from './lib/authStore';

export default function App() {
  const [role, setRole] = useState<UserRole | null>(null);
  const [phone, setPhone] = useState('');
  const [userName, setUserName] = useState('');
  const [m3Theme, setM3Theme] = useState<'light' | 'dark'>('light');

  // Restore session from JWT on mount
  useEffect(() => {
    const profile = getUserProfile();
    if (profile && profile.role && profile.phone) {
      setRole(profile.role as UserRole);
      setPhone(profile.phone);
      setUserName(profile.name || '');
    }
  }, []);

  const handleLoginSuccess = (selectedRole: UserRole, userPhone: string, displayName: string) => {
    setRole(selectedRole);
    setPhone(userPhone);
    setUserName(displayName);
  };

  const handleLogout = async () => {
    await authLogout();
    setRole(null);
    setPhone('');
    setUserName('');
  };

  const handleToggleTheme = () => {
    setM3Theme(m3Theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <div className={`flex-1 flex flex-col overflow-hidden relative w-full h-[100dvh] ${m3Theme === 'dark' ? 'dark text-[#f0ede6]' : 'text-slate-900'}`}>
      {!role ? (
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
          {role === 'customer' && (
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
          {role === 'restaurant' && (
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
          {role === 'delivery' && (
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
          {role === 'admin' && (
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
  );
}
