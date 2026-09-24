import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

const ProtectedRoute = ({ allowedRoles = [] }) => {
  const token = localStorage.getItem('token');
  const userStr = localStorage.getItem('user');

  if (!token || !userStr) {
    return <Navigate to="/login" replace />;
  }

  let user;
  try {
    user = JSON.parse(userStr);
  } catch (err) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    // Redirect unauthorized user to their respective valid dashboard
    const roleDashboards = {
      student: '/student/dashboard',
      hr: '/hr/dashboard',
      tpo: '/tpo/dashboard',
      admin: '/admin/dashboard'
    };

    const target = roleDashboards[user.role] || '/login';
    return <Navigate to={target} replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
