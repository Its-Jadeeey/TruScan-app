// TruScan/FrontEnd/Context/AppContext.js
// Global state: Simple Mode toggle + current user session

import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [simpleMode, setSimpleMode] = useState(false);
  const [user, setUser] = useState(null); // will hold Firebase Auth user later
  const [loading, setLoading] = useState(true);

  // Load persisted Simple Mode preference on app start
  useEffect(() => {
    AsyncStorage.getItem('truscan_simple_mode').then(val => {
      if (val === 'true') setSimpleMode(true);
      setLoading(false);
    });
  }, []);

  const toggleSimpleMode = async () => {
    const next = !simpleMode;
    setSimpleMode(next);
    await AsyncStorage.setItem('truscan_simple_mode', String(next));
  };

  // Font size scale — used across all screens
  const fontSize = {
    xs:   simpleMode ? 13 : 11,
    sm:   simpleMode ? 15 : 12,
    base: simpleMode ? 18 : 14,
    md:   simpleMode ? 20 : 16,
    lg:   simpleMode ? 24 : 19,
    xl:   simpleMode ? 28 : 22,
    xxl:  simpleMode ? 34 : 28,
  };

  return (
    <AppContext.Provider value={{ simpleMode, toggleSimpleMode, fontSize, user, setUser, loading }}>
      {children}
    </AppContext.Provider>
  );
}

// Custom hook — use this in every screen
export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}