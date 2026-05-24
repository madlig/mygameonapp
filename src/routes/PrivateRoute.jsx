import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const PrivateRoute = () => {
  const { currentUser, isAdmin, loading } = useAuth();

  // Auth state masih loading — tampilkan spinner (dark themed)
  if (loading) {
    return (
      <div className="min-h-screen bg-[#111317] grid place-items-center">
        <div className="flex flex-col items-center gap-3 text-[#7E8796]">
          <svg className="animate-spin w-6 h-6" viewBox="0 0 24 24" fill="none">
            <circle
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="3"
              className="opacity-25"
            />
            <path
              d="M4 12a8 8 0 018-8"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
            />
          </svg>
          <span className="text-sm">Memverifikasi akses...</span>
        </div>
      </div>
    );
  }

  // Harus punya user DAN admin claim
  if (!currentUser || !isAdmin) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

export default PrivateRoute;
