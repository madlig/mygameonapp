import React, { createContext, useState, useEffect, useContext } from "react";
import { 
  subscribeJokiCustomers, 
  subscribeJokiSettings, 
  addJokiCustomer, 
  updateJokiCustomer, 
  deleteJokiCustomer, 
  updateJokiSettings 
} from "../services/jokiFirebase";
import { useAuth } from "../../../contexts/AuthContext";

const JokiContext = createContext();

export const useJoki = () => useContext(JokiContext);

export const JokiProvider = ({ children }) => {
  const { isAdmin, currentUser, logout } = useAuth();
  const [customers, setCustomers] = useState([]);
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
    
    const unsubSettings = subscribeJokiSettings((data) => {
      setGlobalPaused(data.globalPaused || false);
      setGlobalPauseStarted(data.globalPauseStarted || null);
    });
    
    return () => {
      unsubCustomers();
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

  const value = {
    isAdmin,
    currentUser,
    logout,
    customers,
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
    addJokiCustomer,
    updateJokiCustomer,
    deleteJokiCustomer,
    updateJokiSettings,
  };

  return (
    <JokiContext.Provider value={value}>
      {children}
    </JokiContext.Provider>
  );
};
