import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const PrivateRoute = () => {
  const { currentUser, isAdmin, loading } = useAuth();

  // While auth state is being determined, show loading placeholder (avoid redirect jitter)
  if (loading) {
    return (
      <div className="p-6 text-center">
        <p>Loading authentication status…</p>
      </div>
    );
  }

  if (currentUser && isAdmin) {
    return <Outlet />;
  }

  return <Navigate to="/login" replace />;
};

export default PrivateRoute;
