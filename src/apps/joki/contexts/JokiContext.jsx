import React, { createContext, useState, useEffect, useContext } from "react";
import { useSearchParams } from "react-router-dom";
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
  updateJokiSettings as fbUpdateSettings 
} from "../services/jokiFirebase";
import { useAuth } from "../../../contexts/AuthContext";

const PRICE_BASIC = 4000;
const PRICE_VIP = 6000;

const DEFAULT_WORKSPACES = [
  { id: 'mygameon', name: 'MyGameON AFK', slug: 'mygameon', ownerEmail: 'admin@mygameon.store' },
  { id: 'kadal', name: 'Kadal Gaming', slug: 'kadal', ownerEmail: 'kadal@gmail.com' },
];

const JokiContext = createContext();

export const useJoki = () => useContext(JokiContext);

export const JokiProvider = ({ children }) => {
  const { isAdmin, currentUser, logout } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  // Workspaces list
  const [workspaces, setWorkspaces] = useState(DEFAULT_WORKSPACES);

  // Determine initial workspace from URL param or default
  const channelParam = searchParams.get('c') || searchParams.get('channel') || searchParams.get('streamer');
  
  const [activeWorkspaceId, setActiveWorkspaceIdState] = useState(() => {
    if (channelParam && (channelParam === 'kadal' || channelParam === 'mygameon')) {
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
  const [filter, setFilter] = useState("ALL");
  const [toasts, setToasts] = useState([]);

  // Auto-switch workspace if admin logs in with matching email
  useEffect(() => {
    if (currentUser?.email) {
      const email = currentUser.email.toLowerCase();
      if (email.includes('kadal')) {
        changeWorkspace('kadal');
      } else if (email.includes('mygameon') || email.includes('admin')) {
        changeWorkspace('mygameon');
      }
    }
  }, [currentUser]);

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

  // Helper to suggest the smallest available numeric slot for Basic
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

  // Start billing directly from queue
  const startBillingFromQueue = async (queueItem, selectedSlot) => {
    const now = Date.now();
    const duration = Number(queueItem.duration || 1);
    const durationSeconds = duration * 3600;
    const isVIP = queueItem.service === 'VIP' || selectedSlot === 'VIP';
    const finalSlot = isVIP ? 'VIP' : (selectedSlot || suggestSlot());
    const pricePerHour = isVIP ? PRICE_VIP : PRICE_BASIC;
    const price = duration * pricePerHour;

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
    name: activeWorkspaceId === 'kadal' ? 'Kadal Gaming' : 'MyGameON AFK'
  };

  const value = {
    isAdmin,
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
    toasts,
    addToast,
    removeToast,
    suggestSlot,
    startBillingFromQueue,
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
