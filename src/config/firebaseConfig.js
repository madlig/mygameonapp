import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, collection, addDoc, getDocs, onSnapshot, deleteDoc, doc, getDoc, setDoc, query, where, orderBy, serverTimestamp } from "firebase/firestore";
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';
import { getFunctions, httpsCallable } from 'firebase/functions';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Inisialisasi Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);
const functions = getFunctions(app, 'asia-southeast2');

export { 
  app,
  db, 
  storage, 
  auth, 
  functions,
  httpsCallable,
  collection, 
  addDoc, 
  getDocs, 
  onSnapshot, 
  deleteDoc, 
  doc, 
  getDoc, 
  setDoc, 
  query, 
  where, 
  orderBy, 
  serverTimestamp,
  firebaseConfig
};