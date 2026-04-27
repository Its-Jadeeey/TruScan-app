// TruScan/FrontEnd/Screens/settingScreen.js
// Settings screen — Simple Mode toggle, app info, Firebase config status

import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  Switch, StyleSheet, Alert, Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp }       from '../Context/AppContext';
import { checkBackendHealth } from '../Service/analyzeService';
import { COLORS, RADIUS, SPACING, SHADOW } from '../Service/theme';

// ─── SETTING ROW ──────────────────────────────────────────────────────────────

function SettingRow({ icon, label, sub, right, onPress, fontSize, showBorder = true }) {
  return (
    <TouchableOpacity
      style={[styles.settingRow, showBorder && styles.settingBorder]}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
      disabled={!onPress}
    >
      <View style={styles.settingIcon}>
        <Text style={{ fontSize: 18 }}>{icon}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.settingLabel, { fontSize: fontSize.base }]}>{label}</Text>
        {sub && <Text style={[styles.settingSub, { fontSize: fontSize.xs }]}>{sub}</Text>}
      </View>
      {right}
    </TouchableOpacity>
  );
}

function SectionHeader({ title, fontSize }) {
  return (
    <Text style={[styles.sectionHeader, { fontSize: fontSize.xs }]}>{title}</Text>
  );
}

// ─── STATUS BADGE ─────────────────────────────────────────────────────────────

function StatusBadge({ status, fontSize }) {
  const config = {
    online:    { bg: COLORS.safeBg,  text: COLORS.safe,       label: 'Online' },
    offline:   { bg: COLORS.scamBg,  text: COLORS.scam,       label: 'Offline' },
    checking:  { bg: COLORS.infoBg,  text: COLORS.info,       label: 'Checking...' },
  }[status] || { bg: COLORS.border, text: COLORS.muted, label: 'Unknown' };

  return (
    <View style={[styles.statusBadge, { backgroundColor: config.bg }]}>
      <Text style={[styles.statusText, { color: config.text, fontSize: fontSize.xs }]}>
        {config.label}
      </Text>
    </View>
  );
}

// ─── MAIN SCREEN ──────────────────────────────────────────────────────────────

export default function SettingsScreen() {
  const { simpleMode, toggleSimpleMode, fontSize } = useApp();
  const [backendStatus, setBackendStatus] = useState('checking');

  useEffect(() => {
    checkBackendHealth().then(ok => setBackendStatus(ok ? 'online' : 'offline'));
  }, []);

  const recheckBackend = () => {
    setBackendStatus('checking');
    checkBackendHealth().then(ok => setBackendStatus(ok ? 'online' : 'offline'));
  };

  const handleAbout = () => {
    Alert.alert(
      'About TruScan',
      'TruScan v1.0.0\n\nA Mobile Application Intrusion Detection System for Scam and Phishing in the Filipino Context.\n\nDeveloped as a thesis project. Uses ML + keyword analysis to detect Taglish scam patterns.',
      [{ text: 'OK' }]
    );
  };

  const handlePrivacy = () => {
    Alert.alert(
      'Privacy Policy',
      'TruScan does not collect personally identifiable information.\n\nAll scam reports are anonymized before being saved to the community database.\n\nPhone numbers and emails in reported messages are automatically removed.',
      [{ text: 'OK' }]
    );
  };

  const handleReport = () => {
    Linking.openURL('mailto:truscan@email.com?subject=Bug Report').catch(() =>
      Alert.alert('Error', 'Hindi mabukas ang email app.')
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <Text style={[styles.screenTitle, { fontSize: fontSize.lg }]}>Settings</Text>

        {/* ── ACCESSIBILITY ── */}
        <SectionHeader title="ACCESSIBILITY" fontSize={fontSize} />
        <View style={[styles.settingCard, SHADOW.card]}>
          <SettingRow
            icon="👁️"
            label="Simple Mode"
            sub={simpleMode
              ? 'Malaking teksto at simplified na layout'
              : 'Para sa mas madaling paggamit — para sa matatanda'}
            fontSize={fontSize}
            showBorder={false}
            right={
              <Switch
                value={simpleMode}
                onValueChange={toggleSimpleMode}
                trackColor={{ false: COLORS.border2, true: COLORS.primary }}
                thumbColor="#FFFFFF"
                ios_backgroundColor={COLORS.border2}
              />
            }
          />
        </View>

        {/* ── SYSTEM STATUS ── */}
        <SectionHeader title="SYSTEM STATUS" fontSize={fontSize} />
        <View style={[styles.settingCard, SHADOW.card]}>
          <SettingRow
            icon="🤖"
            label="ML Backend"
            sub="FastAPI + Scikit-learn on Render"
            fontSize={fontSize}
            onPress={recheckBackend}
            right={<StatusBadge status={backendStatus} fontSize={fontSize} />}
          />
          <SettingRow
            icon="🔥"
            label="Firestore"
            sub="reported_scams collection"
            fontSize={fontSize}
            showBorder={false}
            right={
              <View style={[styles.statusBadge, { backgroundColor: COLORS.safeBg }]}>
                <Text style={[styles.statusText, { color: COLORS.safe, fontSize: fontSize.xs }]}>
                  Connected
                </Text>
              </View>
            }
          />
        </View>

        {/* ── ANALYSIS ── */}
        <SectionHeader title="ANALYSIS ENGINE" fontSize={fontSize} />
        <View style={[styles.settingCard, SHADOW.card]}>
          <SettingRow
            icon="📡"
            label="API Mode"
            sub="Tries ML backend first, falls back to keyword engine"
            fontSize={fontSize}
            showBorder={false}
            right={
              <Text style={[styles.settingValue, { fontSize: fontSize.xs }]}>Auto</Text>
            }
          />
        </View>

        {/* ── DATA & PRIVACY ── */}
        <SectionHeader title="DATA & PRIVACY" fontSize={fontSize} />
        <View style={[styles.settingCard, SHADOW.card]}>
          <SettingRow
            icon="🔒"
            label="Privacy Policy"
            sub="Paano namin ginagamit ang iyong data"
            fontSize={fontSize}
            onPress={handlePrivacy}
            right={<Text style={styles.chevron}>›</Text>}
          />
          <SettingRow
            icon="🗑️"
            label="Clear Scan History"
            sub="Burahin ang local na scan history"
            fontSize={fontSize}
            showBorder={false}
            onPress={() => Alert.alert(
              'Clear History',
              'Sigurado ka bang burahin ang scan history?',
              [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Clear', style: 'destructive', onPress: () => Alert.alert('Done', 'Scan history cleared.') },
              ]
            )}
            right={<Text style={[styles.chevron, { color: COLORS.scam }]}>›</Text>}
          />
        </View>

        {/* ── ABOUT ── */}
        <SectionHeader title="ABOUT" fontSize={fontSize} />
        <View style={[styles.settingCard, SHADOW.card]}>
          <SettingRow
            icon="ℹ️"
            label="About TruScan"
            sub="Version 1.0.0 — Thesis Project"
            fontSize={fontSize}
            onPress={handleAbout}
            right={<Text style={styles.chevron}>›</Text>}
          />
          <SettingRow
            icon="🐛"
            label="Report a Bug"
            sub="Mag-email ng feedback sa development team"
            fontSize={fontSize}
            onPress={handleReport}
            right={<Text style={styles.chevron}>›</Text>}
          />
          <SettingRow
            icon="📚"
            label="Data Sources"
            sub="PhishTank • Community Reports • Taglish Corpus"
            fontSize={fontSize}
            showBorder={false}
            right={null}
          />
        </View>

        {/* ── TECH STACK ── */}
        <SectionHeader title="TECH STACK" fontSize={fontSize} />
        <View style={[styles.techCard, SHADOW.card]}>
          {[
            { label: 'Frontend',   value: 'React Native (iOS & Android)' },
            { label: 'Backend',    value: 'FastAPI (Python) on Render' },
            { label: 'ML Engine',  value: 'Scikit-learn SVM + TF-IDF' },
            { label: 'Database',   value: 'Firebase Firestore' },
            { label: 'Training',   value: 'Google Colab + PhishTank' },
            { label: 'Admin',      value: 'React.js Web Panel' },
          ].map((row, i, arr) => (
            <View key={i} style={[styles.techRow, i < arr.length - 1 && styles.techBorder]}>
              <Text style={[styles.techLabel, { fontSize: fontSize.xs }]}>{row.label}</Text>
              <Text style={[styles.techValue, { fontSize: fontSize.xs }]}>{row.value}</Text>
            </View>
          ))}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={[styles.footerText, { fontSize: fontSize.xs }]}>
            TruScan — Filipino Scam Detector
          </Text>
          <Text style={[styles.footerSub, { fontSize: fontSize.xs }]}>
            Ginawa para sa kapakanan ng mga Pilipino 🇵🇭
          </Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

// ─── STYLES ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SPACING.lg, paddingBottom: 80 },

  screenTitle: { fontWeight: '800', color: COLORS.ink, marginBottom: SPACING.md },

  sectionHeader: {
    fontWeight: '700', color: COLORS.muted, letterSpacing: 0.5,
    textTransform: 'uppercase', marginBottom: SPACING.sm, marginTop: SPACING.md,
  },

  settingCard: {
    backgroundColor: COLORS.surface, borderRadius: RADIUS.lg,
    borderWidth: 1.5, borderColor: COLORS.border, overflow: 'hidden',
  },
  settingRow: {
    flexDirection: 'row', alignItems: 'center',
    gap: SPACING.sm, padding: SPACING.md,
  },
  settingBorder:  { borderBottomWidth: 1, borderBottomColor: COLORS.border },
  settingIcon:    {
    width: 36, height: 36, borderRadius: 9,
    backgroundColor: COLORS.background, alignItems: 'center', justifyContent: 'center',
  },
  settingLabel:  { fontWeight: '600', color: COLORS.ink },
  settingSub:    { color: COLORS.muted, marginTop: 2 },
  settingValue:  { color: COLORS.muted, fontWeight: '700' },
  chevron:       { fontSize: 22, color: COLORS.muted, fontWeight: '600' },

  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: RADIUS.pill },
  statusText:  { fontWeight: '700' },

  techCard: {
    backgroundColor: COLORS.surface, borderRadius: RADIUS.lg,
    borderWidth: 1.5, borderColor: COLORS.border, overflow: 'hidden',
  },
  techRow:    { flexDirection: 'row', justifyContent: 'space-between', padding: SPACING.md },
  techBorder: { borderBottomWidth: 1, borderBottomColor: COLORS.border },
  techLabel:  { fontWeight: '700', color: COLORS.muted, flex: 1 },
  techValue:  { color: COLORS.ink, fontWeight: '500', flex: 2, textAlign: 'right' },

  footer:     { alignItems: 'center', marginTop: SPACING.xl, paddingBottom: SPACING.md },
  footerText: { color: COLORS.muted, fontWeight: '700' },
  footerSub:  { color: COLORS.hint, marginTop: 4 },
});