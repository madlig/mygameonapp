import { collection, doc, setDoc, updateDoc, deleteDoc, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "../../../config/firebaseConfig";

export const JOKI_CUSTOMERS_COL = "joki_customers";
export const JOKI_SETTINGS_COL = "joki_settings";

export const subscribeJokiCustomers = (callback) => {
  const q = query(collection(db, JOKI_CUSTOMERS_COL), orderBy("createdAt", "desc"));
  return onSnapshot(q, (snapshot) => {
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(data);
  });
};

export const subscribeJokiSettings = (callback) => {
  const docRef = doc(db, JOKI_SETTINGS_COL, "global");
  return onSnapshot(docRef, (docSnap) => {
    if (docSnap.exists()) {
      callback(docSnap.data());
    } else {
      callback({ globalPaused: false, globalPauseStarted: null });
    }
  });
};

export const addJokiCustomer = async (customerData) => {
  const newDocRef = doc(collection(db, JOKI_CUSTOMERS_COL));
  await setDoc(newDocRef, { ...customerData, createdAt: Date.now() });
};

export const updateJokiCustomer = async (id, data) => {
  const docRef = doc(db, JOKI_CUSTOMERS_COL, id);
  await updateDoc(docRef, data);
};

export const deleteJokiCustomer = async (id) => {
  const docRef = doc(db, JOKI_CUSTOMERS_COL, id);
  await deleteDoc(docRef);
};

export const updateJokiSettings = async (data) => {
  const docRef = doc(db, JOKI_SETTINGS_COL, "global");
  await setDoc(docRef, data, { merge: true });
};
