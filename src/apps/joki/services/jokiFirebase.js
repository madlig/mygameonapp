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
  return onSnapshot(colRef, (snapshot) => {
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    // Robust in-memory sorting: orderIndex first, then createdAt asc
    data.sort((a, b) => {
      const idxA = a.orderIndex !== undefined && a.orderIndex !== null ? a.orderIndex : null;
      const idxB = b.orderIndex !== undefined && b.orderIndex !== null ? b.orderIndex : null;
      if (idxA !== null && idxB !== null) return idxA - idxB;
      if (idxA !== null) return -1;
      if (idxB !== null) return 1;
      return (a.createdAt || 0) - (b.createdAt || 0);
    });
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
  const now = Date.now();
  await setDoc(newDocRef, {
    ...queueData,
    workspaceId,
    ticketId,
    passwordRoblox: queueData.passwordRoblox || '',
    emailRoblox: queueData.emailRoblox || '',
    orderIndex: queueData.orderIndex !== undefined ? queueData.orderIndex : now,
    createdAt: now
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

// ── Dual Mode (Schedule / Manual) Live Status Engine ──
export const computeLiveStatus = (settings, activeCustomers = []) => {
  // Check if any active customer is currently running (unpaused)
  const hasRunningSlots = activeCustomers && activeCustomers.some(c => !c.finished && !c.paused);

  if (!settings) {
    if (hasRunningSlots) {
      return {
        status: 'LIVE',
        mode: 'auto',
        label: 'Live Stream',
        subtext: 'Sedang live streaming sekarang! Pantau slot dan tiket kamu di sini.'
      };
    }
    return {
      status: 'OFFLINE',
      mode: 'auto',
      label: 'Off Stream',
      subtext: 'Streamer sedang off stream. Akun aman di antrean.'
    };
  }

  const {
    statusMode = settings.manualOverride ? 'manual' : 'auto', // 'auto' | 'manual'
    manualStatus = settings.streamStatus || 'OFFLINE', // 'LIVE' | 'BREAK' | 'OFFLINE'
    liveStartTime = '09:00',
    liveEndTime = '15:00',
    nextStreamSchedule = ''
  } = settings;

  const note = nextStreamSchedule?.trim() || '';

  // ── 1. MODE MANUAL: 100% Mengikuti Pilihan Streamer ──
  if (statusMode === 'manual') {
    if (manualStatus === 'LIVE') {
      return {
        status: 'LIVE',
        mode: 'manual',
        label: 'Live Stream',
        liveStartTime,
        liveEndTime,
        subtext: note || 'Sedang live streaming sekarang! Pantau slot dan tiket kamu di sini.'
      };
    }
    if (manualStatus === 'BREAK') {
      return {
        status: 'BREAK',
        mode: 'manual',
        label: 'Break / Istirahat',
        liveStartTime,
        liveEndTime,
        subtext: note || 'Streamer lagi istirahat sebentar. Joki segera dilanjutkan!'
      };
    }
    // Default manual status: OFFLINE
    return {
      status: 'OFFLINE',
      mode: 'manual',
      label: 'Off Stream',
      liveStartTime,
      liveEndTime,
      subtext: note 
        ? `Jadwal live berikutnya: ${note}`
        : 'Streamer sedang off stream. Akun aman di antrean dan akan dimainkan pada sesi live berikutnya.'
    };
  }

  // ── 2. MODE OTOMATIS: Berdasarkan Jam Rutin Live & Slot Aktif ──
  // Jika ada slot yang aktif berjalan live (tidak dijeda), otomatis status LIVE
  if (hasRunningSlots) {
    return {
      status: 'LIVE',
      mode: 'auto',
      label: 'Live Stream',
      liveStartTime,
      liveEndTime,
      subtext: note || 'Sedang live streaming sekarang! Pantau slot dan tiket kamu di sini.'
    };
  }

  // Evaluasi waktu berdasarkan Jam WIB (Asia/Jakarta)
  try {
    const now = new Date();
    const wibFormatter = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Jakarta',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
    const [currH, currM] = wibFormatter.format(now).split(':').map(Number);
    const currentMinutes = (currH || 0) * 60 + (currM || 0);

    const [startH, startM] = (liveStartTime || '09:00').split(':').map(Number);
    const [endH, endM] = (liveEndTime || '15:00').split(':').map(Number);
    const startMinutes = (startH || 0) * 60 + (startM || 0);
    const endMinutes = (endH || 0) * 60 + (endM || 0);

    let isWithinLiveHours = false;
    if (startMinutes <= endMinutes) {
      // Jadwal siang/normal (misal 10:00 - 16:30)
      isWithinLiveHours = currentMinutes >= startMinutes && currentMinutes < endMinutes;
    } else {
      // Jadwal lintas malam (misal 21:00 - 03:00)
      isWithinLiveHours = currentMinutes >= startMinutes || currentMinutes < endMinutes;
    }

    if (isWithinLiveHours) {
      return {
        status: 'LIVE',
        mode: 'auto',
        label: 'Live Stream',
        liveStartTime,
        liveEndTime,
        subtext: note || `Streamer sedang live sampai pukul ${liveEndTime} WIB.`
      };
    }

    return {
      status: 'OFFLINE',
      mode: 'auto',
      label: 'Off Stream',
      liveStartTime,
      liveEndTime,
      subtext: note 
        ? `Jadwal live berikutnya: ${note}`
        : `Sesi live hari ini telah selesai (jadwal: ${liveStartTime} - ${liveEndTime} WIB). Live lagi besok pukul ${liveStartTime} WIB.`
    };
  } catch (err) {
    console.error('Error computing WIB live status:', err);
    return {
      status: 'OFFLINE',
      mode: 'auto',
      label: 'Off Stream',
      liveStartTime,
      liveEndTime,
      subtext: note || 'Streamer sedang off stream.'
    };
  }
};
