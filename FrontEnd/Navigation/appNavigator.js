// TruScan/FrontEnd/Navigation/AppNavigator.js
// Bottom tab navigator — 4 tabs: Scan, Reports, Learn, Settings

import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import ScanScreen      from '../Screens/scanScreen';
import ReportScreen    from '../Screens/reportScreen';
import DashboardScreen from '../Screens/dashboardScreen';
import SettingsScreen  from '../Screens/settingScreen';
import { useApp }      from '../Context/AppContext';
import { COLORS }      from '../Service/theme';

// SVG-free icon using Unicode / text — swap for react-native-vector-icons later
function TabIcon({ name, focused, size = 22 }) {
  const icons = {
    Scan:     focused ? '⬡' : '⬢',
    Reports:  focused ? '◈' : '◇',
    Learn:    focused ? '◉' : '○',
    Settings: focused ? '◆' : '◇',
  };
  return (
    <Text style={{ fontSize: size, color: focused ? COLORS.primary : COLORS.muted }}>
      {icons[name] || '●'}
    </Text>
  );
}

const Tab = createBottomTabNavigator();

export default function AppNavigator() {
  const { loading } = useApp();

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarActiveTintColor:   COLORS.primary,
          tabBarInactiveTintColor: COLORS.muted,
          tabBarStyle: styles.tabBar,
          tabBarLabelStyle: styles.tabLabel,
          tabBarIcon: ({ focused }) => (
            <TabIcon name={route.name} focused={focused} />
          ),
        })}
      >
        <Tab.Screen name="Scan"     component={ScanScreen} />
        <Tab.Screen name="Reports"  component={ReportScreen} />
        <Tab.Screen name="Learn"    component={DashboardScreen} />
        <Tab.Screen name="Settings" component={SettingsScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  tabBar: {
    backgroundColor: '#FFFFFF',
    borderTopColor: '#E2DDD4',
    borderTopWidth: 1,
    paddingTop: 6,
    paddingBottom: 10,
    height: 64,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '700',
    marginTop: 2,
    letterSpacing: 0.3,
  },
});