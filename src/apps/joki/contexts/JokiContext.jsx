import React, { createContext, useState, useEffect, useContext } from "react";
import { useSearchParams } from "react-router-dom";
import { 
  DEFAULT_WORKSPACE_ID,
  subscribeJokiWorkspaces,
  subscribeJokiCustomers, 
  subscribeJokiQueue,
  subscribeJokiSettings, 
  createWorkspaceIfNotExists,
  addJokiCustomer as fbAddCustomer, 
  updateJokiCustomer as fbUpdateCustomer, 
  deleteJokiCustomer as fbDeleteCustomer,
  addJokiQueue as fbAddQueue,
  updateJokiQueue as fbUpdateQueue,
  deleteJokiQueue as fbDeleteQueue,
  reorderJokiQueue,
  updateJokiSettings as fbUpdateSettings 
} from "../services/jokiFirebase";
import { useAuth } from "../../../contexts/AuthContext";

const PRICE_BASIC = 4000;
const PRICE_VIP = 6000;

const DEFAULT_WORKSPACES = [
  { id: 'mygameon', name: 'MyGameON AFK', slug: 'mygameon', ownerEmail: 'madlighifari29@gmail.com' },
  { id: 'kadal', name: 'Kadal Gaming', slug: 'kadal', ownerEmail: 'kadal@gmail.com' },
];

const JokiContext = createContext();

export const useJoki = () => useContext(JokiContext);

export const JokiProvider = ({ children }) => {
  const { isAdmin, currentUser, logout } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  // Workspaces list
  const [workspaces, setWorkspaces] = useState(DEFAULT_WORKSPACES);

  // Super Admin Check: madlighifari29@gmail.com
  const userEmail = (currentUser?.email || '').toLowerCase();
  const isSuperAdmin = isAdmin && (
    userEmail.includes('madli') || 
    userEmail === 'madlighifari29@gmail.com' ||
    userEmail === 'madlighifari@gmail.com' ||
    userEmail.includes('mygameon')
  );

  // Determine initial workspace from URL param or default
  const channelParam = searchParams.get('c') || searchParams.get('channel') || searchParams.get('streamer');
  
  const [activeWorkspaceId, setActiveWorkspaceIdState] = useState(() => {
    if (channelParam) {
      return channelParam;
    }
    return DEFAULT_WORKSPACE_ID;
  });

  const [customers, setCustomers] = useState([]);
  const [queue, setQueue] = useState([]);
  const [globalPaused, setGlobalPaused] = useState(false);
  const [globalPauseStarted, setGlobalPauseStarted] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Streamer Mode per device
  const [streamerMode, setStreamerMode] = useState(() => {
    return localStorage.getItem("jokiStreamerMode") === "true";
  });
  
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState("ALL"); // ALL, RUNNING, PAUSED
  const [toasts, setToasts] = useState([]);

  // Date Filter for Omset & History: 'ALL' | 'TODAY' | 'YESTERDAY' | 'WEEK' | 'MONTH' | 'CUSTOM'
  const [dateFilter, setDateFilter] = useState("ALL");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");

  // Helper to check if a timestamp matches the active date filter
  const isWithinDateFilter = (timestamp) => {
    if (!timestamp) return false;
    if (dateFilter === 'ALL') return true;

    const recordDate = new Date(timestamp);
    const now = new Date();

    // Helper: start and end of a date
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const endOfToday = startOfToday + 86400000 - 1;

    if (dateFilter === 'TODAY') {
      return timestamp >= startOfToday && timestamp <= endOfToday;
    }

    if (dateFilter === 'YESTERDAY') {
      const startOfYesterday = startOfToday - 86400000;
      const endOfYesterday = startOfToday - 1;
      return timestamp >= startOfYesterday && timestamp <= endOfYesterday;
    }

    if (dateFilter === 'WEEK') {
      const startOf7DaysAgo = startOfToday - (6 * 86400000);
      return timestamp >= startOf7DaysAgo && timestamp <= endOfToday;
    }

    if (dateFilter === 'MONTH') {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999).getTime();
      return timestamp >= startOfMonth && timestamp <= endOfMonth;
    }

    if (dateFilter === 'CUSTOM') {
      if (!customStartDate && !customEndDate) return true;
      const start = customStartDate ? new Date(customStartDate + "T00:00:00").getTime() : 0;
      const end = customEndDate ? new Date(customEndDate + "T23:59:59").getTime() : Infinity;
      return timestamp >= start && timestamp <= end;
    }

    return true;
  };

  // Auto-switch / create workspace based on logged in user's email
  useEffect(() => {
    if (currentUser?.email) {
      const email = currentUser.email.toLowerCase();
      
      // 1. If Super Admin -> lock to mygameon
      if (email.includes('madli') || email.includes('mygameon')) {
        changeWorkspace('mygameon');
        return;
      }

      // 2. Check if email matches ownerEmail of an existing workspace
      const matched = workspaces.find(w => w.ownerEmail && w.ownerEmail.toLowerCase() === email);
      if (matched) {
        changeWorkspace(matched.id);
        return;
      }

      // 3. For any other friend/admin email
      const slug = email.split('@')[0].replace(/[^a-z0-9]/gi, '').toLowerCase();
      const rawName = email.split('@')[0];
      const displayName = rawName.charAt(0).toUpperCase() + rawName.slice(1) + ' Gaming Live';

      createWorkspaceIfNotExists(slug, displayName, email);
      changeWorkspace(slug);
    }
  }, [currentUser, workspaces]);

  // Sync with URL param if changed externally
  useEffect(() => {
    if (channelParam && channelParam !== activeWorkspaceId) {
      setActiveWorkspaceIdState(channelParam);
    }
  }, [channelParam]);

  const changeWorkspace = (newId) => {
    setActiveWorkspaceIdState(newId);
    setSearchParams((prev) => {
      const p = new URLSearchParams(prev);
      p.set('c', newId);
      return p;
    }, { replace: true });
  };

  const addToast = (message, type = 'success') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      removeToast(id);
    }, 4000);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Subscribe to Workspaces list
  useEffect(() => {
    const unsub = subscribeJokiWorkspaces((data) => {
      if (data && data.length > 0) {
        setWorkspaces(data);
      }
    });
    return () => unsub();
  }, []);

  // Subscribe to active workspace subcollections
  useEffect(() => {
    setLoading(true);

    const unsubCustomers = subscribeJokiCustomers(activeWorkspaceId, (data) => {
      setCustomers(data);
      setLoading(false);
    });

    const unsubQueue = subscribeJokiQueue(activeWorkspaceId, (data) => {
      setQueue(data);
    });
    
    const unsubSettings = subscribeJokiSettings(activeWorkspaceId, (data) => {
      setGlobalPaused(data.globalPaused || false);
      setGlobalPauseStarted(data.globalPauseStarted || null);
    });
    
    return () => {
      unsubCustomers();
      unsubQueue();
      unsubSettings();
    };
  }, [activeWorkspaceId]);

  const toggleStreamerMode = () => {
    setStreamerMode((prev) => {
      const val = !prev;
      localStorage.setItem("jokiStreamerMode", val.toString());
      return val;
    });
    addToast(!streamerMode ? "Streamer mode aktif (Omset & data sensitif disensor)" : "Streamer mode dinonaktifkan", "info");
  };

  // Helper to suggest smallest free slot
  const suggestSlot = () => {
    const usedSlots = new Set();
    customers.forEach((c) => {
      if (!c.finished && c.slot && c.slot !== 'VIP') {
        const num = parseInt(c.slot, 10);
        if (!isNaN(num)) {
          usedSlots.add(num);
        }
      }
    });

    let n = 1;
    while (usedSlots.has(n)) {
      n++;
    }
    return n;
  };

  // Start billing from queue
  const startBillingFromQueue = async (queueItem, selectedSlot) => {
    const now = Date.now();
    const duration = Number(queueItem.duration || 1);
    const durationSeconds = duration * 3600;
    const isVIP = queueItem.service === 'VIP' || selectedSlot === 'VIP';
    const finalSlot = isVIP ? 'VIP' : (selectedSlot || suggestSlot());
    const pricePerHour = isVIP ? PRICE_VIP : PRICE_BASIC;
    const price = Math.round(duration * pricePerHour);

    const customerData = {
      username: queueItem.username,
      tiktokName: queueItem.tiktokName || '',
      name: queueItem.username,
      service: isVIP ? 'VIP' : 'Basic',
      slot: finalSlot,
      duration: duration,
      price: price,
      paymentStatus: 'Lunas',
      startTime: now,
      endTime: now + (durationSeconds * 1000),
      paused: false,
      pauseStarted: null,
      remainingAtPause: null,
      totalPausedSeconds: 0,
      finished: false,
      stopped: false,
      stopTime: null,
      finishedTime: null,
    };

    if (globalPaused) {
      customerData.paused = true;
      customerData.pauseStarted = now;
      customerData.remainingAtPause = durationSeconds;
    }

    await fbAddCustomer(activeWorkspaceId, customerData);
    await fbDeleteQueue(activeWorkspaceId, queueItem.id);
  };

  // Move active billing customer BACK to Queue (Free up slot & fix duplication)
  const moveCustomerToQueue = async (customer) => {
    try {
      const remainingSeconds = customer.paused 
        ? (customer.remainingAtPause || 0)
        : Math.max(0, Math.floor((customer.endTime - Date.now()) / 1000));
      
      const remainingHours = Number((remainingSeconds / 3600).toFixed(2));
      const finalDuration = remainingHours > 0 ? remainingHours : (customer.duration || 1);

      await fbAddQueue(activeWorkspaceId, {
        username: customer.username || customer.name,
        tiktokName: customer.tiktokName || '',
        service: customer.service || 'Basic',
        duration: finalDuration,
        price: Math.round(customer.price || (finalDuration * (customer.service === 'VIP' ? PRICE_VIP : PRICE_BASIC))),
        paymentStatus: 'Lunas',
        createdAt: Date.now()
      });

      await fbDeleteCustomer(activeWorkspaceId, customer.id);
      addToast(`Customer ${customer.username || customer.name} berhasil dikembalikan ke antrian! Slot telah dikosongkan.`, 'info');
    } catch (err) {
      console.error('Error moving customer to queue:', err);
      addToast('Gagal memindahkan customer ke antrian.', 'error');
    }
  };

  // Reorder queue (drag-and-drop)
  const reorderQueue = async (newQueueList) => {
    try {
      setQueue(newQueueList); // Optimistic UI update
      await reorderJokiQueue(activeWorkspaceId, newQueueList);
    } catch (err) {
      console.error('Error reordering queue:', err);
      addToast('Gagal menyimpan urutan antrian.', 'error');
    }
  };

  // Workspace-aware CRUD functions
  const addJokiCustomer = (data) => fbAddCustomer(activeWorkspaceId, data);
  const updateJokiCustomer = (id, data) => fbUpdateCustomer(activeWorkspaceId, id, data);
  const deleteJokiCustomer = (id) => fbDeleteCustomer(activeWorkspaceId, id);
  const addJokiQueue = (data) => fbAddQueue(activeWorkspaceId, data);
  const updateJokiQueue = (id, data) => fbUpdateQueue(activeWorkspaceId, id, data);
  const deleteJokiQueue = (id) => fbDeleteQueue(activeWorkspaceId, id);
  const updateJokiSettings = (data) => fbUpdateSettings(activeWorkspaceId, data);

  const activeWorkspace = workspaces.find(w => w.id === activeWorkspaceId) || {
    id: activeWorkspaceId,
    name: activeWorkspaceId === 'kadal' ? 'Kadal Gaming' : (activeWorkspaceId === 'mygameon' ? 'MyGameON AFK' : `${activeWorkspaceId.toUpperCase()} Live`)
  };

  const value = {
    isAdmin,
    isSuperAdmin,
    currentUser,
    logout,
    workspaces,
    activeWorkspaceId,
    activeWorkspace,
    changeWorkspace,
    customers,
    queue,
    loading,
    globalPaused,
    globalPauseStarted,
    streamerMode,
    toggleStreamerMode,
    searchQuery,
    setSearchQuery,
    filter,
    setFilter,
    dateFilter,
    setDateFilter,
    customStartDate,
    setCustomStartDate,
    customEndDate,
    setCustomEndDate,
    isWithinDateFilter,
    toasts,
    addToast,
    removeToast,
    suggestSlot,
    startBillingFromQueue,
    moveCustomerToQueue,
    reorderQueue,
    addJokiCustomer,
    updateJokiCustomer,
    deleteJokiCustomer,
    addJokiQueue,
    updateJokiQueue,
    deleteJokiQueue,
    updateJokiSettings,
  };

  return (
    <JokiContext.Provider value={value}>
      {children}
    </JokiContext.Provider>
  );
};
