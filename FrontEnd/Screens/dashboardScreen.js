// TruScan/FrontEnd/Screens/dashboardScreen.js
// Learn screen — Filipino scam education + real-time stats from Firestore

import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp }          from '../Context/AppContext';
import { getReportStats }  from '../Service/firestoreService';
import { COLORS, RADIUS, SPACING, SHADOW } from '../Service/theme';

// ─── DATA ─────────────────────────────────────────────────────────────────────

const SCAM_TYPES = [
  {
    emoji: '💸',
    title: 'GCash / E-Wallet Scam',
    sub: 'Pinaka-karaniwan sa 2024',
    body: 'Nagpapanggap na GCash, Maya, o BDO agent na may premyo o kailangan mong i-verify ang account. Hihingin ang MPIN o OTP mo.',
    warning: 'Hindi KAILANMAN hihilingin ng GCash ang iyong MPIN.',
    tags: [
      { label: 'WINNER', type: 'danger' },
      { label: 'NANALO', type: 'danger' },
      { label: 'I-CLAIM NA', type: 'danger' },
      { label: 'MPIN', type: 'warn' },
      { label: 'OTP', type: 'warn' },
      { label: '24 HOURS', type: 'warn' },
    ],
    color: COLORS.scamBg,
  },
  {
    emoji: '🏛️',
    title: "Gov't Agency Spoofing",
    sub: 'SSS, PhilHealth, PAGCOR',
    body: 'Fake na mensahe mula sa SSS, PhilHealth, o PAGCOR na naka-suspend daw ang benepisyo mo. Nagdi-direct sa fake government website.',
    warning: 'Ang gov\'t agencies ay hindi nagpapadala ng links para sa pag-verify.',
    tags: [
      { label: 'ACCOUNT SUSPENDED', type: 'danger' },
      { label: 'BENEFITS HOLD', type: 'danger' },
      { label: 'VERIFY NOW', type: 'warn' },
      { label: 'SSS NOTICE', type: 'warn' },
    ],
    color: COLORS.infoBg,
  },
  {
    emoji: '📦',
    title: 'Parcel / Delivery Scam',
    sub: 'LBC, J&T, Shopee Express',
    body: 'Nagpapanggap na LBC o J&T — naka-hold ang package, bayaran daw ang customs fee sa isang link.',
    warning: 'Hindi hihilingin ng courier ang bayad sa SMS link.',
    tags: [
      { label: 'PACKAGE ON HOLD', type: 'danger' },
      { label: 'CUSTOMS FEE', type: 'danger' },
      { label: 'DELIVERY FAILED', type: 'warn' },
      { label: 'LBC', type: 'info' },
    ],
    color: COLORS.suspBg,
  },
  {
    emoji: '❤️',
    title: 'Romantic / Friendship Scam',
    sub: 'Lumalagong trend sa PH',
    body: 'Nagtatayo ng pekeng online relationship tapos hihingi ng pera para sa emergency. Karaniwan sa Facebook at dating apps.',
    warning: 'Huwag magpadala ng pera sa taong hindi mo personal na kilala.',
    tags: [
      { label: 'PADALA PERA', type: 'danger' },
      { label: 'EMERGENCY', type: 'danger' },
      { label: 'OFW', type: 'warn' },
      { label: 'REMITTANCE', type: 'warn' },
    ],
    color: '#FEF0FB',
  },
];

const TIPS = [
  { num: '1', text: 'Huwag mag-click ng links sa SMS — pumunta sa official website.' },
  { num: '2', text: 'Huwag ibahagi ang OTP kahino man, kahit "GCash agent."' },
  { num: '3', text: 'I-verify sa official hotline: GCash 2882, SSS 1455.' },
  { num: '4', text: 'Ang "24 hours lang" na pressure ay taktika ng scammer — mag-pause muna.' },
  { num: '5', text: 'I-report sa NBI Cybercrime Division o sa iyong telco provider.' },
];

// ─── SUBCOMPONENTS ────────────────────────────────────────────────────────────

function StatCard({ value, label, color, fontSize }) {
  return (
    <View style={[styles.statCard, SHADOW.card]}>
      <Text style={[styles.statValue, { color, fontSize: fontSize.xl }]}>{value}</Text>
      <Text style={[styles.statLabel, { fontSize: fontSize.xs }]}>{label}</Text>
    </View>
  );
}

function ScamCard({ item, expanded, onToggle, fontSize }) {
  const tagColors = {
    danger: { bg: COLORS.scamBg, text: COLORS.scam },
    warn:   { bg: COLORS.suspBg, text: COLORS.suspicious },
    info:   { bg: COLORS.infoBg, text: COLORS.info },
  };

  return (
    <View style={[styles.learnCard, SHADOW.card]}>
      <TouchableOpacity style={styles.learnCardHeader} onPress={onToggle} activeOpacity={0.8}>
        <View style={[styles.learnEmoji, { backgroundColor: item.color }]}>
          <Text style={{ fontSize: 18 }}>{item.emoji}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.learnTitle, { fontSize: fontSize.base }]}>{item.title}</Text>
          <Text style={[styles.learnSub, { fontSize: fontSize.xs }]}>{item.sub}</Text>
        </View>
        <Text style={[styles.chevron, { fontSize: fontSize.sm }]}>
          {expanded ? '▲' : '▼'}
        </Text>
      </TouchableOpacity>

      {expanded && (
        <View style={styles.learnBody}>
          <Text style={[styles.learnBodyText, { fontSize: fontSize.sm }]}>{item.body}</Text>
          <View style={[styles.warningBox, { backgroundColor: COLORS.scamBg, borderColor: COLORS.scamBorder }]}>
            <Text style={[styles.warningText, { color: COLORS.scam, fontSize: fontSize.sm }]}>
              ⚠ {item.warning}
            </Text>
          </View>
          <View style={styles.tagsRow}>
            {item.tags.map((t, i) => (
              <View key={i} style={[styles.tag, { backgroundColor: tagColors[t.type].bg }]}>
                <Text style={[styles.tagText, { color: tagColors[t.type].text, fontSize: fontSize.xs }]}>
                  {t.label}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

// ─── MAIN SCREEN ──────────────────────────────────────────────────────────────

export default function DashboardScreen() {
  const { fontSize } = useApp();
  const [stats, setStats]       = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    getReportStats().then(s => {
      setStats(s);
      setLoadingStats(false);
    });
  }, []);

  const toggleExpand = (idx) => setExpanded(expanded === idx ? null : idx);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Text style={[styles.screenTitle, { fontSize: fontSize.lg }]}>Learn & Protect</Text>
        <Text style={[styles.screenSub, { fontSize: fontSize.sm }]}>
          Alamin ang mga palatandaan ng scam sa Pilipinas
        </Text>

        {/* Info Banner */}
        <View style={[styles.infoBanner, { backgroundColor: COLORS.infoBg, borderColor: COLORS.infoBorder }]}>
          <Text style={[styles.infoTitle, { color: COLORS.info, fontSize: fontSize.xs }]}>ALERTO KA BA?</Text>
          <Text style={[styles.infoText, { color: COLORS.info, fontSize: fontSize.sm }]}>
            Gumagamit ang mga scammer sa PH ng Taglish — halo ng Tagalog at English — para mapaniwala ka. Ang TruScan ay tumutulong sa iyo na makilala ang mga ito.
          </Text>
        </View>

        {/* Live Stats */}
        <Text style={[styles.sectionTitle, { fontSize: fontSize.xs }]}>COMMUNITY STATS</Text>
        {loadingStats
          ? <ActivityIndicator color={COLORS.primary} style={{ marginVertical: SPACING.md }} />
          : (
            <View style={styles.statsRow}>
              <StatCard value={stats?.total ?? 0}     label="Total Reports" color={COLORS.primary} fontSize={fontSize} />
              <StatCard value={stats?.scam ?? 0}      label="Scam Reports"  color={COLORS.scam}    fontSize={fontSize} />
              <StatCard value={stats?.verified ?? 0}  label="Verified"      color={COLORS.info}    fontSize={fontSize} />
            </View>
          )
        }

        {/* Scam Types */}
        <Text style={[styles.sectionTitle, { fontSize: fontSize.xs, marginTop: SPACING.lg }]}>
          COMMON SCAM TYPES
        </Text>
        {SCAM_TYPES.map((item, i) => (
          <ScamCard
            key={i}
            item={item}
            expanded={expanded === i}
            onToggle={() => toggleExpand(i)}
            fontSize={fontSize}
          />
        ))}

        {/* Tips */}
        <Text style={[styles.sectionTitle, { fontSize: fontSize.xs, marginTop: SPACING.lg }]}>
          5 TIPS PARA MAIWASAN ANG SCAM
        </Text>
        <View style={[styles.tipsCard, SHADOW.card]}>
          {TIPS.map((tip, i) => (
            <View key={i} style={[styles.tipRow, i < TIPS.length - 1 && styles.tipBorder]}>
              <View style={styles.tipNum}>
                <Text style={[styles.tipNumText, { fontSize: fontSize.xs }]}>{tip.num}</Text>
              </View>
              <Text style={[styles.tipText, { fontSize: fontSize.sm }]}>{tip.text}</Text>
            </View>
          ))}
        </View>

        {/* Emergency Contacts */}
        <Text style={[styles.sectionTitle, { fontSize: fontSize.xs, marginTop: SPACING.lg }]}>
          EMERGENCY CONTACTS
        </Text>
        <View style={[styles.tipsCard, SHADOW.card]}>
          {[
            { label: 'GCash Hotline',       number: '2882' },
            { label: 'SSS Hotline',         number: '1455' },
            { label: 'NBI Cybercrime',      number: '8523-8231' },
            { label: 'PNP Anti-Cybercrime', number: '(02) 8-723-0401' },
          ].map((c, i, arr) => (
            <View key={i} style={[styles.tipRow, i < arr.length - 1 && styles.tipBorder]}>
              <Text style={[styles.tipText, { flex: 1, fontSize: fontSize.sm }]}>{c.label}</Text>
              <Text style={[styles.contactNum, { fontSize: fontSize.sm }]}>{c.number}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── STYLES ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SPACING.lg, paddingBottom: 80 },

  screenTitle: { fontWeight: '800', color: COLORS.ink },
  screenSub:   { color: COLORS.muted, marginTop: 3, marginBottom: SPACING.md },

  infoBanner: {
    borderRadius: RADIUS.md, borderWidth: 1.5,
    padding: SPACING.md, marginBottom: SPACING.lg,
  },
  infoTitle: { fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 4 },
  infoText:  { lineHeight: 20 },

  sectionTitle: {
    fontWeight: '700', color: COLORS.muted, letterSpacing: 0.5,
    textTransform: 'uppercase', marginBottom: SPACING.sm,
  },
  statsRow:  { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.sm },
  statCard:  {
    flex: 1, backgroundColor: COLORS.surface, borderRadius: RADIUS.md,
    borderWidth: 1.5, borderColor: COLORS.border, padding: SPACING.sm + 2, alignItems: 'center',
  },
  statValue: { fontWeight: '800' },
  statLabel: { color: COLORS.muted, fontWeight: '600', marginTop: 2, textAlign: 'center' },

  learnCard:       {
    backgroundColor: COLORS.surface, borderRadius: RADIUS.lg,
    borderWidth: 1.5, borderColor: COLORS.border, marginBottom: SPACING.sm, overflow: 'hidden',
  },
  learnCardHeader: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, padding: SPACING.md },
  learnEmoji:      { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  learnTitle:      { fontWeight: '800', color: COLORS.ink },
  learnSub:        { color: COLORS.muted, marginTop: 2 },
  chevron:         { color: COLORS.muted },

  learnBody:     { padding: SPACING.md, paddingTop: 0, borderTopWidth: 1, borderTopColor: COLORS.border },
  learnBodyText: { color: COLORS.muted, lineHeight: 20, marginBottom: SPACING.sm },
  warningBox:    { borderRadius: RADIUS.sm, borderWidth: 1, padding: SPACING.sm, marginBottom: SPACING.sm },
  warningText:   { fontWeight: '600', lineHeight: 19 },
  tagsRow:       { flexDirection: 'row', flexWrap: 'wrap', gap: 5 },
  tag:           { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 5 },
  tagText:       { fontWeight: '700' },

  tipsCard:   {
    backgroundColor: COLORS.surface, borderRadius: RADIUS.lg,
    borderWidth: 1.5, borderColor: COLORS.border, overflow: 'hidden',
  },
  tipRow:     { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, padding: SPACING.md },
  tipBorder:  { borderBottomWidth: 1, borderBottomColor: COLORS.border },
  tipNum:     {
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center',
  },
  tipNumText: { color: '#FFF', fontWeight: '800' },
  tipText:    { color: COLORS.ink, lineHeight: 20, flex: 1 },
  contactNum: { color: COLORS.primary, fontWeight: '700' },
});