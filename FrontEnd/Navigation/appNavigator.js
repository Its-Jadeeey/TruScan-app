// // TruScan/FrontEnd/Navigation/AppNavigator.js
// Bottom tab navigator (no drawer) — 4 tabs:
// Home, Reports, Education, Settings. Home swaps between ScanScreen and
// SimpleModeScreen, and the whole tab bar re-themes, based on Simple Mode.
import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import ScanScreen       from '../Screens/scanScreen';
import ReportScreen     from '../Screens/reportScreen';
import DashboardScreen  from '../Screens/dashboardScreen';
import SettingsScreen   from '../Screens/settingScreen';
import SimpleModeScreen from '../Screens/simpleModeScreen';
import { useApp }       from '../Context/AppContext';
import { getTheme }     from '../Service/theme';
// SVG-free icon using Unicode / text — swap for react-native-vector-icons later
function TabIcon({ name, focused, size = 22, COLORS }) {
  const icons = {
    Home:      '🏠',
    Reports:   '🚩',
    Education: '📖',
    Settings:  '⚙️',
  };
  return (
    <View style={[styles.pill, focused && { backgroundColor: COLORS.border2 || COLORS.border }]}>
      <Text style={{ fontSize: size, opacity: focused ? 1 : 0.6 }}>
        {icons[name] || '●'}
      </Text>
    </View>
  );
}
// Home tab renders ScanScreen normally, or SimpleModeScreen when Simple Mode is on.
function HomeRouter(props) {
  const { simpleMode } = useApp();
  return simpleMode ? <SimpleModeScreen {...props} /> : <ScanScreen {...props} />;
}
const Tab    = createBottomTabNavigator();

// Custom floating pill tab bar (Instagram style). Fully controlled layout so
// icons are centred and the area around the bar matches the screen background.
function FloatingTabBar({ state, descriptors, navigation, COLORS }) {
  const insets = useSafeAreaInsets();
  return (
    <View
      style={{
        backgroundColor: COLORS.background,
        paddingHorizontal: 16,
        paddingTop: 8,
        paddingBottom: Math.max(insets.bottom, 12),
      }}
    >
      <View style={[styles.bar, { backgroundColor: COLORS.surface, borderColor: COLORS.border }]}>
        {state.routes.map((route, index) => {
          const focused = state.index === index;
          const onPress = () => {
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!focused && !event.defaultPrevented) navigation.navigate(route.name, route.params);
          };
          return (
            <TouchableOpacity
              key={route.key}
              accessibilityRole="button"
              accessibilityLabel={route.name}
              accessibilityState={focused ? { selected: true } : {}}
              onPress={onPress}
              activeOpacity={0.7}
              style={styles.item}
            >
              <TabIcon name={route.name} focused={focused} COLORS={COLORS} />
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}
function MainTabs() {
  const { simpleMode, lightMode } = useApp();
  const COLORS = getTheme(simpleMode, lightMode);
  return (
    <Tab.Navigator
      tabBar={(props) => <FloatingTabBar {...props} COLORS={COLORS} />}
      screenOptions={{ headerShown: false }}
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
    <View style={{ flex: 1, backgroundColor: COLORS.background }}>
      <SafeAreaProvider style={{ backgroundColor: COLORS.background }}>
        <NavigationContainer theme={NavTheme}>
          <MainTabs />
        </NavigationContainer>
      </SafeAreaProvider>
    </View>
  );
}
const styles = StyleSheet.create({
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    height: 64,
    borderRadius: 36,
    borderWidth: 1,
    paddingHorizontal: 6,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
  },
  item: { flex: 1, height: 64, alignItems: 'center', justifyContent: 'center' },
  pill: {
    width: 64,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
