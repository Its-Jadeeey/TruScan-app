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
import ScreenHeader from '../Components/ScreenHeader';
import Chevron from '../Components/Chevron';
import { useApp } from '../Context/AppContext';
import { getTheme, RADIUS, SPACING, SHADOW } from '../Service/theme';
import { useLang } from '../Service/i18n';
import { SETTINGS_CONTENT } from '../Service/settingsContent';

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'tl', label: 'Tagalog' },
];

// ─── GENERIC INFO MODAL (Privacy / Terms / About) ────────────────────────────

function InfoModal({ visible, onClose, title, text, COLORS, fontSize }) {
  const styles = makeModalStyles(COLORS);
  const { t: tr, lang } = useLang();
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.modalSafe}>
        <View style={styles.modalHeader}>
          <Text style={[styles.modalTitle, { fontSize: fontSize.md }]}>{title}</Text>
          <TouchableOpacity onPress={onClose} hitSlop={10}>
            <Text style={[styles.modalClose, { fontSize: fontSize.base }]}>{tr('set.close')}</Text>
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
  const { t: tr, lang } = useLang();
  const [openIndex, setOpenIndex] = useState(null);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.modalSafe}>
        <View style={styles.modalHeader}>
          <Text style={[styles.modalTitle, { fontSize: fontSize.md }]}>{tr('set.help')}</Text>
          <TouchableOpacity onPress={onClose} hitSlop={10}>
            <Text style={[styles.modalClose, { fontSize: fontSize.base }]}>{tr('set.close')}</Text>
          </TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={styles.modalBody}>
          <Text style={[styles.faqIntro, { fontSize: fontSize.xs }]}>{tr('set.faqTitle')}</Text>
          {SETTINGS_CONTENT[lang].faqs.map((item, i) => {
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
                  <Chevron direction={open ? 'down' : 'right'} color={COLORS.muted} />
                </View>
                {open && <Text style={[styles.faqA, { fontSize: fontSize.sm }]}>{item.a}</Text>}
              </TouchableOpacity>
            );
          })}
          <Text style={[styles.faqFooter, { fontSize: fontSize.xs }]}>
            {tr('set.faqFooter')}
          </Text>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

// ─── LANGUAGE PICKER MODAL ─────────────────────────────────────────────────────

function LanguageModal({ visible, onClose, value, onSelect, COLORS, fontSize }) {
  const styles = makeModalStyles(COLORS);
  const { t: tr, lang } = useLang();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={styles.sheetOverlay} activeOpacity={1} onPress={onClose}>
        <View style={styles.sheet}>
          <Text style={[styles.sheetTitle, { fontSize: fontSize.sm }]}>{tr('set.langTitle')}</Text>
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
                {value === item.code && <Text style={{ color: COLORS.primary, fontWeight: '800' }}>✓</Text>}
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
    fontSize, simpleMode, toggleSimpleMode,
    lightMode, toggleLightMode,
    language, setLanguage,
    scanAlerts, toggleScanAlerts,
    autoScanPasteboard, toggleAutoScanPasteboard,
  } = useApp();
  const { t: tr, lang } = useLang();

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
      <ScreenHeader title={tr('set.header')} navigation={navigation} COLORS={COLORS} fontSize={fontSize} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* ── APP PREFERENCES ── */}
        <Text style={[styles.sectionHeader, { fontSize: fontSize.xs }]}>{tr('set.prefs')}</Text>
        <View style={styles.card}>
          <SettingRow
            icon="🛡️" label={simpleMode ? tr('set.normalMode') : tr('set.simpleMode')}
            sub={simpleMode ? tr('set.normalSub') : tr('set.simpleSub')}
            fontSize={fontSize} showBorder styles={styles}
            onPress={() => { toggleSimpleMode(); navigation?.navigate?.('Home'); }}
            right={<Chevron color={COLORS.muted} />}
          />
          <SettingRow
            icon="🌓" label={tr('set.light')} fontSize={fontSize} showBorder styles={styles}
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
            icon="🌐" label={tr('set.language')} sub={currentLangLabel} fontSize={fontSize} styles={styles}
            onPress={() => setShowLanguage(true)}
            right={<Chevron color={COLORS.muted} />}
          />
        </View>

        {/* ── NOTIFICATION SETTINGS ── */}
        <Text style={[styles.sectionHeader, { fontSize: fontSize.xs }]}>{tr('set.notif')}</Text>
        <View style={styles.card}>
          <SettingRow
            icon="🔔" label={tr('set.alerts')}
            sub={scanAlerts ? tr('set.alertsOn') : tr('set.alertsOff')}
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
        <Text style={[styles.sectionHeader, { fontSize: fontSize.xs }]}>{tr('set.privacySec')}</Text>
        <View style={styles.card}>
          <SettingRow
            icon="📋" label={tr('set.paste')}
            sub={autoScanPasteboard ? tr('set.pasteOn') : tr('set.pasteOff')}
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
        <Text style={[styles.sectionHeader, { fontSize: fontSize.xs }]}>{tr('set.support')}</Text>
        <View style={styles.card}>
          <SettingRow
            icon="🎧" label={tr('set.help')} sub={tr('set.helpSub')} fontSize={fontSize} styles={styles}
            onPress={() => setShowHelp(true)}
            right={<Chevron color={COLORS.muted} />}
          />
          <SettingRow
            icon="🔒" label={tr('set.privacy')} fontSize={fontSize} styles={styles}
            onPress={() => setShowPrivacy(true)}
            right={<Chevron color={COLORS.muted} />}
          />
          <SettingRow
            icon="📄" label={tr('set.terms')} fontSize={fontSize} styles={styles}
            onPress={() => setShowTerms(true)}
            right={<Chevron color={COLORS.muted} />}
          />
        </View>

        {/* ── ABOUT ── */}
        <Text style={[styles.sectionHeader, { fontSize: fontSize.xs }]}>{tr('set.about')}</Text>
        <TouchableOpacity style={styles.aboutBtn} onPress={() => setShowAbout(true)} activeOpacity={0.8}>
          <Text style={[styles.aboutBtnText, { fontSize: fontSize.sm }]}>{tr('set.aboutBtn')}</Text>
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
        title={tr('set.privacy')} text={SETTINGS_CONTENT[lang].privacy} COLORS={COLORS} fontSize={fontSize}
      />
      <InfoModal
        visible={showTerms} onClose={() => setShowTerms(false)}
        title={tr('set.terms')} text={SETTINGS_CONTENT[lang].terms} COLORS={COLORS} fontSize={fontSize}
      />
      <InfoModal
        visible={showAbout} onClose={() => setShowAbout(false)}
        title={tr('set.aboutTitle')} text={SETTINGS_CONTENT[lang].about} COLORS={COLORS} fontSize={fontSize}
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

  content: { padding: SPACING.lg, paddingBottom: SPACING.xl },

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
  sheetOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', paddingHorizontal: SPACING.lg },
  sheet: {
    backgroundColor: COLORS.surface, borderRadius: RADIUS.lg,
    borderWidth: 1.5, borderColor: COLORS.border, padding: SPACING.lg,
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