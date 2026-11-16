//// TruScan/FrontEnd/Screens/simpleModeScreen.js
// Simple Mode home screen — big colorful Message/Email/Link scan buttons,
// purple theme. Rendered as the "Home" tab whenever Simple Mode is on.
import React, { useState, useMemo } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp }          from '../Context/AppContext';
import { analyzeText }     from '../Service/analyzeService';
import { validateInput, isFlagged, goToReport, goToEducation } from '../Service/ScanHelpers';
import SuspiciousCard   from '../Components/SuspiciousCard';
import PasteboardBanner from '../Components/PasteboardBanner';
import { usePasteboardSuggestion } from '../Service/pasteboard';
import { maybeShowScanAlert }      from '../Service/scanFeedback';
import { getTheme, SIMPLE_SCAN_BUTTONS, RADIUS, SPACING, SHADOW, getRiskColors } from '../Service/theme';
const SCAN_TYPES = ['message', 'email', 'link'];
// ─── BIG RESULT BANNER ────────────────────────────────────────────────────────
function BigResultBanner({ result, styles, COLORS }) {
  if (!result) return null;
  const risk = getRiskColors(result.prediction, COLORS);
  const config = {
    scam:       { emoji: '⚠️', headline: 'SCAM ITO!',    detail: 'Huwag tumugon. Huwag mag-click ng link. Huwag magpadala ng pera.' },
    phishing:   { emoji: '⚠️', headline: 'PHISHING ITO!', detail: 'Huwag tumugon. Huwag mag-click ng link. Huwag magpadala ng pera.' },
    smishing:   { emoji: '⚠️', headline: 'SMISHING ITO!', detail: 'Huwag tumugon. Huwag mag-click ng link. Huwag magpadala ng pera.' },
    suspicious: { emoji: '⚡', headline: 'MAG-INGAT!',    detail: 'Ang mensaheng ito ay kahina-hinala. Huwag magbigay ng impormasyon.' },
    safe:       { emoji: '✅', headline: 'LIGTAS ITO',    detail: 'Ang mensaheng ito ay mukhang lehitimo. Palaging mag-ingat pa rin.' },
  }[result.prediction] || { emoji: '❓', headline: 'HINDI SIGURADO', detail: 'Hindi natukoy ang klase ng mensaheng ito.' };
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
  // Theme: follows Light Mode even while Simple Mode is on
  const { lightMode, scanAlerts, autoScanPasteboard } = useApp();
  const COLORS        = getTheme(true, lightMode);
  const SIMPLE_COLORS = COLORS;
  const styles        = useMemo(() => makeStyles(SIMPLE_COLORS), [lightMode]);
  const BIG = { xs: 15, sm: 18, base: 20, md: 23, lg: 28, xl: 34, xxl: 40 };
  const selectType = (type) => {
    setSelectedType(type);
    setResult(null);
  };
  // Editing the input makes the old result stale
  const onChangeInput = (txt) => {
    setInputText(txt);
    if (result) setResult(null);
  };
  const { suggestion, dismiss, accept } = usePasteboardSuggestion(autoScanPasteboard, inputText);

  const handleScan = async (textArg, typeArg) => {
    const text = typeof textArg === 'string' ? textArg : inputText;
    const type = typeof typeArg === 'string' ? typeArg : selectedType;
    const check = validateInput(type, text);
    if (!check.ok) {
      Alert.alert('Hindi ma-scan', check.fil, [{ text: 'OK' }]);
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const data = await analyzeText(text);
      setResult(data);
      maybeShowScanAlert({
        enabled: scanAlerts, result: data, lang: 'fil',
        onReport: () => goToReport(navigation, { text: text.trim(), tab: type, result: data }),
        onLearn:  () => goToEducation(navigation, 'types'),
      });
    } catch {
      Alert.alert('Error', 'Hindi makapag-analyze. Subukan ulit.');
    } finally {
      setLoading(false);
    }
  };
  const scanSuggestion = () => {
    const sug = accept();
    if (!sug) return;
    setSelectedType(sug.tab);
    setInputText(sug.text);
    handleScan(sug.text, sug.tab);
  };

  const reportIt = () => goToReport(navigation, { text: inputText.trim(), tab: selectedType, result });
  const flagged = isFlagged(result);
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <PasteboardBanner
          suggestion={suggestion} COLORS={COLORS} fs={BIG} lang="fil"
          onScan={scanSuggestion} onDismiss={dismiss}
        />
        {/* Brand */}
        <View style={styles.brandRow}>
          <View style={styles.brandBadge}>
            <Text style={styles.brandBadgeIcon}>🛡️</Text>
          </View>
          <Text style={[styles.brand, { fontSize: BIG.lg }]}>TRUSCAN</Text>
        </View>
        <Text style={[styles.simpleLabel, { fontSize: BIG.md }]}>SIMPLE MODE</Text>
        {/* Three big scan buttons */}
        <View style={[styles.btnStack, !selectedType && styles.btnStackFill]}>
          {SCAN_TYPES.map(type => {
            const cfg = SIMPLE_SCAN_BUTTONS[type];
            const active = selectedType === type;
            return (
              <TouchableOpacity
                key={type}
                style={[styles.scanTypeBtn, !selectedType && styles.scanTypeBtnTall, { backgroundColor: cfg.bg }, active && styles.scanTypeBtnActive]}
                onPress={() => selectType(type)}
                activeOpacity={0.85}
              >
                <Text style={[styles.scanTypeIcon, !selectedType && { fontSize: 32 }]}>{cfg.icon}</Text>
                <Text style={[styles.scanTypeLabel, { fontSize: selectedType ? BIG.base : BIG.md }]}>{cfg.label}</Text>
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
              onChangeText={onChangeInput}
              textAlignVertical="top"
            />
            <BigResultBanner result={result} styles={styles} COLORS={COLORS} />
            <TouchableOpacity
              style={[styles.bigScanBtn, loading && styles.bigScanBtnDisabled]}
              onPress={() => handleScan()}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading
                ? <ActivityIndicator color="#FFF" size="large" />
                : <Text style={[styles.bigScanBtnText, { fontSize: BIG.md }]}>{result ? '🔄  I-SCAN ULIT' : '🔍  I-SCAN'}</Text>
              }
            </TouchableOpacity>
            {flagged && (
              <SuspiciousCard
                COLORS={COLORS}
                fs={BIG}
                lang="fil"
                onReport={reportIt}
                onLearn={() => goToEducation(navigation, 'types')}
              />
            )}
            {result && !flagged && (
              <TouchableOpacity style={styles.reportBtn} onPress={reportIt} activeOpacity={0.85}>
                <Text style={[styles.reportBtnText, { fontSize: BIG.sm }]}>Mali ba ito? I-report pa rin</Text>
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
const makeStyles = (SIMPLE_COLORS) => StyleSheet.create({
  safe:    { flex: 1, backgroundColor: SIMPLE_COLORS.background },
  content: { flexGrow: 1, padding: SPACING.lg, paddingBottom: SPACING.xl },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: 4 },
  brandBadge: {
    width: 34, height: 34, borderRadius: 10, backgroundColor: SIMPLE_COLORS.navCard,
    alignItems: 'center', justifyContent: 'center',
  },
  brandBadgeIcon: { fontSize: 16 },
  brand:       { color: SIMPLE_COLORS.ink, fontWeight: '800', letterSpacing: 1 },
  simpleLabel: { color: SIMPLE_COLORS.accentGreen, fontWeight: '800', marginBottom: SPACING.lg, letterSpacing: 0.5 },
  btnStack: { gap: SPACING.sm, marginBottom: SPACING.lg },
  btnStackFill: { flex: 3, gap: SPACING.md },
  scanTypeBtnTall: { flex: 1, minHeight: 84 },
  scanTypeBtn: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
    borderRadius: RADIUS.lg, paddingVertical: SPACING.md, paddingHorizontal: SPACING.lg,
    ...SHADOW.card,
  },
  scanTypeBtnActive: { borderWidth: 2, borderColor: SIMPLE_COLORS.ink },
  scanTypeIcon:  { fontSize: 20 },
  scanTypeLabel: { color: '#FFFFFF', fontWeight: '800', letterSpacing: 0.5 },
  hero: {
    borderRadius: RADIUS.lg, backgroundColor: SIMPLE_COLORS.surface,
    borderWidth: 1.5, borderColor: SIMPLE_COLORS.border,
    padding: SPACING.xl, alignItems: 'center', justifyContent: 'center', marginTop: SPACING.sm,
    flex: 2, minHeight: 170,
  },
  heroWarnIcon:  { fontSize: 44, marginBottom: SPACING.sm },
  heroCheckIcon: { fontSize: 24, marginTop: SPACING.sm },
  heroText:      { color: SIMPLE_COLORS.ink, fontWeight: '600', textAlign: 'center', lineHeight: 24 },
  textInput: {
    backgroundColor: SIMPLE_COLORS.surface, borderWidth: 2, borderColor: SIMPLE_COLORS.border2,
    borderRadius: RADIUS.lg, padding: SPACING.lg, minHeight: 140, flexGrow: 1,
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