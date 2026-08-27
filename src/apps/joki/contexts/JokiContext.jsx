import React, { createContext, useContext, useState, useEffect } from "react";
import { 
  DEFAULT_WORKSPACE_ID,
  subscribeJokiWorkspaces,
  subscribeJokiCustomers,
  subscribeJokiQueue,
  subscribeJokiSettings,
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

const JokiContext = createContext();

const PRICE_BASIC = 4000;
const PRICE_VIP = 6000;
const PRICE_VVIP = 10000;

export const JokiProvider = ({ children }) => {
  const { currentUser, logout } = useAuth();
  
  // Workspaces list & Active Workspace ID
  const [workspaces, setWorkspaces] = useState([]);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState(() => {
    return localStorage.getItem("jokiActiveWorkspace") || DEFAULT_WORKSPACE_ID;
  });

  // State per active workspace
  const [customers, setCustomers] = useState([]);
  const [queue, setQueue] = useState([]);
  const [globalPaused, setGlobalPaused] = useState(false);
  const [globalPauseStarted, setGlobalPauseStarted] = useState(null);
  const [globalSettings, setGlobalSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  // UI States
  const [streamerMode, setStreamerMode] = useState(() => {
    return localStorage.getItem("jokiStreamerMode") === "true";
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState("ALL"); // ALL, RUNNING, PAUSED
  const [sortBy, setSortBy] = useState("SHORTEST_TIME"); // SHORTEST_TIME, SLOT, NAME
  
  // Date Filtering State for Finished/History Tab
  const [dateFilter, setDateFilter] = useState("ALL"); // ALL, TODAY, YESTERDAY, WEEK, MONTH, CUSTOM
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");

  const [toasts, setToasts] = useState([]);

  // Toast Notification System (Auto dismiss in 4 seconds)
  const addToast = (message, type = "info", duration = 4000) => {
    const id = Date.now().toString() + Math.random().toString().slice(2, 6);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      removeToast(id);
    }, duration);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Helper date filtering function
  const isWithinDateFilter = (timestamp) => {
    if (!timestamp) return false;
    if (dateFilter === 'ALL') return true;

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const endOfToday = startOfToday + 86399999;

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

  // Auto-switch workspace based on logged in user's email
  useEffect(() => {
    if (currentUser?.email && workspaces.length > 0) {
      const email = currentUser.email.toLowerCase();
      
      // 1. If Super Admin -> lock to mygameon
      if (email.includes('madli') || email.includes('mygameon')) {
        changeWorkspace('mygameon');
        return;
      }

      // 2. Check if email matches ownerEmail of an existing registered workspace
      const matched = workspaces.find(w => w.ownerEmail && w.ownerEmail.toLowerCase() === email);
      if (matched) {
        changeWorkspace(matched.id);
        return;
      }
    }
  }, [currentUser, workspaces]);

  // Check Permissions
  const isSuperAdmin = currentUser?.email && (
    currentUser.email.toLowerCase().includes('madli') || 
    currentUser.email.toLowerCase().includes('mygameon')
  );

  const isAdmin = isSuperAdmin || (
    currentUser?.email && (
      currentUser.email.toLowerCase().includes('riyan') ||
      currentUser.email.toLowerCase().includes('udin') ||
      currentUser.email.toLowerCase().includes('admin') ||
      workspaces.some(w => w.ownerEmail && w.ownerEmail.toLowerCase() === currentUser.email.toLowerCase())
    )
  );

  // Switch Active Workspace
  const changeWorkspace = (workspaceId) => {
    if (!workspaceId) return;
    setActiveWorkspaceId(workspaceId);
    localStorage.setItem("jokiActiveWorkspace", workspaceId);
  };

  // Subscribe to all workspaces
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
      setGlobalSettings(data);
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
      if (val) {
        fbUpdateSettings(activeWorkspaceId, { streamStatus: "LIVE", manualOverride: false });
      }
      return val;
    });
    addToast(!streamerMode ? "Streamer mode aktif (Omset & data sensitif disensor)" : "Streamer mode dinonaktifkan", "info");
  };

  // Helper to suggest smallest free slot
  const suggestSlot = () => {
    const usedSlots = new Set();
    customers.forEach((c) => {
      if (!c.finished && c.slot && c.slot !== 'VIP' && c.slot !== 'VVIP') {
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
    const isVVIP = (queueItem.service || '').toUpperCase() === 'VVIP' || selectedSlot === 'VVIP';
    const isVIP = (queueItem.service || '').toUpperCase() === 'VIP' || selectedSlot === 'VIP';
    const finalService = isVVIP ? 'VVIP' : (isVIP ? 'VIP' : 'Basic');
    const finalSlot = isVVIP ? 'VVIP' : (isVIP ? 'VIP' : (selectedSlot || suggestSlot()));
    const pricePerHour = isVVIP ? PRICE_VVIP : (isVIP ? PRICE_VIP : PRICE_BASIC);
    const price = Math.round(duration * pricePerHour);

    const customerData = {
      ticketId: queueItem.ticketId || `JK-${queueItem.id.slice(-5)}`,
      username: queueItem.username,
      tiktokName: queueItem.tiktokName || '',
      passwordRoblox: queueItem.passwordRoblox || '',
      emailRoblox: queueItem.emailRoblox || '',
      name: queueItem.username,
      service: finalService,
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
      const srv = (customer.service || 'Basic').toUpperCase();
      const rate = srv === 'VVIP' ? PRICE_VVIP : (srv === 'VIP' ? PRICE_VIP : PRICE_BASIC);

      await fbAddQueue(activeWorkspaceId, {
        ticketId: customer.ticketId || `JK-${customer.id.slice(-5)}`,
        username: customer.username || customer.name,
        tiktokName: customer.tiktokName || '',
        passwordRoblox: customer.passwordRoblox || '',
        emailRoblox: customer.emailRoblox || '',
        service: customer.service || 'Basic',
        duration: finalDuration,
        price: Math.round(customer.price || (finalDuration * rate)),
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
    globalSettings,
    streamerMode,
    toggleStreamerMode,
    searchQuery,
    setSearchQuery,
    filter,
    setFilter,
    sortBy,
    setSortBy,
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

export const useJoki = () => {
  const context = useContext(JokiContext);
  if (!context) {
    throw new Error("useJoki must be used within a JokiProvider");
  }
  return context;
};
