import { collection, doc, setDoc, updateDoc, deleteDoc, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "../../../config/firebaseConfig";

export const DEFAULT_WORKSPACE_ID = "mygameon";

// ── Workspaces List Subscription ──
export const subscribeJokiWorkspaces = (callback) => {
  const q = query(collection(db, "joki_workspaces"), orderBy("createdAt", "asc"));
  return onSnapshot(q, (snapshot) => {
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(data);
  }, (error) => {
    console.error("Error subscribing to joki workspaces:", error);
  });
};

// ── Customers Subscription per Workspace ──
export const subscribeJokiCustomers = (workspaceId = DEFAULT_WORKSPACE_ID, callback) => {
  const colRef = collection(db, "joki_workspaces", workspaceId, "customers");
  const q = query(colRef, orderBy("createdAt", "desc"));
  return onSnapshot(q, (snapshot) => {
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(data);
  }, (error) => {
    console.error(`Error subscribing to customers for workspace ${workspaceId}:`, error);
  });
};

// ── Queue Subscription per Workspace ──
export const subscribeJokiQueue = (workspaceId = DEFAULT_WORKSPACE_ID, callback) => {
  const colRef = collection(db, "joki_workspaces", workspaceId, "queue");
  const q = query(colRef, orderBy("createdAt", "asc"));
  return onSnapshot(q, (snapshot) => {
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(data);
  }, (error) => {
    console.error(`Error subscribing to queue for workspace ${workspaceId}:`, error);
  });
};

// ── Settings Subscription per Workspace ──
export const subscribeJokiSettings = (workspaceId = DEFAULT_WORKSPACE_ID, callback) => {
  const docRef = doc(db, "joki_workspaces", workspaceId, "settings", "global");
  return onSnapshot(docRef, (docSnap) => {
    if (docSnap.exists()) {
      callback(docSnap.data());
    } else {
      callback({ globalPaused: false, globalPauseStarted: null });
    }
  }, (error) => {
    console.error(`Error subscribing to settings for workspace ${workspaceId}:`, error);
  });
};

// ── Customer CRUD per Workspace ──
export const addJokiCustomer = async (workspaceId = DEFAULT_WORKSPACE_ID, customerData) => {
  const colRef = collection(db, "joki_workspaces", workspaceId, "customers");
  const newDocRef = doc(colRef);
  await setDoc(newDocRef, { 
    ...customerData, 
    workspaceId,
    createdAt: customerData.createdAt || Date.now() 
  });
  return newDocRef.id;
};

export const updateJokiCustomer = async (workspaceId = DEFAULT_WORKSPACE_ID, id, data) => {
  const docRef = doc(db, "joki_workspaces", workspaceId, "customers", id);
  await updateDoc(docRef, data);
};

export const deleteJokiCustomer = async (workspaceId = DEFAULT_WORKSPACE_ID, id) => {
  const docRef = doc(db, "joki_workspaces", workspaceId, "customers", id);
  await deleteDoc(docRef);
};

// ── Queue CRUD per Workspace ──
export const addJokiQueue = async (workspaceId = DEFAULT_WORKSPACE_ID, queueData) => {
  const colRef = collection(db, "joki_workspaces", workspaceId, "queue");
  const newDocRef = doc(colRef);
  await setDoc(newDocRef, {
    ...queueData,
    workspaceId,
    createdAt: Date.now()
  });
  return newDocRef.id;
};

export const updateJokiQueue = async (workspaceId = DEFAULT_WORKSPACE_ID, id, data) => {
  const docRef = doc(db, "joki_workspaces", workspaceId, "queue", id);
  await updateDoc(docRef, data);
};

export const deleteJokiQueue = async (workspaceId = DEFAULT_WORKSPACE_ID, id) => {
  const docRef = doc(db, "joki_workspaces", workspaceId, "queue", id);
  await deleteDoc(docRef);
};

// ── Settings Update per Workspace ──
export const updateJokiSettings = async (workspaceId = DEFAULT_WORKSPACE_ID, data) => {
  const docRef = doc(db, "joki_workspaces", workspaceId, "settings", "global");
  await setDoc(docRef, data, { merge: true });
};
