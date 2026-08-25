import { 
  db 
} from "../../../config/firebaseConfig";
import { 
  collection, 
  doc, 
  getDoc,
  setDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  where,
  orderBy,
  writeBatch
} from "firebase/firestore";

export const DEFAULT_WORKSPACE_ID = 'mygameon';

export const generateTicketId = () => {
  const num = Math.floor(10000 + Math.random() * 90000);
  return `JK-${num}`;
};

// ── Workspaces Subscription ──
export const subscribeJokiWorkspaces = (callback) => {
  const colRef = collection(db, "joki_workspaces");
  const q = query(colRef, orderBy("createdAt", "asc"));
  return onSnapshot(q, (snapshot) => {
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(data);
  }, (error) => {
    console.error("Error subscribing to joki workspaces:", error);
  });
};

// ── Auto Create Workspace if not exists ──
export const createWorkspaceIfNotExists = async (workspaceId, name, ownerEmail) => {
  if (!workspaceId) return;
  try {
    const wsRef = doc(db, "joki_workspaces", workspaceId);
    const snap = await getDoc(wsRef);
    if (!snap.exists()) {
      await setDoc(wsRef, {
        id: workspaceId,
        name: name || `${workspaceId.toUpperCase()} Live`,
        slug: workspaceId,
        ownerEmail: ownerEmail || null,
        createdAt: Date.now()
      });

      // Initialize default settings doc
      await setDoc(doc(db, "joki_workspaces", workspaceId, "settings", "global"), {
        globalPaused: false,
        globalPauseStarted: null,
        streamStatus: 'OFFLINE',
        nextStreamSchedule: '',
        streamNote: '',
        updatedAt: Date.now()
      });
    }
  } catch (err) {
    console.error(`Error creating workspace ${workspaceId}:`, err);
  }
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
  return onSnapshot(colRef, (snapshot) => {
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    // Sort by orderIndex if present, fallback to createdAt
    data.sort((a, b) => {
      const orderA = a.orderIndex !== undefined ? a.orderIndex : (a.createdAt || 0);
      const orderB = b.orderIndex !== undefined ? b.orderIndex : (b.createdAt || 0);
      return orderA - orderB;
    });
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
      callback({ globalPaused: false, globalPauseStarted: null, streamStatus: 'OFFLINE', nextStreamSchedule: '' });
    }
  }, (error) => {
    console.error(`Error subscribing to settings for workspace ${workspaceId}:`, error);
  });
};

// ── Customer CRUD per Workspace ──
export const addJokiCustomer = async (workspaceId = DEFAULT_WORKSPACE_ID, customerData) => {
  const colRef = collection(db, "joki_workspaces", workspaceId, "customers");
  const newDocRef = doc(colRef);
  const ticketId = customerData.ticketId || generateTicketId();
  await setDoc(newDocRef, { 
    ...customerData, 
    workspaceId,
    ticketId,
    passwordRoblox: customerData.passwordRoblox || '',
    emailRoblox: customerData.emailRoblox || '',
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
  const ticketId = queueData.ticketId || generateTicketId();
  await setDoc(newDocRef, {
    ...queueData,
    workspaceId,
    ticketId,
    passwordRoblox: queueData.passwordRoblox || '',
    emailRoblox: queueData.emailRoblox || '',
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

// ── Reorder Queue (Drag-and-Drop Batch Update) ──
export const reorderJokiQueue = async (workspaceId = DEFAULT_WORKSPACE_ID, reorderedList) => {
  if (!reorderedList || reorderedList.length === 0) return;
  const batch = writeBatch(db);
  reorderedList.forEach((item, index) => {
    const docRef = doc(db, "joki_workspaces", workspaceId, "queue", item.id);
    batch.update(docRef, { orderIndex: index });
  });
  await batch.commit();
};

// ── Settings Update per Workspace ──
export const updateJokiSettings = async (workspaceId = DEFAULT_WORKSPACE_ID, data) => {
  const docRef = doc(db, "joki_workspaces", workspaceId, "settings", "global");
  await setDoc(docRef, data, { merge: true });
};

// ── Semi-Automatic Time-Based Live Status Engine ──
export const computeLiveStatus = (settings) => {
  if (!settings) {
    return {
      status: 'OFFLINE',
      label: 'Off Stream',
      subtext: 'Akun aman di antrean dan akan dimainkan pada sesi live berikutnya.'
    };
  }

  const { liveStartTime, liveEndTime, manualOverride, streamStatus, nextStreamSchedule } = settings;

  // 1. Manual override (if streamer forces Break or Live/Offline manually)
  if (manualOverride && streamStatus) {
    if (streamStatus === 'LIVE') {
      return {
        status: 'LIVE',
        label: 'Live Stream',
        subtext: 'Sedang live streaming sekarang! Pantau slot dan tiket kamu di sini.'
      };
    }
    if (streamStatus === 'BREAK') {
      return {
        status: 'BREAK',
        label: 'Break / Istirahat',
        subtext: 'Streamer lagi istirahat/makan sebentar. Joki segera dilanjutkan!'
      };
    }
    if (streamStatus === 'OFFLINE') {
      return {
        status: 'OFFLINE',
        label: 'Off Stream',
        subtext: nextStreamSchedule 
          ? `Jadwal live berikutnya: ${nextStreamSchedule}`
          : 'Akun aman di antrean dan akan dimainkan pada sesi live berikutnya.'
      };
    }
  }

  // 2. Time-based automated schedule
  if (liveStartTime && liveEndTime) {
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    const [startH, startM] = liveStartTime.split(':').map(Number);
    const [endH, endM] = liveEndTime.split(':').map(Number);

    const startMinutes = (startH || 0) * 60 + (startM || 0);
    const endMinutes = (endH || 0) * 60 + (endM || 0);

    let isLiveNow = false;
    if (startMinutes <= endMinutes) {
      isLiveNow = currentMinutes >= startMinutes && currentMinutes < endMinutes;
    } else {
      // Cross midnight (e.g. 21:00 to 03:00)
      isLiveNow = currentMinutes >= startMinutes || currentMinutes < endMinutes;
    }

    if (isLiveNow) {
      return {
        status: 'LIVE',
        label: 'Live Stream',
        liveStartTime,
        liveEndTime,
        subtext: `Streamer sedang live sampai pukul ${liveEndTime} WIB.`
      };
    } else if (currentMinutes < startMinutes) {
      return {
        status: 'OFFLINE',
        label: 'Off Stream',
        liveStartTime,
        liveEndTime,
        subtext: `Jadwal live hari ini: pukul ${liveStartTime} - ${liveEndTime} WIB.`
      };
    } else {
      return {
        status: 'OFFLINE',
        label: 'Off Stream',
        liveStartTime,
        liveEndTime,
        subtext: `Sesi live hari ini telah selesai (berakhir pukul ${liveEndTime} WIB). Live lagi besok pukul ${liveStartTime} WIB.`
      };
    }
  }

  // 3. Fallback
  const st = streamStatus || 'OFFLINE';
  return {
    status: st,
    label: st === 'LIVE' ? 'Live Stream' : (st === 'BREAK' ? 'Break' : 'Off Stream'),
    subtext: nextStreamSchedule ? `Jadwal live berikutnya: ${nextStreamSchedule}` : 'Akun aman di antrean dan akan dimainkan pada live berikutnya.'
  };
};
