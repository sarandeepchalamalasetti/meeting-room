import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
const RoleProtectedRoute = ({ allowedRoles, children }) => {
  const user = JSON.parse(sessionStorage.getItem('user'));
  const location = useLocation();

  const userRole = user?.role;
  const currentPath = location.pathname;

  if (!allowedRoles.includes(userRole)) {
    toast.error(`You are not allowed to access this page: ${currentPath}`);

    // Find a fallback route based on role
    const fallback = {
      manager: '/dashboard',
      hr: '/dashboard',
      employee: '/dashboard'
    };

    return <Navigate to={fallback[userRole] || '/dashboard'} replace />;
  }

  return children;
};

export default RoleProtectedRoute;
