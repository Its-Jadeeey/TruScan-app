// TruScan/FrontEnd/app.js
// Root entry point — wraps the app in Context and Navigation

import React from 'react';
import { StatusBar } from 'react-native';
import { AppProvider } from './Context/AppContext';
import AppNavigator from './Navigation/AppNavigator';
import 'react-native-gesture-handler';

export default function App() {
  return (
    <AppProvider>
      <StatusBar barStyle="dark-content" backgroundColor="#F5F2EB" />
      <AppNavigator />
    </AppProvider>
  );
}