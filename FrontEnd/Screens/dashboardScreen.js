// Education screen — LEARN / SCAM TYPES / TIPS segmented tabs, each a card list.
// Re-themes to light or dark based on Light Mode.
import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ScreenHeader from '../Components/ScreenHeader';
import Chevron from '../Components/Chevron';
import { useApp } from '../Context/AppContext';
import { getTheme, RADIUS, SPACING, SHADOW } from '../Service/theme';
import { useLang } from '../Service/i18n';
import { EDU } from '../Service/eduContent';
// ─── CONTENT ──────────────────────────────────────────────────────────────────
// Text lives in Service/eduContent.js (English + Tagalog).
const TAB_KEYS = ['learn', 'types', 'tips'];
// ─── CARD ─────────────────────────────────────────────────────────────────────
function EduCard({ item, expanded, onToggle, fontSize, styles, COLORS }) {
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
        {expanded && item.body && (
          <View style={styles.bodyList}>
            {item.body.map((line, i) => (
              <View key={i} style={styles.bodyRow}>
                <Text style={[styles.bodyBullet, { fontSize: fontSize.xs }]}>•</Text>
                <Text style={[styles.bodyText, { fontSize: fontSize.xs }]}>{line}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
      <View style={styles.chevWrap}><Chevron direction={expanded ? 'down' : 'right'} color={COLORS.muted} /></View>
    </TouchableOpacity>
  );
}
// ─── MAIN SCREEN ──────────────────────────────────────────────────────────────
export default function DashboardScreen({ navigation, route }) {
  const { fontSize, simpleMode, lightMode } = useApp();
  const { t: tr, lang } = useLang();
  const COLORS = getTheme(simpleMode, lightMode);
  const styles = makeStyles(COLORS);
  const [activeTab, setActiveTab] = useState('learn');
  const [expanded, setExpanded]   = useState(null);
  // Opened from a scan result: jump to the requested tab
  useEffect(() => {
    const tab = route?.params?.tab;
    if (tab && ['learn', 'types', 'tips'].includes(tab)) {
      setActiveTab(tab);
      setExpanded(null);
    }
  }, [route?.params?.nonce]);
  const changeTab = (key) => {
    setActiveTab(key);
    setExpanded(null);
  };
  const items = EDU[lang][activeTab];
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <ScreenHeader title={tr('edu.header')} navigation={navigation} COLORS={COLORS} fontSize={fontSize} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Segmented tabs */}
        <View style={styles.tabRow}>
          {TAB_KEYS.map(k => {
            const active = activeTab === k;
            return (
              <TouchableOpacity
                key={k}
                style={[styles.tabBtn, active && styles.tabBtnActive]}
                onPress={() => changeTab(k)}
                activeOpacity={0.8}
              >
                <Text style={[
                  styles.tabLabel,
                  { fontSize: fontSize.xs, color: active ? '#FFFFFF' : COLORS.muted },
                ]}>
                  {tr('edu.' + k).toUpperCase()}
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
            COLORS={COLORS}
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
    flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.sm,
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
  chevWrap:  { alignSelf: 'center' },
  bodyList: { marginTop: SPACING.sm, gap: 6 },
  bodyRow:  { flexDirection: 'row', gap: 6, alignItems: 'flex-start' },
  bodyBullet: { color: COLORS.primary, lineHeight: 18 },
  bodyText:   { color: COLORS.muted, lineHeight: 18, flex: 1 },
});