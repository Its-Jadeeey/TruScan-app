// TruScan/FrontEnd/Screens/simpleModeScreen.js
// Dedicated Simple Mode screen — large UI, high contrast, Tagalog labels.
// Used as an onboarding screen for elderly users OR as a full standalone scan experience.

import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, Switch, ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp }          from '../Context/AppContext';
import { analyzeText }     from '../Service/analyzeService';
import { addReport }       from '../Service/firestoreService';
import { COLORS, RADIUS, SPACING, SHADOW, getRiskColors } from '../Service/theme';

// ─── BIG RESULT BANNER ────────────────────────────────────────────────────────

function BigResultBanner({ result }) {
  if (!result) return null;
  const risk = getRiskColors(result.prediction);
  const config = {
    scam: {
      emoji: '⚠️',
      headline: 'SCAM ITO!',
      detail: 'Huwag tumugon. Huwag mag-click ng link. Huwag magpadala ng pera.',
    },
    suspicious: {
      emoji: '⚡',
      headline: 'MAG-INGAT!',
      detail: 'Ang mensaheng ito ay kahina-hinala. Huwag magbigay ng impormasyon.',
    },
    safe: {
      emoji: '✅',
      headline: 'LIGTAS ITO',
      detail: 'Ang mensaheng ito ay mukhang lehitimo. Palaging mag-ingat pa rin.',
    },
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
  const { simpleMode, toggleSimpleMode } = useApp();
  const [inputText, setInputText] = useState('');
  const [result, setResult]       = useState(null);
  const [loading, setLoading]     = useState(false);
  const [reported, setReported]   = useState(false);

  // Always show in Simple Mode font sizes regardless of global setting
  const BIG = {
    xs:   15, sm: 18, base: 20, md: 23,
    lg:   28, xl: 34, xxl:  40,
  };

  const handleScan = async () => {
    if (!inputText.trim()) {
      Alert.alert(
        'Walang Mensahe',
        'Mangyaring i-paste ang mensahe bago mag-scan.',
        [{ text: 'OK' }]
      );
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
      text:         inputText,
      category:     result.prediction,
      source:       'simple_mode_screen',
      mlPrediction: result,
    });
    if (res.success) {
      setReported(true);
      Alert.alert('Salamat!', 'Nai-report na ang mensahe.');
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.brand, { fontSize: BIG.xl }]}>
              Tru<Text style={styles.brandGreen}>Scan</Text>
            </Text>
            <Text style={[styles.brandSub, { fontSize: BIG.sm }]}>Para sa Matatanda</Text>
          </View>

          {/* Simple Mode Switch */}
          <View style={styles.modeSwitch}>
            <Text style={[styles.modeSwitchLabel, { fontSize: BIG.sm }]}>Simple</Text>
            <Switch
              value={simpleMode}
              onValueChange={toggleSimpleMode}
              trackColor={{ false: COLORS.border2, true: COLORS.primary }}
              thumbColor="#FFFFFF"
              ios_backgroundColor={COLORS.border2}
              style={{ transform: [{ scaleX: 1.3 }, { scaleY: 1.3 }] }}
            />
          </View>
        </View>

        {/* Instruction */}
        <View style={[styles.instructionBox, SHADOW.card]}>
          <Text style={[styles.instructionTitle, { fontSize: BIG.md }]}>
            Paano Gamitin:
          </Text>
          <Text style={[styles.instructionText, { fontSize: BIG.base }]}>
            1. Kopyahin ang kahina-hinalang mensahe.{'\n'}
            2. I-paste dito sa kahon sa ibaba.{'\n'}
            3. I-tap ang <Text style={{ color: COLORS.primary, fontWeight: '700' }}>I-SCAN</Text> na pindutan.{'\n'}
            4. Hintayin ang resulta.
          </Text>
        </View>

        {/* Big Result Banner */}
        <BigResultBanner result={result} />

        {/* Text Input */}
        <Text style={[styles.inputLabel, { fontSize: BIG.sm }]}>
          I-paste ang mensahe dito:
        </Text>
        <TextInput
          style={[styles.textInput, { fontSize: BIG.base }]}
          multiline
          placeholder="Pindutin dito at i-paste ang mensahe..."
          placeholderTextColor={COLORS.hint}
          value={inputText}
          onChangeText={setInputText}
          textAlignVertical="top"
        />

        {/* SCAN Button — big and obvious */}
        <TouchableOpacity
          style={[styles.bigScanBtn, loading && styles.bigScanBtnDisabled]}
          onPress={handleScan}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading
            ? (
              <View style={styles.loadingRow}>
                <ActivityIndicator color="#FFF" size="large" />
                <Text style={[styles.bigScanBtnText, { fontSize: BIG.md }]}>  Nag-aanalisa...</Text>
              </View>
            )
            : <Text style={[styles.bigScanBtnText, { fontSize: BIG.lg }]}>🔍  I-SCAN</Text>
          }
        </TouchableOpacity>

        {/* Clear Button */}
        <TouchableOpacity
          style={styles.clearBtn}
          onPress={() => { setInputText(''); setResult(null); setReported(false); }}
          activeOpacity={0.7}
        >
          <Text style={[styles.clearBtnText, { fontSize: BIG.base }]}>🗑  Burahin ang Mensahe</Text>
        </TouchableOpacity>

        {/* Report Button */}
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

        {/* Emergency Help Box */}
        <View style={[styles.helpBox, SHADOW.card]}>
          <Text style={[styles.helpTitle, { fontSize: BIG.md }]}>🆘 Humingi ng Tulong</Text>
          <Text style={[styles.helpText, { fontSize: BIG.base }]}>
            GCash Hotline: <Text style={styles.helpNumber}>2882</Text>{'\n'}
            SSS Hotline: <Text style={styles.helpNumber}>1455</Text>{'\n'}
            NBI Cybercrime: <Text style={styles.helpNumber}>8523-8231</Text>
          </Text>
        </View>

        {/* Back to Regular Mode */}
        {navigation && (
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
            <Text style={[styles.backBtnText, { fontSize: BIG.sm }]}>← Bumalik sa Regular Mode</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── STYLES ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SPACING.lg, paddingBottom: 80 },

  header: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: SPACING.lg,
  },
  brand:     { fontWeight: '800', color: COLORS.ink, letterSpacing: -0.5 },
  brandGreen: { color: COLORS.primary },
  brandSub:  { color: COLORS.muted, fontWeight: '600', marginTop: 2 },
  modeSwitch: { alignItems: 'center', gap: 6 },
  modeSwitchLabel: { fontWeight: '700', color: COLORS.muted },

  instructionBox: {
    backgroundColor: COLORS.infoBg, borderRadius: RADIUS.lg,
    borderWidth: 1.5, borderColor: COLORS.infoBorder,
    padding: SPACING.lg, marginBottom: SPACING.lg,
  },
  instructionTitle: { fontWeight: '800', color: COLORS.info, marginBottom: SPACING.sm },
  instructionText:  { color: COLORS.info, lineHeight: 32 },

  bigBanner: {
    borderRadius: RADIUS.lg, borderWidth: 2,
    padding: SPACING.xl, alignItems: 'center',
    marginBottom: SPACING.lg, ...SHADOW.card,
  },
  bigEmoji:    { fontSize: 56, marginBottom: SPACING.sm },
  bigHeadline: { fontSize: 36, fontWeight: '900', textAlign: 'center', letterSpacing: -0.5 },
  bigDetail:   { fontSize: 18, fontWeight: '600', textAlign: 'center', marginTop: SPACING.sm, lineHeight: 26 },
  confRow:     { flexDirection: 'row', gap: 8, marginTop: SPACING.md, alignItems: 'center' },
  confLabel:   { fontSize: 16, fontWeight: '700' },
  confValue:   { fontSize: 24, fontWeight: '900' },

  inputLabel: { fontWeight: '700', color: COLORS.ink, marginBottom: SPACING.sm },
  textInput: {
    backgroundColor: COLORS.surface, borderWidth: 2, borderColor: COLORS.border2,
    borderRadius: RADIUS.lg, padding: SPACING.lg,
    minHeight: 140, color: COLORS.ink, lineHeight: 30,
    ...SHADOW.card,
  },

  bigScanBtn: {
    backgroundColor: COLORS.primary, borderRadius: RADIUS.lg,
    paddingVertical: SPACING.lg + 4, alignItems: 'center',
    justifyContent: 'center', marginTop: SPACING.md, ...SHADOW.card,
  },
  bigScanBtnDisabled: { backgroundColor: COLORS.border2 },
  bigScanBtnText:     { color: '#FFFFFF', fontWeight: '900', letterSpacing: 0.5 },
  loadingRow:         { flexDirection: 'row', alignItems: 'center' },

  clearBtn: {
    marginTop: SPACING.sm, padding: SPACING.md,
    borderRadius: RADIUS.lg, borderWidth: 2, borderColor: COLORS.border,
    backgroundColor: COLORS.surface, alignItems: 'center',
  },
  clearBtnText: { color: COLORS.muted, fontWeight: '700' },

  reportBtn: {
    marginTop: SPACING.sm, padding: SPACING.md,
    borderRadius: RADIUS.lg, backgroundColor: COLORS.ink, alignItems: 'center', ...SHADOW.card,
  },
  reportBtnDone: { backgroundColor: COLORS.safe },
  reportBtnText: { color: '#FFF', fontWeight: '700' },

  helpBox: {
    backgroundColor: COLORS.scamBg, borderRadius: RADIUS.lg,
    borderWidth: 1.5, borderColor: COLORS.scamBorder,
    padding: SPACING.lg, marginTop: SPACING.lg,
  },
  helpTitle:  { fontWeight: '800', color: COLORS.scam, marginBottom: SPACING.sm },
  helpText:   { color: COLORS.scam, lineHeight: 32 },
  helpNumber: { fontWeight: '900' },

  backBtn:     { alignItems: 'center', marginTop: SPACING.xl },
  backBtnText: { color: COLORS.primary, fontWeight: '700' },
});