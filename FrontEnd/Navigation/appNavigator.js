// TruScan/FrontEnd/Navigation/AppNavigator.js
// Drawer (hamburger sidebar) wrapping the bottom tab navigator — 4 tabs:
// Home, Reports, Education, Settings. Home swaps between ScanScreen and
// SimpleModeScreen, and the whole tab bar re-themes, based on Simple Mode.

import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createDrawerNavigator } from '@react-navigation/drawer';

import ScanScreen       from '../Screens/scanScreen';
import ReportScreen     from '../Screens/reportScreen';
import DashboardScreen  from '../Screens/dashboardScreen';
import SettingsScreen   from '../Screens/settingScreen';
import SimpleModeScreen from '../Screens/simpleModeScreen';
import SidebarMenu      from './SidebarMenu';
import { useApp }       from '../Context/AppContext';
import { getTheme }     from '../Service/theme';

// SVG-free icon using Unicode / text — swap for react-native-vector-icons later
function TabIcon({ name, focused, size = 20 }) {
  const icons = {
    Home:      '🏠',
    Reports:   '🚩',
    Education: '📖',
    Settings:  '⚙️',
  };
  return (
    <Text style={{ fontSize: size, opacity: focused ? 1 : 0.55 }}>
      {icons[name] || '●'}
    </Text>
  );
}

// Home tab renders ScanScreen normally, or SimpleModeScreen when Simple Mode is on.
function HomeRouter(props) {
  const { simpleMode } = useApp();
  return simpleMode ? <SimpleModeScreen {...props} /> : <ScanScreen {...props} />;
}

const Tab    = createBottomTabNavigator();
const Drawer = createDrawerNavigator();

function MainTabs() {
  const { simpleMode, lightMode } = useApp();
  const COLORS = getTheme(simpleMode, lightMode);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor:   COLORS.primary,
        tabBarInactiveTintColor: COLORS.muted,
        tabBarStyle: {
          backgroundColor: COLORS.surface,
          borderTopColor: COLORS.border,
          borderTopWidth: 1,
          paddingTop: 6,
          paddingBottom: 10,
          height: 64,
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
        },
        tabBarLabelStyle: styles.tabLabel,
        tabBarIcon: ({ focused }) => (
          <TabIcon name={route.name} focused={focused} />
        ),
      })}
    >
      <Tab.Screen name="Home"      component={HomeRouter} />
      <Tab.Screen name="Reports"   component={ReportScreen} />
      <Tab.Screen name="Education" component={DashboardScreen} />
      <Tab.Screen name="Settings"  component={SettingsScreen} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { loading, simpleMode, lightMode } = useApp();
  const COLORS = getTheme(simpleMode, lightMode);

  if (loading) {
    return (
      <View style={[styles.loader, { backgroundColor: COLORS.background }]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  // Extend React Navigation's DarkTheme so screen transitions default to the
  // correct background (navy or purple) instead of flashing white.
  const NavTheme = {
    ...DarkTheme,
    colors: {
      ...DarkTheme.colors,
      background: COLORS.background,
      card:       COLORS.surface,
      text:       COLORS.ink,
      border:     COLORS.border,
      primary:    COLORS.primary,
    },
  };

  return (
    <NavigationContainer theme={NavTheme}>
      <Drawer.Navigator
        drawerContent={(props) => <SidebarMenu {...props} />}
        screenOptions={{
          headerShown: false,
          drawerStyle: { width: '78%', backgroundColor: COLORS.background },
          overlayColor: 'rgba(0,0,0,0.55)',
        }}
      >
        <Drawer.Screen name="MainTabs" component={MainTabs} />
      </Drawer.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '700',
    marginTop: 2,
    letterSpacing: 0.3,
  },
});