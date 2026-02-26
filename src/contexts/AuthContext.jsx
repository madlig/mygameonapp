/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth } from '../config/firebaseConfig'; // Impor 'auth' dari konfigurasi Firebase Anda
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';

// Buat Context
const AuthContext = createContext();

// Hook kustom untuk mengakses konteks autentikasi
export function useAuth() {
  return useContext(AuthContext);
}

// Provider untuk membungkus aplikasi dan menyediakan nilai konteks
export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true); // State untuk menunjukkan loading autentikasi awal

  // Fungsi untuk mendaftar pengguna baru
  async function signup(email, password) {
    return createUserWithEmailAndPassword(auth, email, password);
  }

  // Fungsi untuk login pengguna
  async function login(email, password) {
    return signInWithEmailAndPassword(auth, email, password);
  }

  // Fungsi untuk logout pengguna
  async function logout() {
    return signOut(auth);
  }

  // Efek samping untuk memantau perubahan status autentikasi
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false); // Setelah status diketahui, set loading menjadi false
    });

    return unsubscribe; // Cleanup function
  }, []);

  // Nilai yang akan disediakan oleh AuthContext
  const value = {
    currentUser,
    loading,
    signup,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}{' '}
      {/* Hanya render children jika status loading sudah selesai */}
    </AuthContext.Provider>
  );
}
