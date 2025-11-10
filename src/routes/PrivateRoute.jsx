import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const PrivateRoute = () => {
  const { currentUser, loading } = useAuth(); // Dapatkan currentUser dan loading state
  // Jika masih loading (menunggu status autentikasi dari Firebase), jangan render apa-apa
  if (loading) {
    return <div>Loading Authentication...</div>; //Atau tampilkan <spinner />
  }
  if (currentUser) {
    return <Outlet />; // Jika sudah terautentikasi, render komponen yang ditentukan oleh Outlet
  }
  return <Navigate to="/login" />; // Jika belum terautentikasi, arahkan ke halaman login
}

export default PrivateRoute;