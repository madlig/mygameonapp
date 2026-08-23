import React, { createContext, useState, useEffect, useContext } from "react";
import { 
  subscribeJokiCustomers, 
  subscribeJokiSettings, 
  addJokiCustomer, 
  updateJokiCustomer, 
  deleteJokiCustomer, 
  updateJokiSettings 
} from "../services/jokiFirebase";

const JokiContext = createContext();

export const useJoki = () => useContext(JokiContext);

export const JokiProvider = ({ children }) => {
  const [customers, setCustomers] = useState([]);
  const [globalPaused, setGlobalPaused] = useState(false);
  const [globalPauseStarted, setGlobalPauseStarted] = useState(null);
  
  const [streamerMode, setStreamerMode] = useState(() => {
    return localStorage.getItem("jokiStreamerMode") === "true";
  });
  
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState("ALL");

  useEffect(() => {
    const unsubCustomers = subscribeJokiCustomers((data) => setCustomers(data));
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
    setStreamerMode(prev => {
      const val = !prev;
      localStorage.setItem("jokiStreamerMode", val);
      return val;
    });
  };

  const value = {
    customers,
    globalPaused,
    globalPauseStarted,
    streamerMode,
    toggleStreamerMode,
    searchQuery,
    setSearchQuery,
    filter,
    setFilter,
    addJokiCustomer,
    updateJokiCustomer,
    deleteJokiCustomer,
    updateJokiSettings
  };

  return (
    <JokiContext.Provider value={value}>
      {children}
    </JokiContext.Provider>
  );
};
