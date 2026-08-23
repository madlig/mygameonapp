import React, { createContext, useState, useEffect, useContext } from "react";
import { 
  subscribeJokiCustomers, 
  subscribeJokiQueue,
  subscribeJokiSettings, 
  addJokiCustomer, 
  updateJokiCustomer, 
  deleteJokiCustomer,
  addJokiQueue,
  updateJokiQueue,
  deleteJokiQueue,
  updateJokiSettings 
} from "../services/jokiFirebase";
import { useAuth } from "../../../contexts/AuthContext";

const PRICE_BASIC = 4000;
const PRICE_VIP = 6000;

const JokiContext = createContext();

export const useJoki = () => useContext(JokiContext);

export const JokiProvider = ({ children }) => {
  const { isAdmin, currentUser, logout } = useAuth();
  const [customers, setCustomers] = useState([]);
  const [queue, setQueue] = useState([]);
  const [globalPaused, setGlobalPaused] = useState(false);
  const [globalPauseStarted, setGlobalPauseStarted] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Streamer Mode is stored in localStorage per device
  const [streamerMode, setStreamerMode] = useState(() => {
    return localStorage.getItem("jokiStreamerMode") === "true";
  });
  
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState("ALL");
  const [toasts, setToasts] = useState([]);

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

  useEffect(() => {
    const unsubCustomers = subscribeJokiCustomers((data) => {
      setCustomers(data);
      setLoading(false);
    });

    const unsubQueue = subscribeJokiQueue((data) => {
      setQueue(data);
    });
    
    const unsubSettings = subscribeJokiSettings((data) => {
      setGlobalPaused(data.globalPaused || false);
      setGlobalPauseStarted(data.globalPauseStarted || null);
    });
    
    return () => {
      unsubCustomers();
      unsubQueue();
      unsubSettings();
    };
  }, []);

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
    const isVIP = queueItem.service === 'VIP';
    const finalSlot = isVIP ? 'VIP' : (selectedSlot || suggestSlot());
    const pricePerHour = isVIP ? PRICE_VIP : PRICE_BASIC;
    const price = duration * pricePerHour;

    const customerData = {
      username: queueItem.username,
      tiktokName: queueItem.tiktokName || '',
      name: queueItem.username,
      service: queueItem.service || 'Basic',
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

    await addJokiCustomer(customerData);
    await deleteJokiQueue(queueItem.id);
  };

  const value = {
    isAdmin,
    currentUser,
    logout,
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
