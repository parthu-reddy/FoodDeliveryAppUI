import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { RoleName } from '@/types';
import { getUserProfile } from '@/lib/tokenStore';

interface RoleGuardProps {
  allowedRole: RoleName;
}

export const RoleGuard: React.FC<RoleGuardProps> = ({ allowedRole }) => {
  const profile = getUserProfile();
  
  if (!profile || !profile.role) {
    return <Navigate to="/login" replace />;
  }

  if (profile.role !== allowedRole) {
    // If they have a different role, redirect to their correct base route
    const rolePaths: Record<string, string> = {
      [RoleName.CUSTOMER]: '/customer',
      [RoleName.RESTAURANT]: '/restaurant',
      [RoleName.DELIVERY]: '/delivery',
      [RoleName.ADMIN]: '/admin',
    };
    
    return <Navigate to={rolePaths[profile.role] || '/login'} replace />;
  }

  return <Outlet />;
};
