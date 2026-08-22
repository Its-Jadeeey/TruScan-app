// TruScan/FrontEnd/Screens/scanScreen.js
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
import { addReport }        from '../Service/firestoreService';
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
  { num: '1', title: 'Analyze', icon: '🤖', desc: 'We scan content using AI and rule-based engine.' },
  { num: '2', title: 'Detect',  icon: '🚩', desc: 'We identify scam patterns and risk indicators.' },
  { num: '3', title: 'Explain', icon: '🛡️', desc: 'You get a clear result with explanation and tips.' },
];

// ─── RESULT BANNER ─────────────────────────────────────────────────────────────

function RiskBanner({ result, fontSize, COLORS, styles }) {
  if (!result) return null;
  const risk = getRiskColors(result.prediction, COLORS);
  const icons = { scam: '⚠', suspicious: '!', safe: '✓' };
  const labels = { scam: 'SCAM DETECTED', suspicious: 'SUSPICIOUS', safe: 'LOOKS SAFE' };

  return (
    <View style={[styles.riskBanner, { backgroundColor: risk.bg, borderColor: risk.border }]}>
      <View style={styles.riskHeader}>
        <View style={[styles.riskIcon, { backgroundColor: risk.bg, borderColor: risk.border }]}>
          <Text style={[styles.riskIconText, { color: risk.text, fontSize: fontSize.md }]}>
            {icons[result.prediction]}
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.riskLabel, { color: risk.text, fontSize: fontSize.xs }]}>
            Analysis Result
          </Text>
          <Text style={[styles.riskVerdict, { color: risk.text, fontSize: fontSize.lg }]}>
            {labels[result.prediction]}
          </Text>
          <Text style={[styles.riskSub, { fontSize: fontSize.xs }]}>
            Confidence: {result.confidence}% •{' '}
            {result.source === 'ml_model' ? 'ML Model' : 'Keyword Engine'}
          </Text>
        </View>
      </View>

      <View style={styles.confTrack}>
        <View style={[styles.confFill, { width: `${result.confidence}%`, backgroundColor: risk.text }]} />
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { fontSize: fontSize.xs }]}>Detected Indicators</Text>
        {result.indicators?.domains?.map((d, i) => (
          <IndicatorRow key={`d${i}`} text={`Phishing domain: "${d}"`} dot="red" tag="phishing" COLORS={COLORS} styles={styles} />
        ))}
        {result.indicators?.urgency?.map((w, i) => (
          <IndicatorRow key={`u${i}`} text={`Urgency word: "${w}"`} dot="red" tag="urgency" COLORS={COLORS} styles={styles} />
        ))}
        {result.indicators?.keywords?.slice(0, 4).map((w, i) => (
          <IndicatorRow key={`k${i}`} text={`Keyword: "${w}"`} dot="amber" tag="keyword" COLORS={COLORS} styles={styles} />
        ))}
        {result.prediction === 'safe' && (
          <IndicatorRow text="Walang suspicious na indicators" dot="green" COLORS={COLORS} styles={styles} />
        )}
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { fontSize: fontSize.xs }]}>Bakit Scam Ito?</Text>
        <View style={styles.whyBox}>
          <Text style={[styles.whyText, { fontSize: fontSize.sm }]}>{buildWhyText(result)}</Text>
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

function buildWhyText(result) {
  if (result.prediction === 'safe') {
    return 'Walang suspicious na pattern ang nakita. Ang mensaheng ito ay mukhang lehitimo. Palaging mag-ingat — kapag may duda, makipag-ugnayan sa opisyal na channel.';
  }
  if (result.indicators?.domains?.length > 0) {
    return `Phishing URL detected: Ang "${result.indicators.domains[0]}" ay hindi official na domain. Huwag i-click ang link na ito.`;
  }
  if (result.indicators?.urgency?.length > 0) {
    return `Urgency pressure tactic: Ang salitang "${result.indicators.urgency[0]}" ay dinisenyo para mapilitan kang kumilos nang walang pag-iisip — classic manipulation technique ito.`;
  }
  return 'Multiple suspicious keywords ang natukoy. Huwag ibahagi ang iyong personal o financial na impormasyon sa sinumang nagpadala ng mensaheng ito.';
}

// ─── MAIN SCREEN ──────────────────────────────────────────────────────────────

export default function ScanScreen({ navigation }) {
  const { fontSize, simpleMode, lightMode } = useApp();
  const COLORS = getTheme(simpleMode, lightMode);
  const styles = makeStyles(COLORS);

  const [activeTab, setActiveTab]   = useState('message');
  const [inputText, setInputText]   = useState('');
  const [result, setResult]         = useState(null);
  const [loading, setLoading]       = useState(false);
  const [reported, setReported]     = useState(false);
  const scrollRef = useRef(null);

  const handleScan = async () => {
    if (!inputText.trim()) {
      Alert.alert('Walang laman', 'I-paste muna ang mensahe bago mag-scan.');
      return;
    }
    setLoading(true);
    setResult(null);
    setReported(false);
    try {
      const data = await analyzeText(inputText);
      setResult(data);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 300);
    } catch (e) {
      Alert.alert('Error', 'Hindi makapag-analyze. Subukan ulit.');
    } finally {
      setLoading(false);
    }
  };

  const handleReport = async () => {
    if (!result || reported) return;
    const res = await addReport({
      text: inputText, category: result.prediction,
      source: 'mobile_scan', mlPrediction: result,
    });
    if (res.success) {
      setReported(true);
      Alert.alert('Salamat!', 'Nai-report na ang mensahe sa community database.');
    } else {
      Alert.alert('Error', 'Hindi ma-save ang report. Subukan ulit.');
    }
  };

  const changeTab = (key) => {
    setActiveTab(key);
    setResult(null);
    setReported(false);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Top bar */}
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => navigation?.openDrawer?.()} activeOpacity={0.7} hitSlop={10}>
            <Text style={styles.menuIcon}>☰</Text>
          </TouchableOpacity>
        </View>

        {/* Headline */}
        <Text style={[styles.headline, { fontSize: fontSize.xxl }]}>
          Detect Scams.{'\n'}Protect Yourself.
        </Text>
        <Text style={[styles.subhead, { fontSize: fontSize.sm }]}>
          Paste any suspicious message, email or link and let TruScan analyze it for you.
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
                  {t.label}
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
            placeholder={PLACEHOLDERS[activeTab]}
            placeholderTextColor={COLORS.hint}
            value={inputText}
            onChangeText={setInputText}
            textAlignVertical="top"
          />
          <Text style={[styles.charCount, { fontSize: fontSize.xs }]}>
            {inputText.length}/{MAX_CHARS}
          </Text>
        </View>

        {/* Scan Now button */}
        <TouchableOpacity
          style={[styles.scanBtn, loading && styles.scanBtnDisabled]}
          onPress={handleScan}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading
            ? <ActivityIndicator color="#FFFFFF" size="small" />
            : (
              <>
                <Text style={styles.scanBtnIcon}>🛡️</Text>
                <Text style={[styles.scanBtnText, { fontSize: fontSize.base }]}>SCAN NOW</Text>
              </>
            )
          }
        </TouchableOpacity>

        {/* Result */}
        <RiskBanner result={result} fontSize={fontSize} COLORS={COLORS} styles={styles} />
        {result && (
          <TouchableOpacity
            style={[styles.reportBtn, reported && styles.reportBtnDone]}
            onPress={handleReport}
            disabled={reported}
            activeOpacity={0.8}
          >
            <Text style={[styles.reportBtnText, { fontSize: fontSize.sm }]}>
              {reported ? '✓ Nai-report na! Salamat.' : 'I-report sa Community Database'}
            </Text>
          </TouchableOpacity>
        )}

        {/* How it works */}
        <Text style={[styles.howTitle, { fontSize: fontSize.sm }]}>How it works</Text>
        <View style={styles.stepsRow}>
          {STEPS.map(s => (
            <View key={s.num} style={styles.stepCard}>
              <View style={styles.stepIconWrap}>
                <Text style={styles.stepIcon}>{s.icon}</Text>
              </View>
              <Text style={[styles.stepTitle, { fontSize: fontSize.xs }]}>{s.num}. {s.title}</Text>
              <Text style={[styles.stepDesc, { fontSize: 10 }]}>{s.desc}</Text>
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

  topBar:   { marginBottom: SPACING.md },
  menuIcon: { fontSize: 22, color: COLORS.ink, fontWeight: '700' },

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