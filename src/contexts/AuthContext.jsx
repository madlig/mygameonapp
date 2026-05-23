/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth } from '../config/firebaseConfig';
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';

// ── Context ──────────────────────────────────────────────────
const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

// ── Provider ─────────────────────────────────────────────────
export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  // Login — hanya sign-in, TIDAK ada signup dari client
  async function login(email, password) {
    return signInWithEmailAndPassword(auth, email, password);
  }

  // Logout
  async function logout() {
    setIsAdmin(false);
    return signOut(auth);
  }

  // Pantau auth state + baca custom claims
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);

      if (!user) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      try {
        // Force-refresh token supaya claims selalu fresh
        const tokenResult = await user.getIdTokenResult(true);
        const claims = tokenResult?.claims || {};
        const hasAdminClaim = claims.admin === true || claims.role === 'admin';
        setIsAdmin(hasAdminClaim);

        // Jika user login tapi bukan admin → auto sign-out
        // Ini mencegah non-admin session bertahan di browser
        if (!hasAdminClaim) {
          await signOut(auth);
          setCurrentUser(null);
          setIsAdmin(false);
        }
      } catch (error) {
        console.error('Failed to verify auth claims:', error);
        setIsAdmin(false);
        // Token gagal di-refresh → sign out for safety
        try {
          await signOut(auth);
        } catch {
          // ignore
        }
        setCurrentUser(null);
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    isAdmin,
    loading,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
