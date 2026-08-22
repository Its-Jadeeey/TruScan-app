// TruScan/FrontEnd/Context/AppContext.js
// Global state: Simple Mode, Light Mode, Language, Scan Alerts,
// Auto-scan Pasteboard — all persisted locally — plus current user session.

import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AppContext = createContext(null);

const KEYS = {
  simpleMode:  'truscan_simple_mode',
  lightMode:   'truscan_light_mode',
  language:    'truscan_language',
  scanAlerts:  'truscan_scan_alerts',
  autoScan:    'truscan_auto_scan_pasteboard',
};

export function AppProvider({ children }) {
  const [simpleMode, setSimpleMode]     = useState(false);
  const [lightMode, setLightMode]       = useState(false);
  const [language, setLanguageState]    = useState('en');       // 'en' | 'tl'
  const [scanAlerts, setScanAlertsState] = useState(true);
  const [autoScanPasteboard, setAutoScanState] = useState(false);
  const [user, setUser]     = useState(null); // will hold Firebase Auth user later
  const [loading, setLoading] = useState(true);

  // Load all persisted preferences on app start.
  useEffect(() => {
    (async () => {
      try {
        const entries = await AsyncStorage.multiGet(Object.values(KEYS));
        const map = Object.fromEntries(entries);
        if (map[KEYS.simpleMode] === 'true')  setSimpleMode(true);
        if (map[KEYS.lightMode] === 'true')   setLightMode(true);
        if (map[KEYS.language])               setLanguageState(map[KEYS.language]);
        if (map[KEYS.scanAlerts] === 'false') setScanAlertsState(false);
        if (map[KEYS.autoScan] === 'true')    setAutoScanState(true);
      } catch (e) {
        // Fall back to defaults silently if storage read fails.
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const toggleSimpleMode = async () => {
    const next = !simpleMode;
    setSimpleMode(next);
    await AsyncStorage.setItem(KEYS.simpleMode, String(next));
  };

  const toggleLightMode = async () => {
    const next = !lightMode;
    setLightMode(next);
    await AsyncStorage.setItem(KEYS.lightMode, String(next));
  };

  const setLanguage = async (code) => {
    setLanguageState(code);
    await AsyncStorage.setItem(KEYS.language, code);
  };

  const toggleScanAlerts = async () => {
    const next = !scanAlerts;
    setScanAlertsState(next);
    await AsyncStorage.setItem(KEYS.scanAlerts, String(next));
  };

  const toggleAutoScanPasteboard = async () => {
    const next = !autoScanPasteboard;
    setAutoScanState(next);
    await AsyncStorage.setItem(KEYS.autoScan, String(next));
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
    <AppContext.Provider value={{
      simpleMode, toggleSimpleMode,
      lightMode, toggleLightMode,
      language, setLanguage,
      scanAlerts, toggleScanAlerts,
      autoScanPasteboard, toggleAutoScanPasteboard,
      fontSize, user, setUser, loading,
    }}>
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