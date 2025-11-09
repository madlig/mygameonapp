import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const PrivateRoute = () => {
  const { currentUser, loading } = useAuth(); // Dapatkan currentUser dan loading state
  // Jika masih loading (menunggu status autentikasi dari Firebase), tampilkan loading
  if (loading) {
    return <div>Loading Authentication...</div>; //Atau tampilkan <spinner />
  }
  // Jika tidak ada currentUser, redirect ke login
  if (!currentUser) {
    return <Navigate to="/login" />; // Jika belum terautentikasi, arahkan ke halaman login
  }
  // Jika sudah terautentikasi, render komponen yang ditentukan oleh Outlet
  return <Outlet />;
}

export default PrivateRoute;