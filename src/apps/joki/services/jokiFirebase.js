import { db } from "../../../config/firebaseConfig";
import { 
  collection, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  writeBatch 
} from "firebase/firestore";

// Default workspace ID if none specified
export const DEFAULT_WORKSPACE_ID = "kadal";

// ── Workspaces Listener ──
export const subscribeJokiWorkspaces = (callback) => {
  const colRef = collection(db, "joki_workspaces");
  return onSnapshot(colRef, (snapshot) => {
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    // Sort so default is first
    data.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
    callback(data);
  });
};

// ── Customers Listener per Workspace ──
export const subscribeJokiCustomers = (workspaceId = DEFAULT_WORKSPACE_ID, callback) => {
  const colRef = collection(db, "joki_workspaces", workspaceId, "customers");
  const q = query(colRef, orderBy("createdAt", "desc"));
  return onSnapshot(q, (snapshot) => {
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(data);
  });
};

// ── Queue Listener per Workspace ──
export const subscribeJokiQueue = (workspaceId = DEFAULT_WORKSPACE_ID, callback) => {
  const colRef = collection(db, "joki_workspaces", workspaceId, "queue");
  const q = query(colRef, orderBy("orderIndex", "asc"));
  return onSnapshot(q, (snapshot) => {
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    // Fallback sort if orderIndex is not set
    data.sort((a, b) => (a.orderIndex ?? a.createdAt ?? 0) - (b.orderIndex ?? b.createdAt ?? 0));
    callback(data);
  });
};

// ── Settings Listener per Workspace ──
export const subscribeJokiSettings = (workspaceId = DEFAULT_WORKSPACE_ID, callback) => {
  const docRef = doc(db, "joki_workspaces", workspaceId, "settings", "global");
  return onSnapshot(docRef, (snapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.data());
    } else {
      callback({
        streamStatus: "LIVE",
        nextStreamSchedule: "",
        globalPaused: false,
        globalPauseStarted: null
      });
    }
  });
};

// Helper: Generate Unique 5-char Ticket ID (e.g., JK-B5BT4)
export const generateTicketId = () => {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let result = '';
  for (let i = 0; i < 5; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `JK-${result}`;
};

// ── Customers CRUD per Workspace ──
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
export const computeLiveStatus = (settings, activeCustomers = []) => {
  // If there are customers currently running in live slots (not paused)
  const hasRunningSlots = activeCustomers && activeCustomers.some(c => !c.finished && !c.paused);

  if (!settings) {
    if (hasRunningSlots) {
      return {
        status: 'LIVE',
        label: 'Live Stream',
        subtext: 'Sedang live streaming sekarang! Pantau slot dan tiket kamu di sini.'
      };
    }
    return {
      status: 'LIVE',
      label: 'Live Stream',
      subtext: 'Sedang live streaming sekarang! Pantau slot dan tiket kamu di sini.'
    };
  }

  const { liveStartTime, liveEndTime, manualOverride, streamStatus, nextStreamSchedule } = settings;

  // 1. Explicit Stream Status Override (LIVE, BREAK, OFFLINE)
  if (streamStatus === 'LIVE') {
    return {
      status: 'LIVE',
      label: 'Live Stream',
      subtext: nextStreamSchedule ? nextStreamSchedule : 'Sedang live streaming sekarang! Pantau slot dan tiket kamu di sini.'
    };
  }

  if (streamStatus === 'BREAK') {
    return {
      status: 'BREAK',
      label: 'Break / Istirahat',
      subtext: nextStreamSchedule ? nextStreamSchedule : 'Streamer lagi istirahat/makan sebentar. Joki segera dilanjutkan!'
    };
  }

  if (manualOverride && streamStatus === 'OFFLINE') {
    return {
      status: 'OFFLINE',
      label: 'Off Stream',
      subtext: nextStreamSchedule 
        ? `Jadwal live berikutnya: ${nextStreamSchedule}`
        : 'Akun aman di antrean dan akan dimainkan pada sesi live berikutnya.'
    };
  }

  // 2. If active slots are currently running, streamer is unequivocally LIVE!
  if (hasRunningSlots) {
    return {
      status: 'LIVE',
      label: 'Live Stream',
      subtext: nextStreamSchedule ? nextStreamSchedule : 'Sedang live streaming sekarang! Pantau slot dan tiket kamu di sini.'
    };
  }

  // 3. Time-based automated schedule (if enabled without manual override)
  if (liveStartTime && liveEndTime && !manualOverride) {
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
        subtext: nextStreamSchedule ? nextStreamSchedule : `Streamer sedang live sampai pukul ${liveEndTime} WIB.`
      };
    } else if (currentMinutes < startMinutes) {
      return {
        status: 'OFFLINE',
        label: 'Off Stream',
        liveStartTime,
        liveEndTime,
        subtext: nextStreamSchedule ? nextStreamSchedule : `Jadwal live hari ini: pukul ${liveStartTime} - ${liveEndTime} WIB.`
      };
    } else {
      return {
        status: 'OFFLINE',
        label: 'Off Stream',
        liveStartTime,
        liveEndTime,
        subtext: nextStreamSchedule ? nextStreamSchedule : `Sesi live hari ini telah selesai (berakhir pukul ${liveEndTime} WIB). Live lagi besok pukul ${liveStartTime} WIB.`
      };
    }
  }

  // 4. Default fallback: If streamStatus is set to OFFLINE explicitly
  if (streamStatus === 'OFFLINE') {
    return {
      status: 'OFFLINE',
      label: 'Off Stream',
      subtext: nextStreamSchedule ? nextStreamSchedule : 'Akun aman di antrean dan akan dimainkan pada live berikutnya.'
    };
  }

  // Default to LIVE
  return {
    status: 'LIVE',
    label: 'Live Stream',
    subtext: nextStreamSchedule ? nextStreamSchedule : 'Sedang live streaming sekarang! Pantau slot dan tiket kamu di sini.'
  };
};
