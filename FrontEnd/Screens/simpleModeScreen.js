// TruScan/FrontEnd/Screens/simpleModeScreen.js
// Simple Mode home screen — big colorful Message/Email/Link scan buttons,
// purple theme. Rendered as the "Home" tab whenever Simple Mode is on.

import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp }          from '../Context/AppContext';
import { analyzeText }     from '../Service/analyzeService';
import { addReport }       from '../Service/firestoreService';
import { SIMPLE_COLORS, SIMPLE_SCAN_BUTTONS, RADIUS, SPACING, SHADOW, getRiskColors } from '../Service/theme';

const SCAN_TYPES = ['message', 'email', 'link'];

// ─── BIG RESULT BANNER ────────────────────────────────────────────────────────

function BigResultBanner({ result }) {
  if (!result) return null;
  const risk = getRiskColors(result.prediction);
  const config = {
    scam:       { emoji: '⚠️', headline: 'SCAM ITO!',   detail: 'Huwag tumugon. Huwag mag-click ng link. Huwag magpadala ng pera.' },
    suspicious: { emoji: '⚡', headline: 'MAG-INGAT!',   detail: 'Ang mensaheng ito ay kahina-hinala. Huwag magbigay ng impormasyon.' },
    safe:       { emoji: '✅', headline: 'LIGTAS ITO',   detail: 'Ang mensaheng ito ay mukhang lehitimo. Palaging mag-ingat pa rin.' },
  }[result.prediction];

  return (
    <View style={[styles.bigBanner, { backgroundColor: risk.bg, borderColor: risk.border }]}>
      <Text style={styles.bigEmoji}>{config.emoji}</Text>
      <Text style={[styles.bigHeadline, { color: risk.text }]}>{config.headline}</Text>
      <Text style={[styles.bigDetail, { color: risk.text }]}>{config.detail}</Text>
      <View style={styles.confRow}>
        <Text style={[styles.confLabel, { color: risk.text }]}>Katiyakan:</Text>
        <Text style={[styles.confValue, { color: risk.text }]}>{result.confidence}%</Text>
      </View>
    </View>
  );
}

// ─── MAIN SCREEN ──────────────────────────────────────────────────────────────

export default function SimpleModeScreen({ navigation }) {
  const [selectedType, setSelectedType] = useState(null);
  const [inputText, setInputText]       = useState('');
  const [result, setResult]             = useState(null);
  const [loading, setLoading]           = useState(false);
  const [reported, setReported]         = useState(false);

  const BIG = { xs: 15, sm: 18, base: 20, md: 23, lg: 28, xl: 34, xxl: 40 };

  const selectType = (type) => {
    setSelectedType(type);
    setResult(null);
    setReported(false);
  };

  const handleScan = async () => {
    if (!inputText.trim()) {
      Alert.alert('Walang Mensahe', 'Mangyaring i-paste ang mensahe bago mag-scan.', [{ text: 'OK' }]);
      return;
    }
    setLoading(true);
    setResult(null);
    setReported(false);
    try {
      const data = await analyzeText(inputText);
      setResult(data);
    } catch {
      Alert.alert('Error', 'Hindi makapag-analyze. Subukan ulit.');
    } finally {
      setLoading(false);
    }
  };

  const handleReport = async () => {
    if (!result || reported) return;
    const res = await addReport({
      text: inputText, category: result.prediction,
      source: 'simple_mode_screen', mlPrediction: result,
    });
    if (res.success) {
      setReported(true);
      Alert.alert('Salamat!', 'Nai-report na ang mensahe.');
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

        {/* Top bar */}
        <TouchableOpacity onPress={() => navigation?.openDrawer?.()} activeOpacity={0.7} hitSlop={10} style={styles.menuBtn}>
          <Text style={styles.menuIcon}>☰</Text>
        </TouchableOpacity>

        {/* Brand */}
        <View style={styles.brandRow}>
          <View style={styles.brandBadge}>
            <Text style={styles.brandBadgeIcon}>🛡️</Text>
          </View>
          <Text style={[styles.brand, { fontSize: BIG.lg }]}>TRUSCAN</Text>
        </View>
        <Text style={[styles.simpleLabel, { fontSize: BIG.md }]}>SIMPLE MODE</Text>

        {/* Three big scan buttons */}
        <View style={styles.btnStack}>
          {SCAN_TYPES.map(type => {
            const cfg = SIMPLE_SCAN_BUTTONS[type];
            const active = selectedType === type;
            return (
              <TouchableOpacity
                key={type}
                style={[styles.scanTypeBtn, { backgroundColor: cfg.bg }, active && styles.scanTypeBtnActive]}
                onPress={() => selectType(type)}
                activeOpacity={0.85}
              >
                <Text style={styles.scanTypeIcon}>{cfg.icon}</Text>
                <Text style={[styles.scanTypeLabel, { fontSize: BIG.base }]}>{cfg.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Input + Scan — revealed once a type is picked */}
        {selectedType ? (
          <>
            <TextInput
              style={[styles.textInput, { fontSize: BIG.base }]}
              multiline
              placeholder="Pindutin dito at i-paste ang mensahe..."
              placeholderTextColor={SIMPLE_COLORS.hint}
              value={inputText}
              onChangeText={setInputText}
              textAlignVertical="top"
            />

            <BigResultBanner result={result} />

            <TouchableOpacity
              style={[styles.bigScanBtn, loading && styles.bigScanBtnDisabled]}
              onPress={handleScan}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading
                ? <ActivityIndicator color="#FFF" size="large" />
                : <Text style={[styles.bigScanBtnText, { fontSize: BIG.md }]}>🔍  I-SCAN</Text>
              }
            </TouchableOpacity>

            {result && (
              <TouchableOpacity
                style={[styles.reportBtn, reported && styles.reportBtnDone]}
                onPress={handleReport}
                disabled={reported}
                activeOpacity={0.85}
              >
                <Text style={[styles.reportBtnText, { fontSize: BIG.base }]}>
                  {reported ? '✓ Nai-report na! Salamat.' : '📢  I-report sa Komunidad'}
                </Text>
              </TouchableOpacity>
            )}
          </>
        ) : (
          /* Instruction hero — shown before a scan type is picked */
          <View style={styles.hero}>
            <Text style={styles.heroWarnIcon}>⚠️</Text>
            <Text style={[styles.heroText, { fontSize: BIG.sm }]}>
              Press the button to scan a message, email, or link.
            </Text>
            <Text style={styles.heroCheckIcon}>✔️</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── STYLES ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: SIMPLE_COLORS.background },
  content: { padding: SPACING.lg, paddingBottom: 80 },

  menuBtn:  { marginBottom: SPACING.md },
  menuIcon: { fontSize: 22, color: '#FFFFFF', fontWeight: '700' },

  brandRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: 4 },
  brandBadge: {
    width: 34, height: 34, borderRadius: 10, backgroundColor: SIMPLE_COLORS.navCard,
    alignItems: 'center', justifyContent: 'center',
  },
  brandBadgeIcon: { fontSize: 16 },
  brand:       { color: '#FFFFFF', fontWeight: '800', letterSpacing: 1 },
  simpleLabel: { color: '#4ADE80', fontWeight: '800', marginBottom: SPACING.lg, letterSpacing: 0.5 },

  btnStack: { gap: SPACING.sm, marginBottom: SPACING.lg },
  scanTypeBtn: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
    borderRadius: RADIUS.lg, paddingVertical: SPACING.md, paddingHorizontal: SPACING.lg,
    ...SHADOW.card,
  },
  scanTypeBtnActive: { borderWidth: 2, borderColor: '#FFFFFF' },
  scanTypeIcon:  { fontSize: 20 },
  scanTypeLabel: { color: '#FFFFFF', fontWeight: '800', letterSpacing: 0.5 },

  hero: {
    borderRadius: RADIUS.lg, backgroundColor: SIMPLE_COLORS.surface,
    borderWidth: 1.5, borderColor: SIMPLE_COLORS.border,
    padding: SPACING.xl, alignItems: 'center', marginTop: SPACING.md,
  },
  heroWarnIcon:  { fontSize: 34, marginBottom: SPACING.sm },
  heroCheckIcon: { fontSize: 24, marginTop: SPACING.sm },
  heroText:      { color: SIMPLE_COLORS.ink, fontWeight: '600', textAlign: 'center', lineHeight: 24 },

  textInput: {
    backgroundColor: SIMPLE_COLORS.surface, borderWidth: 2, borderColor: SIMPLE_COLORS.border2,
    borderRadius: RADIUS.lg, padding: SPACING.lg, minHeight: 140,
    color: SIMPLE_COLORS.ink, lineHeight: 30, marginBottom: SPACING.md, ...SHADOW.card,
  },

  bigScanBtn: {
    backgroundColor: SIMPLE_COLORS.primary, borderRadius: RADIUS.lg,
    paddingVertical: SPACING.lg, alignItems: 'center', justifyContent: 'center',
    marginBottom: SPACING.sm, ...SHADOW.card,
  },
  bigScanBtnDisabled: { backgroundColor: SIMPLE_COLORS.border2 },
  bigScanBtnText:     { color: '#FFFFFF', fontWeight: '900', letterSpacing: 0.5 },

  reportBtn: {
    padding: SPACING.md, borderRadius: RADIUS.lg,
    backgroundColor: SIMPLE_COLORS.navCard, alignItems: 'center', ...SHADOW.card,
  },
  reportBtnDone: { backgroundColor: '#1E5C48' },
  reportBtnText: { color: '#FFF', fontWeight: '700' },

  bigBanner: {
    borderRadius: RADIUS.lg, borderWidth: 2,
    padding: SPACING.xl, alignItems: 'center', marginBottom: SPACING.md, ...SHADOW.card,
  },
  bigEmoji:    { fontSize: 48, marginBottom: SPACING.sm },
  bigHeadline: { fontSize: 30, fontWeight: '900', textAlign: 'center', letterSpacing: -0.5 },
  bigDetail:   { fontSize: 16, fontWeight: '600', textAlign: 'center', marginTop: SPACING.sm, lineHeight: 24 },
  confRow:     { flexDirection: 'row', gap: 8, marginTop: SPACING.md, alignItems: 'center' },
  confLabel:   { fontSize: 14, fontWeight: '700' },
  confValue:   { fontSize: 22, fontWeight: '900' },
});