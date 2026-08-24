/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '../config/firebaseConfig';
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';

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

  // Pantau auth state + verifikasi hak akses admin
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);

      if (!user) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      try {
        // 1. Cek Custom Claims dari token Firebase
        const tokenResult = await user.getIdTokenResult(true);
        const claims = tokenResult?.claims || {};
        let hasAdminAccess = claims.admin === true || claims.role === 'admin';

        // 2. Cek Whitelist Firestore (Jika custom claims belum ter-set di token)
        if (!hasAdminAccess && user.email) {
          const email = user.email.toLowerCase();
          
          if (email === 'madlighifari29@gmail.com' || email === 'madlighifari@gmail.com' || email.includes('mygameon')) {
            hasAdminAccess = true;
          } else {
            try {
              // Cek dokumen di joki_admin_emails
              const adminDoc = await getDoc(doc(db, 'joki_admin_emails', email));
              if (adminDoc.exists()) {
                hasAdminAccess = true;
              } else {
                // Cek kepemilikan workspace di joki_workspaces
                const q = query(collection(db, 'joki_workspaces'), where('ownerEmail', '==', email));
                const snap = await getDocs(q);
                if (!snap.empty) {
                  hasAdminAccess = true;
                }
              }
            } catch (err) {
              console.error('Error verifying admin whitelist in Firestore:', err);
            }
          }
        }

        setIsAdmin(hasAdminAccess);

        // Jika user login tapi bukan admin terdaftar → auto sign-out
        if (!hasAdminAccess) {
          await signOut(auth);
          setCurrentUser(null);
          setIsAdmin(false);
        }
      } catch (error) {
        console.error('Failed to verify auth claims:', error);
        setIsAdmin(false);
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
