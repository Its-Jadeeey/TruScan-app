//// TruScan/FrontEnd/Screens/scanScreen.js
// Main scan screen — hero header, message/email/link tabs, big CTA, "How it works"
// Re-themes to light or dark based on Light Mode.
import React, { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp }           from '../Context/AppContext';
import { analyzeText }      from '../Service/analyzeService';
import { getScanned, rememberScan } from '../Service/scanCache';
import { useLang } from '../Service/i18n';
import { validateInput, isFlagged, goToReport, goToEducation } from '../Service/ScanHelpers';
import SuspiciousCard    from '../Components/SuspiciousCard';
import PasteboardBanner  from '../Components/PasteboardBanner';
import { usePasteboardSuggestion } from '../Service/pasteboard';
import { maybeShowScanAlert }      from '../Service/scanFeedback';
import { getTheme, RADIUS, SPACING, SHADOW, getRiskColors } from '../Service/theme';
// ─── INPUT TYPE TABS ──────────────────────────────────────────────────────────
const INPUT_TABS = [
  { key: 'message', label: 'Message', icon: '💬' },
  { key: 'email',   label: 'Email',   icon: '✉️' },
  { key: 'link',    label: 'Link',    icon: '🔗' },
];
const PLACEHOLDERS = {
  message: 'Paste your message here...',
  email:   'Paste the email content here...',
  link:    'Paste the suspicious link here...',
};
const MAX_CHARS = 5000;
// ─── HOW IT WORKS ─────────────────────────────────────────────────────────────
const STEPS = [
  { num: '1', title: 'Analyze', icon: '🤖', desc: 'We scan content using linear-SVM with TF-IDF features.' },
  { num: '2', title: 'Detect',  icon: '🚩', desc: 'We identify scam patterns and risk indicators.' },
  { num: '3', title: 'Explain', icon: '🛡️', desc: 'You get a clear result with explanation and tips.' },
];
// ─── RESULT BANNER ─────────────────────────────────────────────────────────────
function RiskBanner({ result, fontSize, COLORS, styles }) {
  const { t: tr, ind } = useLang();
  if (!result) return null;
  const kind = ['scam', 'suspicious'].includes(result.prediction) ? result.prediction : 'safe';
  const isScam = kind !== 'safe';
  const risk = getRiskColors(kind, COLORS);
  return (
    <View style={[styles.riskBanner, { backgroundColor: risk.bg, borderColor: risk.border }]}>
      <View style={styles.riskHeader}>
        <View style={[styles.riskIcon, { backgroundColor: risk.bg, borderColor: risk.border }]}>
          <Text style={[styles.riskIconText, { color: risk.text, fontSize: fontSize.md }]}>
            {kind === 'scam' ? '⚠️' : kind === 'suspicious' ? '⚡' : '✓'}
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.riskLabel, { color: risk.text, fontSize: fontSize.xs }]}>
            {tr('res.title')}
          </Text>
          <Text style={[styles.riskVerdict, { color: risk.text, fontSize: fontSize.lg }]}>
            {tr(kind === 'scam' ? 'res.scam' : kind === 'suspicious' ? 'res.suspicious' : 'res.safe')}
          </Text>
          <Text style={[styles.riskSub, { fontSize: fontSize.xs }]}>
            {tr('res.confidence', { n: result.confidence })}
          </Text>
        </View>
      </View>
      <View style={styles.confTrack}>
        <View style={[styles.confFill, { width: `${result.confidence}%`, backgroundColor: risk.text }]} />
      </View>
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { fontSize: fontSize.xs }]}>{tr('res.indicators')}</Text>
        {result.indicators?.top_features?.length > 0 ? (
          result.indicators.top_features.map((label, i) => (
            <IndicatorRow key={`f${i}`} text={ind(label)} dot={isScam ? 'red' : 'green'} COLORS={COLORS} styles={styles} />
          ))
        ) : (
          <IndicatorRow text={isScam ? tr('res.noIndScam') : tr('res.noIndSafe')} dot={isScam ? 'red' : 'green'} COLORS={COLORS} styles={styles} />
        )}
      </View>
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { fontSize: fontSize.xs }]}>{tr(kind === 'scam' ? 'res.whyScam' : kind === 'suspicious' ? 'res.whySuspicious' : 'res.whySafe')}</Text>
        <View style={styles.whyBox}>
          <Text style={[styles.whyText, { fontSize: fontSize.sm }]}>{tr(kind === 'scam' ? 'res.explainScam' : kind === 'suspicious' ? 'res.explainSuspicious' : 'res.explainSafe', { n: result.risk_score ?? result.confidence })}</Text>
        </View>
      </View>
    </View>
  );
}
function IndicatorRow({ text, dot, tag, COLORS, styles }) {
  const dotColor = { red: COLORS.scam, amber: COLORS.suspicious, green: COLORS.safe }[dot];
  const tagColors = {
    phishing: { bg: COLORS.scamBg, text: COLORS.scam },
    urgency:  { bg: COLORS.scamBg, text: COLORS.scam },
    keyword:  { bg: COLORS.suspBg, text: COLORS.suspicious },
  };
  return (
    <View style={styles.indRow}>
      <View style={[styles.indDot, { backgroundColor: dotColor }]} />
      <Text style={styles.indText}>{text}</Text>
      {tag && (
        <View style={[styles.indTag, { backgroundColor: tagColors[tag]?.bg }]}>
          <Text style={[styles.indTagText, { color: tagColors[tag]?.text }]}>{tag}</Text>
        </View>
      )}
    </View>
  );
}
// ─── MAIN SCREEN ──────────────────────────────────────────────────────────────
export default function ScanScreen({ navigation }) {
  const { fontSize, simpleMode, lightMode, scanAlerts, autoScanPasteboard } = useApp();
  const { t: tr, copyLang } = useLang();
  const COLORS = getTheme(simpleMode, lightMode);
  const styles = makeStyles(COLORS);
  const [activeTab, setActiveTab]   = useState('message');
  const [inputText, setInputText]   = useState('');
  const [result, setResult]         = useState(null);
  const [loading, setLoading]       = useState(false);
  const scrollRef = useRef(null);
  const { suggestion, dismiss, accept } = usePasteboardSuggestion(autoScanPasteboard, inputText);

  // text/tab default to what is on screen; the pasteboard banner passes its own.
  const handleScan = async (textArg, tabArg) => {
    const text = typeof textArg === 'string' ? textArg : inputText;
    const tab  = typeof tabArg  === 'string' ? tabArg  : activeTab;
    const check = validateInput(tab, text);
    if (!check.ok) {
      Alert.alert(tr('scan.cannot'), check[copyLang]);
      return;
    }
    const cached = getScanned(text);
    if (cached) {
      setResult(cached);
      Alert.alert(tr('scan.alreadyTitle'), tr('scan.alreadyBody'));
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const data = await analyzeText(text);
      rememberScan(text, data);
      setResult(data);
      maybeShowScanAlert({
        enabled: scanAlerts, result: data, lang: copyLang,
        onReport: () => goToReport(navigation, { text: text.trim(), tab, result: data }),
        onLearn:  () => goToEducation(navigation, 'types'),
      });
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 300);
    } catch (e) {
      Alert.alert(tr('scan.errorTitle'), tr('scan.errorBody'));
    } finally {
      setLoading(false);
    }
  };
  // Any edit to the input makes the old result stale: clear it so the button goes back to SCAN.
  const onChangeInput = (txt) => {
    setInputText(txt);
    if (result) setResult(null);
  };
  const scanSuggestion = () => {
    const sug = accept();
    if (!sug) return;
    setActiveTab(sug.tab);
    setInputText(sug.text);
    handleScan(sug.text, sug.tab);
  };

  const scanAnother = () => { setInputText(''); setResult(null); };
  const reportIt = () => goToReport(navigation, { text: inputText.trim(), tab: activeTab, result });
  const flagged = isFlagged(result);
  const changeTab = (key) => {
    setActiveTab(key);
    setResult(null);
  };
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <PasteboardBanner
          suggestion={suggestion} COLORS={COLORS} fs={fontSize} lang={copyLang}
          onScan={scanSuggestion} onDismiss={dismiss}
        />
        {/* Headline */}
        <Text style={[styles.headline, { fontSize: fontSize.xxl }]}>
          {tr('scan.headline')}
        </Text>
        <Text style={[styles.subhead, { fontSize: fontSize.sm }]}>
          {tr('scan.subhead')}
        </Text>
        {/* Input type tabs */}
        <View style={styles.tabRow}>
          {INPUT_TABS.map(t => {
            const active = activeTab === t.key;
            return (
              <TouchableOpacity
                key={t.key}
                style={[styles.tabBtn, active && styles.tabBtnActive]}
                onPress={() => changeTab(t.key)}
                activeOpacity={0.8}
              >
                <Text style={styles.tabIcon}>{t.icon}</Text>
                <Text style={[styles.tabLabel, { color: active ? COLORS.primary : COLORS.muted }]}>
                  {tr('tab.' + t.key)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
        {/* Text Input */}
        <View style={styles.inputWrap}>
          <TextInput
            style={[styles.textInput, { fontSize: fontSize.base }]}
            multiline
            maxLength={MAX_CHARS}
            placeholder={tr('ph.' + activeTab)}
            placeholderTextColor={COLORS.hint}
            value={inputText}
            onChangeText={onChangeInput}
            textAlignVertical="top"
          />
          <Text style={[styles.charCount, { fontSize: fontSize.xs }]}>
            {inputText.length}/{MAX_CHARS}
          </Text>
        </View>
        {/* Scan Now button */}
        <TouchableOpacity
          style={[styles.scanBtn, loading && styles.scanBtnDisabled]}
          onPress={result ? scanAnother : () => handleScan()}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading
            ? <ActivityIndicator color="#FFFFFF" size="small" />
            : (
              <>
                <Text style={styles.scanBtnIcon}>{result ? '🔄' : '🛡️'}</Text>
                <Text style={[styles.scanBtnText, { fontSize: fontSize.base }]}>{result ? tr('scan.another') : tr('scan.now')}</Text>
              </>
            )
          }
        </TouchableOpacity>
        {/* Result */}
        <RiskBanner result={result} fontSize={fontSize} COLORS={COLORS} styles={styles} />
        {flagged && (
          <SuspiciousCard
            COLORS={COLORS}
            fs={fontSize}
            lang={copyLang}
            onReport={reportIt}
            onLearn={() => goToEducation(navigation, 'types')}
          />
        )}
        {result && !flagged && (
          <TouchableOpacity style={styles.reportBtn} onPress={reportIt} activeOpacity={0.8}>
            <Text style={[styles.reportBtnText, { fontSize: fontSize.sm }]}>
              {tr('scan.wrong')}
            </Text>
          </TouchableOpacity>
        )}
        {/* How it works */}
        <Text style={[styles.howTitle, { fontSize: fontSize.sm }]}>{tr('scan.how')}</Text>
        <View style={styles.stepsRow}>
          {STEPS.map(s => (
            <View key={s.num} style={styles.stepCard}>
              <View style={styles.stepIconWrap}>
                <Text style={styles.stepIcon}>{s.icon}</Text>
              </View>
              <Text style={[styles.stepTitle, { fontSize: fontSize.xs }]}>{s.num}. {tr('scan.step' + s.num)}</Text>
              <Text style={[styles.stepDesc, { fontSize: 10 }]}>{tr('scan.step' + s.num + 'd')}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
// ─── STYLES ───────────────────────────────────────────────────────────────────
const makeStyles = (COLORS) => StyleSheet.create({
  safe:    { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SPACING.lg, paddingBottom: SPACING.xxl },
  headline: { fontWeight: '800', color: COLORS.ink, lineHeight: 34, letterSpacing: -0.5 },
  subhead:  { color: COLORS.muted, marginTop: SPACING.sm, lineHeight: 20, marginBottom: SPACING.xl },
  tabRow: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.md },
  tabBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: RADIUS.pill, borderWidth: 1.5, borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  tabBtnActive: { borderColor: COLORS.primary, backgroundColor: COLORS.infoBg },
  tabIcon:      { fontSize: 13 },
  tabLabel:     { fontSize: 12, fontWeight: '700' },
  inputWrap: { marginBottom: SPACING.md },
  textInput: {
    backgroundColor: COLORS.surface, borderWidth: 1.5, borderColor: COLORS.border,
    borderRadius: RADIUS.lg, padding: SPACING.md, minHeight: 180,
    color: COLORS.ink, lineHeight: 22, ...SHADOW.card,
  },
  charCount: { color: COLORS.hint, textAlign: 'right', marginTop: 6 },
  scanBtn: {
    flexDirection: 'row', gap: 8, backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md, paddingVertical: 15,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: SPACING.lg, ...SHADOW.card,
  },
  scanBtnDisabled: { backgroundColor: COLORS.border2 },
  scanBtnIcon:     { fontSize: 16 },
  scanBtnText:     { color: '#FFFFFF', fontWeight: '800', letterSpacing: 0.5 },
  // Result Card
  riskBanner: {
    marginBottom: SPACING.md, borderRadius: RADIUS.lg, borderWidth: 1.5, overflow: 'hidden', ...SHADOW.card,
  },
  riskHeader:   { flexDirection: 'row', gap: 12, alignItems: 'center', padding: SPACING.md },
  riskIcon:     { width: 46, height: 46, borderRadius: 12, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  riskIconText: { fontWeight: '800' },
  riskLabel:    { fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase' },
  riskVerdict:  { fontWeight: '800', marginTop: 1 },
  riskSub:      { color: COLORS.muted, marginTop: 2 },
  confTrack:    { height: 4, backgroundColor: 'rgba(120,120,120,0.15)', marginHorizontal: SPACING.md },
  confFill:     { height: 4, borderRadius: 4 },
  section:      { padding: SPACING.md, paddingTop: SPACING.sm },
  sectionTitle: { fontWeight: '700', color: COLORS.muted, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: SPACING.sm },
  indRow:       { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 6 },
  indDot:       { width: 7, height: 7, borderRadius: 4, marginTop: 5 },
  indText:      { flex: 1, fontSize: 13, color: COLORS.ink, lineHeight: 20 },
  indTag:       { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginLeft: 4 },
  indTagText:   { fontSize: 9, fontWeight: '700' },
  whyBox:       { backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.sm, padding: SPACING.sm + 2 },
  whyText:      { color: COLORS.muted, lineHeight: 20 },
  reportBtn: {
    padding: SPACING.md, borderRadius: RADIUS.md, borderWidth: 1.5,
    borderColor: COLORS.border2, backgroundColor: COLORS.surface,
    alignItems: 'center', marginBottom: SPACING.lg,
  },
  reportBtnDone: { borderColor: COLORS.safeBorder, backgroundColor: COLORS.safeBg },
  reportBtnText: { color: COLORS.muted, fontWeight: '600' },
  // How it works
  howTitle: { color: COLORS.muted, fontWeight: '700', marginBottom: SPACING.sm },
  stepsRow: { flexDirection: 'row', gap: SPACING.sm },
  stepCard: {
    flex: 1, backgroundColor: COLORS.surface, borderRadius: RADIUS.md,
    borderWidth: 1.5, borderColor: COLORS.border, padding: SPACING.sm,
  },
  stepIconWrap: {
    width: 28, height: 28, borderRadius: 8, backgroundColor: COLORS.infoBg,
    alignItems: 'center', justifyContent: 'center', marginBottom: 6,
  },
  stepIcon:  { fontSize: 14 },
  stepTitle: { color: COLORS.ink, fontWeight: '700', marginBottom: 3 },
  stepDesc:  { color: COLORS.muted, lineHeight: 13 },
});