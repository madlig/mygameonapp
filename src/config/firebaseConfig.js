import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, getDocs, onSnapshot, deleteDoc, doc, getDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAb_uPu_YAdPUeWks1h_VUgPGSUJfCVYCc",
  authDomain: "mygameonwebsite.firebaseapp.com",
  projectId: "mygameonwebsite",
  storageBucket: "mygameonwebsite.firebasestorage.app",
  messagingSenderId: "66873549274",
  appId: "1:66873549274:web:5c10c175c2374d919de0e3"
};

// Inisialisasi Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db, collection, addDoc, getDocs, onSnapshot, deleteDoc, doc, getDoc };