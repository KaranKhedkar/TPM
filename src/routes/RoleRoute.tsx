import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { Role } from '../types';

interface RoleRouteProps {
  allowedRoles: Role[];
  children: React.ReactNode;
}

export const RoleRoute: React.FC<RoleRouteProps> = ({ allowedRoles, children }) => {
  const { currentUser, addToast } = useStore();

  const isAllowed = allowedRoles.includes(currentUser.role);

  useEffect(() => {
    if (!isAllowed) {
      addToast({
        type: 'error',
        message: "You don't have access to that page.",
      });
    }
  }, [isAllowed, addToast]);

  if (!isAllowed) {
    let redirectPath = '/rounds';
    if (currentUser.role === 'doctor') {
      redirectPath = '/doctor/queue';
    } else if (currentUser.role === 'admin') {
      redirectPath = '/admin/dashboard';
    }
    return <Navigate to={redirectPath} replace />;
  }

  return <>{children}</>;
};
