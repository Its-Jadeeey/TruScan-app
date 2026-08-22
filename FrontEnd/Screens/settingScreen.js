// TruScan/FrontEnd/Screens/settingScreen.js
// Settings screen — every row is functional:
//  - Light Mode / Language / Scan Alerts / Auto-scan Pasteboard: persisted toggles/choices
//  - Help Center: FAQ accordion modal
//  - Privacy Policy / Terms of Service / About: scrollable info modals

import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  Switch, StyleSheet, Modal, FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '../Context/AppContext';
import { getTheme, RADIUS, SPACING, SHADOW } from '../Service/theme';

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'tl', label: 'Tagalog' },
];

const FAQS = [
  {
    q: 'How does TruScan detect scams?',
    a: 'TruScan combines a machine learning model with keyword pattern matching to analyze messages for common Filipino scam indicators — urgency phrases, OTP requests, suspicious short links, and more.',
  },
  {
    q: 'Is my scanned message stored or shared?',
    a: 'No. A message you scan is only sent to the analysis engine to get a result. It is never saved anywhere unless you choose to submit it as a report to the community database.',
  },
  {
    q: 'What should I do if I get a SCAM result?',
    a: "Don't click any links, don't share personal or financial information, and consider blocking the sender. You can also report it from the Reports tab to help protect others.",
  },
  {
    q: 'Can TruScan scan images or screenshots?',
    a: 'Not yet — TruScan currently analyzes pasted text only (SMS content, email content, or a link). Screenshot scanning may be added in a future update.',
  },
  {
    q: 'Why did a safe-looking message get flagged?',
    a: 'The detection engine errs on the side of caution, so borderline messages may be marked suspicious even if they turn out to be fine. If you believe a result is wrong, you can report it for review.',
  },
];

const PRIVACY_TEXT = `TruScan does not collect personally identifiable information.

All scam reports submitted to the community database are anonymized before saving — phone numbers, emails, and account numbers found in reported messages are automatically stripped out.

Message text you scan (but don't report) is sent only to the analysis engine to produce a result and is not stored.

We do not sell or share any data with third parties. Community report data is used solely to improve scam detection accuracy and to warn other users about active scam patterns.`;

const TERMS_TEXT = `By using TruScan, you agree to use the app responsibly and to submit reports in good faith to help protect the community.

TruScan provides scam-likelihood analysis as a helpful guide, not a guarantee. Always use your own judgment before acting on a message, and verify anything financial through official channels.

Submitting false or malicious reports, or attempting to disrupt the service, may result in restricted access.

TruScan is provided "as is" without warranty of any kind. The developers are not liable for losses resulting from scams that were not detected, or from decisions made based on app results.`;

const ABOUT_TEXT = `TruScan v1.1.0

A Mobile Application Intrusion Detection System for Scam and Phishing in the Filipino Context.

Developed as a thesis project. Uses a machine learning model combined with keyword analysis to detect Taglish scam patterns across SMS, email, and links.

Tech stack: React Native, FastAPI + Scikit-learn, Firebase Firestore.`;

// ─── GENERIC INFO MODAL (Privacy / Terms / About) ────────────────────────────

function InfoModal({ visible, onClose, title, text, COLORS, fontSize }) {
  const styles = makeModalStyles(COLORS);
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.modalSafe}>
        <View style={styles.modalHeader}>
          <Text style={[styles.modalTitle, { fontSize: fontSize.md }]}>{title}</Text>
          <TouchableOpacity onPress={onClose} hitSlop={10}>
            <Text style={[styles.modalClose, { fontSize: fontSize.base }]}>Close</Text>
          </TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={styles.modalBody}>
          <Text style={[styles.modalText, { fontSize: fontSize.sm }]}>{text}</Text>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

// ─── HELP CENTER / FAQ MODAL ──────────────────────────────────────────────────

function FaqModal({ visible, onClose, COLORS, fontSize }) {
  const styles = makeModalStyles(COLORS);
  const [openIndex, setOpenIndex] = useState(null);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.modalSafe}>
        <View style={styles.modalHeader}>
          <Text style={[styles.modalTitle, { fontSize: fontSize.md }]}>Help Center</Text>
          <TouchableOpacity onPress={onClose} hitSlop={10}>
            <Text style={[styles.modalClose, { fontSize: fontSize.base }]}>Close</Text>
          </TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={styles.modalBody}>
          <Text style={[styles.faqIntro, { fontSize: fontSize.xs }]}>FREQUENTLY ASKED QUESTIONS</Text>
          {FAQS.map((item, i) => {
            const open = openIndex === i;
            return (
              <TouchableOpacity
                key={i}
                style={styles.faqCard}
                onPress={() => setOpenIndex(open ? null : i)}
                activeOpacity={0.8}
              >
                <View style={styles.faqQRow}>
                  <Text style={[styles.faqQ, { fontSize: fontSize.sm }]}>{item.q}</Text>
                  <Text style={styles.faqChevron}>{open ? '⌄' : '›'}</Text>
                </View>
                {open && <Text style={[styles.faqA, { fontSize: fontSize.sm }]}>{item.a}</Text>}
              </TouchableOpacity>
            );
          })}
          <Text style={[styles.faqFooter, { fontSize: fontSize.xs }]}>
            Still need help? Email truscan@email.com and we'll get back to you.
          </Text>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

// ─── LANGUAGE PICKER MODAL ─────────────────────────────────────────────────────

function LanguageModal({ visible, onClose, value, onSelect, COLORS, fontSize }) {
  const styles = makeModalStyles(COLORS);
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={styles.sheetOverlay} activeOpacity={1} onPress={onClose}>
        <View style={styles.sheet}>
          <Text style={[styles.sheetTitle, { fontSize: fontSize.sm }]}>LANGUAGE</Text>
          <FlatList
            data={LANGUAGES}
            keyExtractor={l => l.code}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.sheetOption, value === item.code && styles.sheetOptionActive]}
                onPress={() => { onSelect(item.code); onClose(); }}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.sheetOptionText,
                  { fontSize: fontSize.sm, color: value === item.code ? COLORS.primary : COLORS.ink },
                ]}>
                  {item.label}
                </Text>
                {value === item.code && <Text style={{ color: COLORS.primary }}>✓</Text>}
              </TouchableOpacity>
            )}
          />
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

// ─── ROW ──────────────────────────────────────────────────────────────────────

function SettingRow({ icon, label, sub, right, onPress, fontSize, showBorder, styles }) {
  return (
    <TouchableOpacity
      style={[styles.row, showBorder && styles.rowBorder]}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
      disabled={!onPress}
    >
      <Text style={styles.rowIcon}>{icon}</Text>
      <View style={{ flex: 1 }}>
        <Text style={[styles.rowLabel, { fontSize: fontSize.base }]}>{label}</Text>
        {sub ? <Text style={[styles.rowSub, { fontSize: fontSize.xs }]}>{sub}</Text> : null}
      </View>
      {right}
    </TouchableOpacity>
  );
}

// ─── MAIN SCREEN ──────────────────────────────────────────────────────────────

export default function SettingsScreen({ navigation }) {
  const {
    fontSize, simpleMode,
    lightMode, toggleLightMode,
    language, setLanguage,
    scanAlerts, toggleScanAlerts,
    autoScanPasteboard, toggleAutoScanPasteboard,
  } = useApp();

  const COLORS = getTheme(simpleMode, lightMode);
  const styles = makeStyles(COLORS);

  const [showLanguage, setShowLanguage] = useState(false);
  const [showHelp, setShowHelp]         = useState(false);
  const [showPrivacy, setShowPrivacy]   = useState(false);
  const [showTerms, setShowTerms]       = useState(false);
  const [showAbout, setShowAbout]       = useState(false);

  const currentLangLabel = LANGUAGES.find(l => l.code === language)?.label || 'English';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        {navigation?.canGoBack?.() && (
          <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.7} hitSlop={10}>
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>
        )}
        <Text style={[styles.headerTitle, { fontSize: fontSize.sm }]}>SETTINGS</Text>
        <View style={{ width: 20 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* ── APP PREFERENCES ── */}
        <Text style={[styles.sectionHeader, { fontSize: fontSize.xs }]}>APP PREFERENCES</Text>
        <View style={styles.card}>
          <SettingRow
            icon="🌓" label="Light Mode" fontSize={fontSize} showBorder styles={styles}
            right={
              <Switch
                value={lightMode}
                onValueChange={toggleLightMode}
                trackColor={{ false: COLORS.border2, true: COLORS.primary }}
                thumbColor="#FFFFFF"
                ios_backgroundColor={COLORS.border2}
              />
            }
          />
          <SettingRow
            icon="🌐" label="Language" sub={currentLangLabel} fontSize={fontSize} styles={styles}
            onPress={() => setShowLanguage(true)}
            right={<Text style={styles.chevron}>›</Text>}
          />
        </View>

        {/* ── NOTIFICATION SETTINGS ── */}
        <Text style={[styles.sectionHeader, { fontSize: fontSize.xs }]}>NOTIFICATION SETTINGS</Text>
        <View style={styles.card}>
          <SettingRow
            icon="🔔" label="Scan Alerts"
            sub={scanAlerts ? 'Showing alerts after each scan' : 'Alerts muted'}
            fontSize={fontSize} styles={styles}
            right={
              <Switch
                value={scanAlerts}
                onValueChange={toggleScanAlerts}
                trackColor={{ false: COLORS.border2, true: COLORS.primary }}
                thumbColor="#FFFFFF"
                ios_backgroundColor={COLORS.border2}
              />
            }
          />
        </View>

        {/* ── PRIVACY & SECURITY ── */}
        <Text style={[styles.sectionHeader, { fontSize: fontSize.xs }]}>PRIVACY & SECURITY</Text>
        <View style={styles.card}>
          <SettingRow
            icon="📋" label="Auto-scan Pasteboard"
            sub={autoScanPasteboard ? 'Suggests scanning copied text automatically' : 'Off'}
            fontSize={fontSize} styles={styles}
            right={
              <Switch
                value={autoScanPasteboard}
                onValueChange={toggleAutoScanPasteboard}
                trackColor={{ false: COLORS.border2, true: COLORS.primary }}
                thumbColor="#FFFFFF"
                ios_backgroundColor={COLORS.border2}
              />
            }
          />
        </View>

        {/* ── SUPPORT ── */}
        <Text style={[styles.sectionHeader, { fontSize: fontSize.xs }]}>SUPPORT</Text>
        <View style={styles.card}>
          <SettingRow
            icon="🎧" label="Help Center" sub="FAQs and how-tos" fontSize={fontSize} styles={styles}
            onPress={() => setShowHelp(true)}
            right={<Text style={styles.chevron}>›</Text>}
          />
          <SettingRow
            icon="🔒" label="Privacy Policy" fontSize={fontSize} styles={styles}
            onPress={() => setShowPrivacy(true)}
            right={<Text style={styles.chevron}>›</Text>}
          />
          <SettingRow
            icon="📄" label="Terms of Service" fontSize={fontSize} styles={styles}
            onPress={() => setShowTerms(true)}
            right={<Text style={styles.chevron}>›</Text>}
          />
        </View>

        {/* ── ABOUT ── */}
        <Text style={[styles.sectionHeader, { fontSize: fontSize.xs }]}>ABOUT</Text>
        <TouchableOpacity style={styles.aboutBtn} onPress={() => setShowAbout(true)} activeOpacity={0.8}>
          <Text style={[styles.aboutBtnText, { fontSize: fontSize.sm }]}>ABOUT TRUSCAN (v1.1)</Text>
        </TouchableOpacity>

      </ScrollView>

      {/* Modals */}
      <LanguageModal
        visible={showLanguage} onClose={() => setShowLanguage(false)}
        value={language} onSelect={setLanguage} COLORS={COLORS} fontSize={fontSize}
      />
      <FaqModal visible={showHelp} onClose={() => setShowHelp(false)} COLORS={COLORS} fontSize={fontSize} />
      <InfoModal
        visible={showPrivacy} onClose={() => setShowPrivacy(false)}
        title="Privacy Policy" text={PRIVACY_TEXT} COLORS={COLORS} fontSize={fontSize}
      />
      <InfoModal
        visible={showTerms} onClose={() => setShowTerms(false)}
        title="Terms of Service" text={TERMS_TEXT} COLORS={COLORS} fontSize={fontSize}
      />
      <InfoModal
        visible={showAbout} onClose={() => setShowAbout(false)}
        title="About TruScan" text={ABOUT_TEXT} COLORS={COLORS} fontSize={fontSize}
      />
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

  content: { padding: SPACING.lg, paddingBottom: 80 },

  sectionHeader: {
    color: COLORS.muted, fontWeight: '700', letterSpacing: 0.5,
    textTransform: 'uppercase', marginBottom: SPACING.sm, marginTop: SPACING.md,
  },

  card: {
    backgroundColor: COLORS.surface, borderRadius: RADIUS.lg,
    borderWidth: 1.5, borderColor: COLORS.border, overflow: 'hidden', ...SHADOW.card,
  },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
    paddingHorizontal: SPACING.md, paddingVertical: 13,
  },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: COLORS.border },
  rowIcon:   { fontSize: 16, width: 22, textAlign: 'center' },
  rowLabel:  { color: COLORS.ink, fontWeight: '600' },
  rowSub:    { color: COLORS.muted, marginTop: 2 },
  chevron:   { color: COLORS.muted, fontSize: 20, fontWeight: '600' },

  aboutBtn: {
    backgroundColor: COLORS.surface, borderRadius: RADIUS.lg,
    borderWidth: 1.5, borderColor: COLORS.border,
    paddingVertical: 14, alignItems: 'center', ...SHADOW.card,
  },
  aboutBtnText: { color: COLORS.ink, fontWeight: '700', letterSpacing: 0.3 },
});

const makeModalStyles = (COLORS) => StyleSheet.create({
  modalSafe:   { flex: 1, backgroundColor: COLORS.background },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: SPACING.lg, borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  modalTitle: { fontWeight: '800', color: COLORS.ink },
  modalClose: { color: COLORS.primary, fontWeight: '600' },
  modalBody:  { padding: SPACING.lg },
  modalText:  { color: COLORS.muted, lineHeight: 22 },

  // FAQ
  faqIntro: {
    color: COLORS.muted, fontWeight: '700', letterSpacing: 0.5,
    textTransform: 'uppercase', marginBottom: SPACING.md,
  },
  faqCard: {
    backgroundColor: COLORS.surface, borderRadius: RADIUS.md,
    borderWidth: 1.5, borderColor: COLORS.border,
    padding: SPACING.md, marginBottom: SPACING.sm,
  },
  faqQRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  faqQ:      { color: COLORS.ink, fontWeight: '700', flex: 1, marginRight: SPACING.sm },
  faqChevron: { color: COLORS.muted, fontSize: 18, fontWeight: '700' },
  faqA:      { color: COLORS.muted, marginTop: SPACING.sm, lineHeight: 20 },
  faqFooter: { color: COLORS.hint, textAlign: 'center', marginTop: SPACING.lg, lineHeight: 18 },

  // Language sheet
  sheetOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: COLORS.surface, borderTopLeftRadius: RADIUS.lg, borderTopRightRadius: RADIUS.lg,
    borderTopWidth: 1.5, borderColor: COLORS.border, padding: SPACING.lg,
  },
  sheetTitle: {
    color: COLORS.muted, fontWeight: '700', letterSpacing: 0.5,
    textTransform: 'uppercase', marginBottom: SPACING.sm,
  },
  sheetOption: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  sheetOptionActive: { backgroundColor: COLORS.infoBg, borderRadius: RADIUS.sm, paddingHorizontal: SPACING.sm },
  sheetOptionText:   { fontWeight: '600' },
});