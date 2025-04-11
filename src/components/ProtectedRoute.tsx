import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  allowedRoles?: ('student' | 'instructor' | 'admin')[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  allowedRoles 
}) => {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    // Show loading spinner
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  // If role checking is needed and user doesn't have required role
  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    // Redirect to unauthorized page or home
    return <Navigate to="/" />;
  }

  // If authenticated and has correct role, render the protected component
  return <Outlet />;
};

export default ProtectedRoute; 