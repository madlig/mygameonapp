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

// Format slot display label e.g. "SLOT 1 Basic", "SLOT VIP 1", "SLOT VVIP 1"
export const formatSlotLabel = (slot, service = '', servicesList = []) => {
  if (!slot) return 'SLOT 1 Basic';
  const sStr = String(slot).trim();
  const srvNorm = String(service || '').toUpperCase();

  // If already formatted like 'SLOT ...'
  if (sStr.toUpperCase().startsWith('SLOT ')) return sStr;

  const basicSrv = servicesList?.find(s => s.tier === 'Basic');
  const basicName = basicSrv?.name || 'Basic';

  if (sStr.toUpperCase().includes('VVIP') || srvNorm.includes('VVIP')) {
    const num = sStr.replace(/\D/g, '') || '1';
    return `SLOT VVIP ${num}`;
  }
  if (sStr.toUpperCase().includes('VIP') || srvNorm.includes('VIP')) {
    const num = sStr.replace(/\D/g, '') || '1';
    return `SLOT VIP ${num}`;
  }
  const num = sStr.replace(/\D/g, '') || '1';
  return `SLOT ${num} ${basicName}`;
};

// Match customer to a slot definition object
export const matchCustomerToSlot = (customer, slotDef) => {
  if (!customer || !customer.slot || !slotDef) return false;
  const sStr = String(customer.slot).trim().toLowerCase();
  const defKey = String(slotDef.key).trim().toLowerCase();
  const defLabel = String(slotDef.displayLabel || '').trim().toLowerCase();

  // Direct match key or label
  if (sStr === defKey || sStr === defLabel) return true;

  // Legacy mappings for VIP / VVIP without number
  if (defKey === 'vip 1' && (sStr === 'vip' || sStr === 'slot vip' || sStr === 'slot vip 1')) return true;
  if (defKey === 'vvip 1' && (sStr === 'vvip' || sStr === 'slot vvip' || sStr === 'slot vvip 1')) return true;

  // Numeric check for same tier
  const cNum = parseInt(sStr.replace(/\D/g, ''), 10);
  const defNum = parseInt(defKey.replace(/\D/g, ''), 10);
  const cTier = (customer.service || '').toUpperCase().includes('VVIP') 
    ? 'VVIP' 
    : (customer.service || '').toUpperCase().includes('VIP') 
    ? 'VIP' 
    : 'Basic';

  if (cTier === slotDef.tier && !isNaN(cNum) && !isNaN(defNum) && cNum === defNum) {
    return true;
  }

  // Fallback for basic slot: 1
  if (slotDef.tier === 'Basic' && (sStr === '1' || sStr === 'slot 1') && defKey === '1') return true;

  return false;
};

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
      return globalSettings.services.map(s => ({
        ...s,
        slotCount: s.slotCount !== undefined 
          ? Number(s.slotCount) 
          : (Array.isArray(s.slots) ? s.slots.length : (s.tier === 'Basic' ? 4 : s.tier === 'VIP' ? 2 : 1))
      }));
    }
    // Fallback based on legacy settings
    const pBasic = Number(globalSettings?.priceBasic) || PRICE_BASIC;
    const pVip = Number(globalSettings?.priceVip) || PRICE_VIP;
    const pVvip = Number(globalSettings?.priceVvip) || PRICE_VVIP;
    const enableVvip = globalSettings?.enableVvipSlot !== undefined
      ? Boolean(globalSettings.enableVvipSlot)
      : (activeWorkspaceId === 'saviours');

    return [
      { id: 'basic', name: 'Basic', tier: 'Basic', price: pBasic, slotCount: 4, enabled: true },
      { id: 'vip', name: 'VIP', tier: 'VIP', price: pVip, slotCount: 2, enabled: true },
      { id: 'vvip', name: 'VVIP', tier: 'VVIP', price: pVvip, slotCount: 1, enabled: enableVvip }
    ];
  }, [globalSettings, activeWorkspaceId]);

  // Generate all configured slot definitions
  const configuredSlots = React.useMemo(() => {
    const list = [];
    services.filter(s => s.enabled).forEach(s => {
      const count = Math.max(1, Number(s.slotCount) || 1);
      const isBasic = s.tier === 'Basic';
      const isVip = s.tier === 'VIP';
      const isVvip = s.tier === 'VVIP';
      const sName = s.name || s.tier;

      for (let i = 1; i <= count; i++) {
        let key = '';
        let displayLabel = '';
        if (isBasic) {
          key = `${i}`;
          displayLabel = `SLOT ${i} ${sName}`;
        } else if (isVip) {
          key = `VIP ${i}`;
          displayLabel = `SLOT VIP ${i}`;
        } else if (isVvip) {
          key = `VVIP ${i}`;
          displayLabel = `SLOT VVIP ${i}`;
        } else {
          key = `${s.id}-${i}`;
          displayLabel = `SLOT ${i} ${sName}`;
        }

        list.push({
          key,
          slotNum: i,
          tier: s.tier,
          serviceId: s.id,
          serviceName: sName,
          displayLabel,
          price: s.price
        });
      }
    });
    return list;
  }, [services]);

  // Helper to find service details
  const getServiceDetails = (serviceNameOrId = '') => {
    const norm = String(serviceNameOrId || '').toLowerCase();
    const found = services.find(s => 
      s.id.toLowerCase() === norm || s.name.toLowerCase() === norm || s.tier.toLowerCase() === norm
    );
    if (found) return found;
    return services[0] || { id: 'basic', name: 'Basic', tier: 'Basic', price: 4000, slotCount: 4, enabled: true };
  };

  // Helper to suggest smallest free slot for a given service
  const suggestSlot = (serviceNameOrId = '') => {
    const activeCustomers = customers.filter(c => !c.finished);
    const occupiedKeys = new Set();
    
    activeCustomers.forEach(c => {
      const matched = configuredSlots.find(s => matchCustomerToSlot(c, s));
      if (matched) {
        occupiedKeys.add(matched.key);
      }
    });

    const normQuery = String(serviceNameOrId || '').toLowerCase();
    const targetService = services.find(s => 
      s.enabled && (s.id.toLowerCase() === normQuery || s.name.toLowerCase() === normQuery || s.tier.toLowerCase() === normQuery)
    ) || services[0];

    // Find first empty slot belonging to this service
    const matchingSlots = configuredSlots.filter(s => s.tier === targetService.tier);
    const freeSlot = matchingSlots.find(s => !occupiedKeys.has(s.key));
    if (freeSlot) return freeSlot.key;

    // Fallback: any free slot in configuredSlots
    const anyFree = configuredSlots.find(s => !occupiedKeys.has(s.key));
    if (anyFree) return anyFree.key;

    return matchingSlots[0]?.key || '1';
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
    formatSlotLabel: (slot, service) => formatSlotLabel(slot, service, services),
    matchCustomerToSlot,
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
