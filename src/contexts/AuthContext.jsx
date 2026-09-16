/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '../config/firebaseConfig';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  setDoc, 
  collection, 
  query, 
  where, 
  getDocs, 
  serverTimestamp 
} from 'firebase/firestore';

// ── Context ──────────────────────────────────────────────────
const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

// ── Provider ─────────────────────────────────────────────────
export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  // Login konvensional Email/Password
  async function login(email, password) {
    return signInWithEmailAndPassword(auth, email, password);
  }

  // Register akun baru untuk Pembeli / Gamer
  async function register(email, password, displayName = '', shopeeUsername = '') {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    if (displayName && cred.user) {
      try {
        await updateProfile(cred.user, { displayName });
      } catch (profileErr) {
        console.warn('Could not update auth profile displayName:', profileErr);
      }
    }
    const cleanShopee = (shopeeUsername || '').trim().replace(/^@/, '');
    const userDocRef = doc(db, 'users', cred.user.uid);
    const initialProfile = {
      uid: cred.user.uid,
      email: cred.user.email?.toLowerCase() || '',
      displayName: displayName || 'Gamer MyGameON',
      photoURL: cred.user.photoURL || '',
      shopeeUsername: cleanShopee,
      ownedGames: [],
      role: 'user',
      createdAt: serverTimestamp(),
    };
    try {
      await setDoc(userDocRef, initialProfile, { merge: true });
    } catch (dbErr) {
      console.warn('Could not save initial profile to Firestore:', dbErr);
    }
    setUserProfile(initialProfile);
    return cred;
  }

  // Login 1-klik dengan Akun Google untuk Pembeli / Gamer
  async function loginWithGoogle() {
    const provider = new GoogleAuthProvider();
    return signInWithPopup(auth, provider);
  }

  // Update Data Profil Pembeli (misal: Username Shopee)
  async function updateUserProfile(updates) {
    if (!currentUser) return;
    try {
      const userRef = doc(db, 'users', currentUser.uid);
      await setDoc(userRef, { ...updates, updatedAt: serverTimestamp() }, { merge: true });
      setUserProfile((prev) => ({ ...(prev || {}), ...updates }));
      return true;
    } catch (err) {
      console.error('Failed to update user profile in Firestore:', err);
      // Simpan di local state sebagai fallback
      setUserProfile((prev) => ({ ...(prev || {}), ...updates }));
      return false;
    }
  }

  // Logout
  async function logout() {
    setIsAdmin(false);
    setUserProfile(null);
    return signOut(auth);
  }

  // Pantau auth state + sinkronkan profil user & verifikasi hak akses admin
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);

      if (!user) {
        setUserProfile(null);
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
              console.warn('Error verifying admin whitelist in Firestore:', err);
            }
          }
        }

        setIsAdmin(hasAdminAccess);

        // 3. Ambil / Inisialisasi Data Profil Pengguna di Firestore
        try {
          const userDocRef = doc(db, 'users', user.uid);
          const userSnap = await getDoc(userDocRef);

          if (userSnap.exists()) {
            setUserProfile(userSnap.data());
          } else {
            const initialProfile = {
              uid: user.uid,
              email: user.email?.toLowerCase() || '',
              displayName: user.displayName || 'Gamer MyGameON',
              photoURL: user.photoURL || '',
              shopeeUsername: '',
              ownedGames: [],
              role: hasAdminAccess ? 'admin' : 'user',
              createdAt: serverTimestamp(),
            };
            await setDoc(userDocRef, initialProfile, { merge: true });
            setUserProfile(initialProfile);
          }
        } catch (profileErr) {
          console.warn('Could not load user profile from Firestore:', profileErr);
          setUserProfile({
            uid: user.uid,
            email: user.email?.toLowerCase() || '',
            displayName: user.displayName || 'Gamer MyGameON',
            photoURL: user.photoURL || '',
            shopeeUsername: '',
            ownedGames: [],
            role: hasAdminAccess ? 'admin' : 'user',
          });
        }

      } catch (error) {
        console.error('Failed to verify auth state:', error);
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    userProfile,
    isAdmin,
    loading,
    login,
    register,
    loginWithGoogle,
    updateUserProfile,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
