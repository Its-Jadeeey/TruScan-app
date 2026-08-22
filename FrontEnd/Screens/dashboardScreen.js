// TruScan/FrontEnd/Screens/dashboardScreen.js
// Education screen — LEARN / SCAM TYPES / TIPS segmented tabs, each a card list.
// Re-themes to light or dark based on Light Mode.

import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '../Context/AppContext';
import { getTheme, RADIUS, SPACING, SHADOW } from '../Service/theme';

// ─── CONTENT ──────────────────────────────────────────────────────────────────

const TABS = [
  { key: 'learn',  label: 'Learn' },
  { key: 'types',  label: 'Scam Types' },
  { key: 'tips',   label: 'Tips' },
];

const LEARN_ITEMS = [
  { icon: '🎣', title: 'What is Phishing?', sub: 'Learn how phishing scams steal your personal information.' },
  { icon: '🎭', title: 'Common Scam Techniques', sub: 'Learn the most common tricks used by scammers.' },
  { icon: '🛡️', title: 'Protect Yourself', sub: 'Simple steps to keep you and your loved ones safe online.' },
  { icon: '💬', title: 'What is Smishing?', sub: 'Learn how scammers use fake SMS messages to steal your data and money.' },
  { icon: '🎯', title: 'How Scammers Target You', sub: 'Discover the tactics scammers use to find and manipulate their victims.' },
];

const SCAM_TYPE_ITEMS = [
  { icon: '💳', title: 'Financial & eWallet Scams', sub: 'Fake payment requests from GCash, Maya, and bank accounts.' },
  { icon: '📦', title: 'Delivery Courier Scams', sub: 'Fake parcel notifications used to steal your personal and payment details.' },
  { icon: '💼', title: 'Job Task Scams', sub: 'Too-good-to-be-true online jobs designed to scam job seekers.' },
  { icon: '💲', title: 'Investment Scams', sub: 'Promises of high returns used to trick you into fake investment schemes.' },
  { icon: '💌', title: 'Romance Scams', sub: 'Fake online relationships used to emotionally manipulate and steal from victims.' },
];

const TIP_ITEMS = [
  { icon: '🔒', title: 'Never Share Your OTP', sub: 'Your OTP is yours alone. No bank, government, or delivery company will ever ask for it.' },
  { icon: '⚠️', title: "Don't Click Unknown Links", sub: 'Avoid tapping links from unknown numbers or emails — verify first before clicking.' },
  { icon: '✅', title: 'Double Check Before You Pay', sub: "Always verify the receiver's details before sending money via GCash, Maya, or bank transfer." },
  { icon: '📞', title: 'Hang Up on Suspicious Callers', sub: 'If a caller pressures you for personal info or money, hang up and call the official number.' },
  { icon: '🔄', title: 'Keep Your Apps Updated', sub: 'Always update your banking and eWallet apps to stay protected from the latest threats.' },
];

const CONTENT = { learn: LEARN_ITEMS, types: SCAM_TYPE_ITEMS, tips: TIP_ITEMS };

// ─── CARD ─────────────────────────────────────────────────────────────────────

function EduCard({ item, expanded, onToggle, fontSize, styles }) {
  return (
    <TouchableOpacity style={styles.card} onPress={onToggle} activeOpacity={0.8}>
      <View style={styles.cardIconWrap}>
        <Text style={styles.cardIcon}>{item.icon}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.cardTitle, { fontSize: fontSize.base }]}>{item.title}</Text>
        <Text
          style={[styles.cardSub, { fontSize: fontSize.xs }]}
          numberOfLines={expanded ? undefined : 2}
        >
          {item.sub}
        </Text>
      </View>
      <Text style={styles.chevron}>{expanded ? '⌄' : '›'}</Text>
    </TouchableOpacity>
  );
}

// ─── MAIN SCREEN ──────────────────────────────────────────────────────────────

export default function DashboardScreen({ navigation }) {
  const { fontSize, simpleMode, lightMode } = useApp();
  const COLORS = getTheme(simpleMode, lightMode);
  const styles = makeStyles(COLORS);

  const [activeTab, setActiveTab] = useState('learn');
  const [expanded, setExpanded]   = useState(null);

  const changeTab = (key) => {
    setActiveTab(key);
    setExpanded(null);
  };

  const items = CONTENT[activeTab];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        {navigation?.canGoBack?.() && (
          <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.7} hitSlop={10}>
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>
        )}
        <Text style={[styles.headerTitle, { fontSize: fontSize.sm }]}>EDUCATION</Text>
        <View style={{ width: 20 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Segmented tabs */}
        <View style={styles.tabRow}>
          {TABS.map(t => {
            const active = activeTab === t.key;
            return (
              <TouchableOpacity
                key={t.key}
                style={[styles.tabBtn, active && styles.tabBtnActive]}
                onPress={() => changeTab(t.key)}
                activeOpacity={0.8}
              >
                <Text style={[
                  styles.tabLabel,
                  { fontSize: fontSize.xs, color: active ? '#FFFFFF' : COLORS.muted },
                ]}>
                  {t.label.toUpperCase()}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Card list */}
        {items.map((item, i) => (
          <EduCard
            key={`${activeTab}-${i}`}
            item={item}
            expanded={expanded === i}
            onToggle={() => setExpanded(expanded === i ? null : i)}
            fontSize={fontSize}
            styles={styles}
          />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── STYLES ───────────────────────────────────────────────────────────────────

const makeStyles = (COLORS) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  backArrow:   { color: COLORS.ink, fontSize: 20, fontWeight: '700' },
  headerTitle: { color: COLORS.ink, fontWeight: '800', letterSpacing: 1 },

  content: { padding: SPACING.lg, paddingBottom: SPACING.xxl },

  tabRow: {
    flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.lg,
  },
  tabBtn: {
    flex: 1, paddingVertical: 9, borderRadius: RADIUS.pill,
    borderWidth: 1.5, borderColor: COLORS.border, backgroundColor: COLORS.surface,
    alignItems: 'center',
  },
  tabBtnActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  tabLabel:     { fontWeight: '700', letterSpacing: 0.3 },

  card: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
    backgroundColor: COLORS.surface, borderRadius: RADIUS.lg,
    borderWidth: 1.5, borderColor: COLORS.border,
    padding: SPACING.md, marginBottom: SPACING.sm, ...SHADOW.card,
  },
  cardIconWrap: {
    width: 42, height: 42, borderRadius: 12, backgroundColor: COLORS.infoBg,
    borderWidth: 1.5, borderColor: COLORS.infoBorder,
    alignItems: 'center', justifyContent: 'center',
  },
  cardIcon:  { fontSize: 19 },
  cardTitle: { color: COLORS.ink, fontWeight: '700', marginBottom: 3 },
  cardSub:   { color: COLORS.muted, lineHeight: 16 },
  chevron:   { color: COLORS.muted, fontSize: 18, fontWeight: '600', marginLeft: 4 },
});