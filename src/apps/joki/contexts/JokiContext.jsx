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

export const JokiContext = createContext();

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

  // Helper to normalize services list from globalSettings or defaults
  const services = React.useMemo(() => {
    if (globalSettings?.services && Array.isArray(globalSettings.services) && globalSettings.services.length > 0) {
      return globalSettings.services;
    }
    // Fallback based on legacy settings
    const pBasic = Number(globalSettings?.priceBasic) || PRICE_BASIC;
    const pVip = Number(globalSettings?.priceVip) || PRICE_VIP;
    const pVvip = Number(globalSettings?.priceVvip) || PRICE_VVIP;
    const enableVvip = globalSettings?.enableVvipSlot !== undefined
      ? Boolean(globalSettings.enableVvipSlot)
      : (activeWorkspaceId === 'saviours');

    return [
      { id: 'basic', name: 'Basic', tier: 'Basic', price: pBasic, slots: [1, 2, 3, 4], enabled: true },
      { id: 'vip', name: 'VIP Priority', tier: 'VIP', price: pVip, slots: [5], enabled: true },
      { id: 'vvip', name: 'VVIP Super', tier: 'VVIP', price: pVvip, slots: [6], enabled: enableVvip }
    ];
  }, [globalSettings, activeWorkspaceId]);

  // Get all active configured slots across all enabled services
  const configuredSlots = React.useMemo(() => {
    const activeSlots = new Set();
    services.filter(s => s.enabled).forEach(s => {
      (s.slots || []).forEach(slotNum => {
        const parsed = parseInt(String(slotNum).replace(/\D/g, ''), 10);
        if (!isNaN(parsed) && parsed > 0) {
          activeSlots.add(parsed);
        }
      });
    });
    const sorted = Array.from(activeSlots).sort((a, b) => a - b);
    return sorted.length > 0 ? sorted : [1, 2, 3, 4, 5, 6];
  }, [services]);

  // Helper to find service details
  const getServiceDetails = (serviceNameOrId = '') => {
    const norm = String(serviceNameOrId || '').toLowerCase();
    const found = services.find(s => 
      s.id.toLowerCase() === norm || s.name.toLowerCase() === norm || s.tier.toLowerCase() === norm
    );
    if (found) return found;
    return services[0] || { id: 'basic', name: 'Basic', tier: 'Basic', price: 4000, slots: [1, 2, 3, 4], enabled: true };
  };

  // Helper to suggest smallest free slot for a given service
  const suggestSlot = (serviceNameOrId = '') => {
    const usedSlots = new Set();
    customers.forEach((c) => {
      if (!c.finished && c.slot) {
        const num = parseInt(String(c.slot).replace(/\D/g, ''), 10);
        if (!isNaN(num)) {
          usedSlots.add(num);
        }
      }
    });

    // If specific service is requested, find its designated slots first
    if (serviceNameOrId) {
      const normQuery = String(serviceNameOrId).toLowerCase();
      const matchedService = services.find(s => 
        s.enabled && (s.id.toLowerCase() === normQuery || s.name.toLowerCase() === normQuery || s.tier.toLowerCase() === normQuery)
      );

      if (matchedService && Array.isArray(matchedService.slots) && matchedService.slots.length > 0) {
        // Find first free slot in this service's designated slots
        const freeInService = matchedService.slots.find(s => !usedSlots.has(Number(s)));
        if (freeInService) return Number(freeInService);
        // If all designated slots are taken, pick the first one as fallback
        return Number(matchedService.slots[0]);
      }
    }

    // Default: find lowest available slot in configuredSlots or lowest natural number
    const freeConfigured = configuredSlots.find(s => !usedSlots.has(s));
    if (freeConfigured) return freeConfigured;

    let n = 1;
    while (usedSlots.has(n)) {
      n++;
    }
    return n;
  };

  // Check if VVIP is enabled for current workspace
  const enableVvipSlot = services.some(s => s.tier === 'VVIP' && s.enabled);
  const basicService = services.find(s => s.tier === 'Basic') || services[0];
  const vipService = services.find(s => s.tier === 'VIP') || services[1] || services[0];
  const vvipService = services.find(s => s.tier === 'VVIP') || services[2] || services[0];

  const priceBasic = basicService?.price || PRICE_BASIC;
  const priceVip = vipService?.price || PRICE_VIP;
  const priceVvip = vvipService?.price || PRICE_VVIP;

  // Start billing from queue
  const startBillingFromQueue = async (queueItem, selectedSlot) => {
    const now = Date.now();
    const duration = Number(queueItem.duration || 1);
    const durationSeconds = duration * 3600;
    const serviceDetails = getServiceDetails(queueItem.service);
    const finalService = serviceDetails.name || queueItem.service || 'Basic';
    const finalSlot = selectedSlot || suggestSlot(queueItem.service);
    const pricePerHour = Number(serviceDetails.price) || priceBasic;
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
      const rate = srv === 'VVIP' ? priceVvip : (srv === 'VIP' ? priceVip : priceBasic);

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

  // Archive and mark finished customer
  const finishAndArchiveCustomer = async (customerId, additionalData = {}) => {
    try {
      await fbUpdateCustomer(activeWorkspaceId, customerId, {
        finished: true,
        isPendingClearance: false,
        stopped: false,
        finishedTime: Date.now(),
        paused: false,
        pauseStarted: null,
        remainingAtPause: null,
        ...additionalData
      });
      addToast('Slot berhasil diselesaikan dan diarsipkan ke Riwayat.', 'success');
    } catch (err) {
      console.error('Error archiving finished customer:', err);
      addToast('Gagal menyelesaikan slot billing.', 'error');
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
    services,
    configuredSlots,
    getServiceDetails,
    enableVvipSlot,
    priceBasic,
    priceVip,
    priceVvip,
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
    finishAndArchiveCustomer,
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
