import { collection, doc, setDoc, updateDoc, deleteDoc, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "../../../config/firebaseConfig";

export const JOKI_CUSTOMERS_COL = "joki_customers";
export const JOKI_QUEUE_COL = "joki_queue";
export const JOKI_SETTINGS_COL = "joki_settings";

// ── Customers Subscription ──
export const subscribeJokiCustomers = (callback) => {
  const q = query(collection(db, JOKI_CUSTOMERS_COL), orderBy("createdAt", "desc"));
  return onSnapshot(q, (snapshot) => {
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(data);
  }, (error) => {
    console.error("Error subscribing to joki customers:", error);
  });
};

// ── Queue Subscription ──
export const subscribeJokiQueue = (callback) => {
  const q = query(collection(db, JOKI_QUEUE_COL), orderBy("createdAt", "asc"));
  return onSnapshot(q, (snapshot) => {
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(data);
  }, (error) => {
    console.error("Error subscribing to joki queue:", error);
  });
};

// ── Settings Subscription ──
export const subscribeJokiSettings = (callback) => {
  const docRef = doc(db, JOKI_SETTINGS_COL, "global");
  return onSnapshot(docRef, (docSnap) => {
    if (docSnap.exists()) {
      callback(docSnap.data());
    } else {
      callback({ globalPaused: false, globalPauseStarted: null });
    }
  }, (error) => {
    console.error("Error subscribing to joki settings:", error);
  });
};

// ── Customer CRUD ──
export const addJokiCustomer = async (customerData) => {
  const newDocRef = doc(collection(db, JOKI_CUSTOMERS_COL));
  await setDoc(newDocRef, { 
    ...customerData, 
    createdAt: customerData.createdAt || Date.now() 
  });
  return newDocRef.id;
};

export const updateJokiCustomer = async (id, data) => {
  const docRef = doc(db, JOKI_CUSTOMERS_COL, id);
  await updateDoc(docRef, data);
};

export const deleteJokiCustomer = async (id) => {
  const docRef = doc(db, JOKI_CUSTOMERS_COL, id);
  await deleteDoc(docRef);
};

// ── Queue CRUD ──
export const addJokiQueue = async (queueData) => {
  const newDocRef = doc(collection(db, JOKI_QUEUE_COL));
  await setDoc(newDocRef, {
    ...queueData,
    createdAt: Date.now()
  });
  return newDocRef.id;
};

export const updateJokiQueue = async (id, data) => {
  const docRef = doc(db, JOKI_QUEUE_COL, id);
  await updateDoc(docRef, data);
};

export const deleteJokiQueue = async (id) => {
  const docRef = doc(db, JOKI_QUEUE_COL, id);
  await deleteDoc(docRef);
};

// ── Settings Update ──
export const updateJokiSettings = async (data) => {
  const docRef = doc(db, JOKI_SETTINGS_COL, "global");
  await setDoc(docRef, data, { merge: true });
};
