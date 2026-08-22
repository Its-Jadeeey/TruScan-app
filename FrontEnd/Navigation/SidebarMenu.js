// TruScan/FrontEnd/Navigation/SidebarMenu.js
// Custom drawer content — TRUSCAN header, nav list w/ active highlight,
// and a bottom card that toggles Simple Mode on/off. Re-themes to the
// purple palette whenever Simple Mode is active.

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { DrawerContentScrollView } from '@react-navigation/drawer';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '../Context/AppContext';
import { getTheme, RADIUS, SPACING } from '../Service/theme';

const NAV_ITEMS = [
  { key: 'Home',      label: 'Home',      icon: '🏠' },
  { key: 'Reports',   label: 'Reports',   icon: '🚩' },
  { key: 'Education', label: 'Education', icon: '📖' },
  { key: 'Settings',  label: 'Settings',  icon: '⚙️' },
];

// Walks the nested navigator state to find which tab is actually active,
// since the Drawer only sees a single "MainTabs" screen.
function getActiveTabName(navigationState) {
  if (!navigationState) return 'Home';
  const route = navigationState.routes[navigationState.index];
  if (route.state) return getActiveTabName(route.state);
  return route.name;
}

export default function SidebarMenu(props) {
  const { navigation, state } = props;
  const { simpleMode, toggleSimpleMode, lightMode } = useApp();
  const COLORS = getTheme(simpleMode, lightMode);
  const styles = makeStyles(COLORS, simpleMode);
  const activeTab = getActiveTabName(state);

  const goTo = (tabName) => {
    navigation.navigate('MainTabs', { screen: tabName });
    navigation.closeDrawer?.();
  };

  const handleModeToggle = () => {
    toggleSimpleMode();
    navigation.navigate('MainTabs', { screen: 'Home' });
    navigation.closeDrawer?.();
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <DrawerContentScrollView
        {...props}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Logo header */}
        <View style={styles.header}>
          <View style={styles.logoBadge}>
            <Text style={styles.logoIcon}>🛡️</Text>
          </View>
          <View>
            <Text style={styles.logoText}>TRUSCAN</Text>
            <Text style={styles.logoTagline}>Stay alert. Stay safety.</Text>
          </View>
        </View>

        {/* Nav items */}
        <View style={styles.navList}>
          {NAV_ITEMS.map(item => {
            const active = activeTab === item.key;
            return (
              <TouchableOpacity
                key={item.key}
                style={[styles.navRow, active && styles.navRowActive]}
                onPress={() => goTo(item.key)}
                activeOpacity={0.8}
              >
                <Text style={styles.navIcon}>{item.icon}</Text>
                <Text style={[styles.navLabel, active && styles.navLabelActive]}>
                  {item.label.toUpperCase()}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </DrawerContentScrollView>

      {/* Mode toggle card — "Simple Mode" in normal mode, "Normal Mode" when Simple Mode is on */}
      <TouchableOpacity style={styles.modeCard} onPress={handleModeToggle} activeOpacity={0.85}>
        <View style={styles.modeIconWrap}>
          <Text style={styles.modeIcon}>🛡️</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.modeTitle}>{simpleMode ? 'NORMAL MODE' : 'SIMPLE MODE'}</Text>
          <Text style={styles.modeSub}>
            {simpleMode ? 'Advance view for everyone...' : 'Easy view for everyone...'}
          </Text>
        </View>
        <Text style={styles.chevron}>›</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const makeStyles = (COLORS, simpleMode) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  scrollContent: { paddingHorizontal: SPACING.lg, paddingTop: SPACING.md },

  header: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
    paddingBottom: SPACING.lg, marginBottom: SPACING.md,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  logoBadge: {
    width: 46, height: 46, borderRadius: 14,
    backgroundColor: simpleMode ? COLORS.navCard : COLORS.infoBg,
    borderWidth: 1.5, borderColor: simpleMode ? COLORS.border2 : COLORS.infoBorder,
    alignItems: 'center', justifyContent: 'center',
  },
  logoIcon:     { fontSize: 22 },
  logoText:     { color: COLORS.ink, fontWeight: '800', fontSize: 17, letterSpacing: 1 },
  logoTagline:  { color: COLORS.muted, fontSize: 11, marginTop: 2 },

  navList: { gap: 4 },
  navRow: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
    paddingVertical: 12, paddingHorizontal: SPACING.sm,
    borderRadius: RADIUS.md,
  },
  navRowActive: { backgroundColor: COLORS.primary },
  navIcon:      { fontSize: 16, width: 22, textAlign: 'center' },
  navLabel:     { color: COLORS.muted, fontWeight: '700', fontSize: 12, letterSpacing: 0.5 },
  navLabelActive: { color: '#FFFFFF' },

  modeCard: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
    marginHorizontal: SPACING.lg, marginBottom: SPACING.lg,
    padding: SPACING.sm + 2, borderRadius: RADIUS.md,
    borderWidth: 1.5,
    borderColor: simpleMode ? COLORS.border2 : COLORS.infoBorder,
    backgroundColor: simpleMode ? COLORS.navCard : COLORS.infoBg,
  },
  modeIconWrap: {
    width: 34, height: 34, borderRadius: 10,
    backgroundColor: COLORS.surface, alignItems: 'center', justifyContent: 'center',
  },
  modeIcon:  { fontSize: 16 },
  modeTitle: { color: COLORS.primary, fontWeight: '800', fontSize: 12, letterSpacing: 0.5 },
  modeSub:   { color: COLORS.muted, fontSize: 10, marginTop: 2 },
  chevron:   { color: COLORS.primary, fontSize: 20, fontWeight: '700' },
});