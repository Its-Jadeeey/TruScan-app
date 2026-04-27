// TruScan/FrontEnd/Screens/scanScreen.js
// Main scan screen — user pastes SMS/email/URL and gets a risk assessment

import React, { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, ActivityIndicator, Animated, Alert, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp }           from '../Context/AppContext';
import { analyzeText }      from '../Service/analyzeService';
import { addReport }        from '../Service/firestoreService';
import { COLORS, RADIUS, SPACING, SHADOW, getRiskColors } from '../Service/theme';

// ─── SAMPLE MESSAGES ──────────────────────────────────────────────────────────
const SAMPLES = [
  {
    label: 'GCash Scam',
    type: 'danger',
    text: 'GCASH NOTICE: Mahal na GCash user, NANALO ka ng P50,000.00 sa aming Anniversary Promo! I-CLAIM na agad bago pa mag-EXPIRE bukas! Pumunta sa: gcash-winner.xyz/claim — URGENT: 24 hours ka lang!',
  },
  {
    label: 'SSS Phish',
    type: 'danger',
    text: 'SSS OFFICIAL: Ang iyong SSS account ay naka-HOLD. I-update AGAD sa: sss-update-ph.com/verify — Kapag hindi ma-update sa 24 hours, PERMANENT matatapos ang iyong benepisyo.',
  },
  {
    label: 'LBC Parcel',
    type: 'danger',
    text: 'LBC Express Alert: Package (Tracking #PH8472019) naka-hold sa customs. Bayaran ang P150 customs fee: lbc-parcel-ph.net/pay — Valid 48hrs only.',
  },
  {
    label: 'Safe Message',
    type: 'safe',
    text: 'Hi! Kumain ka na ba? Haha anyway, huwag kalimutan yung meeting natin bukas 3pm sa Starbucks BGC. Dalhin mo yung mga docs. See you!',
  },
];

// ─── SUB-COMPONENTS ───────────────────────────────────────────────────────────

function RiskBanner({ result, fontSize }) {
  if (!result) return null;
  const risk = getRiskColors(result.prediction);
  const icons = { scam: '⚠', suspicious: '!', safe: '✓' };
  const labels = { scam: 'SCAM DETECTED', suspicious: 'SUSPICIOUS', safe: 'LOOKS SAFE' };

  return (
    <View style={[styles.riskBanner, { backgroundColor: risk.bg, borderColor: risk.border }]}>
      {/* Risk Header */}
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

      {/* Confidence Bar */}
      <View style={styles.confTrack}>
        <View
          style={[styles.confFill, {
            width: `${result.confidence}%`,
            backgroundColor: risk.text,
          }]}
        />
      </View>

      {/* Indicators */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { fontSize: fontSize.xs }]}>Detected Indicators</Text>
        {result.indicators?.domains?.map((d, i) => (
          <IndicatorRow key={i} text={`Phishing domain: "${d}"`} dot="red" tag="phishing" />
        ))}
        {result.indicators?.urgency?.map((w, i) => (
          <IndicatorRow key={i} text={`Urgency word: "${w}"`} dot="red" tag="urgency" />
        ))}
        {result.indicators?.keywords?.slice(0, 4).map((w, i) => (
          <IndicatorRow key={i} text={`Keyword: "${w}"`} dot="amber" tag="keyword" />
        ))}
        {result.prediction === 'safe' && (
          <IndicatorRow text="Walang suspicious na indicators" dot="green" />
        )}
      </View>

      {/* Explanation */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { fontSize: fontSize.xs }]}>Bakit Scam Ito?</Text>
        <View style={styles.whyBox}>
          <Text style={[styles.whyText, { fontSize: fontSize.sm }]}>
            {buildWhyText(result)}
          </Text>
        </View>
      </View>
    </View>
  );
}

function IndicatorRow({ text, dot, tag }) {
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

export default function ScanScreen() {
  const { simpleMode, fontSize } = useApp();
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

  const handleClear = () => {
    setInputText('');
    setResult(null);
    setReported(false);
  };

  const handleReport = async () => {
    if (!result || reported) return;
    const res = await addReport({
      text:         inputText,
      category:     result.prediction,
      source:       'mobile_scan',
      mlPrediction: result,
    });
    if (res.success) {
      setReported(true);
      Alert.alert('Salamat!', 'Nai-report na ang mensahe sa community database.');
    } else {
      Alert.alert('Error', 'Hindi ma-save ang report. Subukan ulit.');
    }
  };

  const loadSample = (sample) => {
    setInputText(sample.text);
    setResult(null);
    setReported(false);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.brandName, { fontSize: fontSize.xl }]}>
            Tru<Text style={styles.brandAccent}>Scan</Text>
          </Text>
          <Text style={[styles.tagline, { fontSize: fontSize.xs }]}>
            Filipino Scam Detector
          </Text>
        </View>

        {/* Simple Mode Banner */}
        {simpleMode && result && (
          <View style={[styles.simpleBanner, {
            backgroundColor: getRiskColors(result.prediction).bg,
            borderColor: getRiskColors(result.prediction).border,
          }]}>
            <Text style={[styles.simpleBannerText, {
              color: getRiskColors(result.prediction).text,
              fontSize: fontSize.md,
            }]}>
              {result.prediction === 'scam'
                ? '⚠ SCAM ITO! Huwag tumugon!'
                : result.prediction === 'suspicious'
                ? '⚡ Mag-ingat sa mensaheng ito.'
                : '✓ Mukhang ligtas ang mensahe.'}
            </Text>
          </View>
        )}

        {/* Input Label */}
        <Text style={[styles.inputLabel, { fontSize: fontSize.xs }]}>
          I-PASTE ANG SMS, EMAIL, O URL
        </Text>

        {/* Text Input */}
        <TextInput
          style={[styles.textInput, { fontSize: fontSize.base }]}
          multiline
          placeholder="I-paste ang kahina-hinalang mensahe dito..."
          placeholderTextColor={COLORS.hint}
          value={inputText}
          onChangeText={setInputText}
          textAlignVertical="top"
        />

        {/* Action Buttons */}
        <View style={styles.btnRow}>
          <TouchableOpacity
            style={[styles.btnPrimary, loading && styles.btnDisabled]}
            onPress={handleScan}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading
              ? <ActivityIndicator color="#FFFFFF" size="small" />
              : <Text style={[styles.btnPrimaryText, { fontSize: fontSize.base }]}>
                  Scan Now
                </Text>
            }
          </TouchableOpacity>
          <TouchableOpacity style={styles.btnGhost} onPress={handleClear} activeOpacity={0.7}>
            <Text style={[styles.btnGhostText, { fontSize: fontSize.base }]}>Clear</Text>
          </TouchableOpacity>
        </View>

        {/* Sample Chips — hidden in Simple Mode */}
        {!simpleMode && (
          <View style={styles.samplesSection}>
            <Text style={[styles.inputLabel, { fontSize: fontSize.xs }]}>SUBUKAN ANG SAMPLE</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsRow}>
              {SAMPLES.map((s, i) => (
                <TouchableOpacity
                  key={i}
                  style={[styles.chip, s.type === 'danger' ? styles.chipDanger : styles.chipSafe]}
                  onPress={() => loadSample(s)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.chipText,
                    { color: s.type === 'danger' ? COLORS.scam : COLORS.safe }
                  ]}>
                    {s.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Result Card */}
        <RiskBanner result={result} fontSize={fontSize} />

        {/* Report Button */}
        {result && (
          <TouchableOpacity
            style={[styles.reportBtn, reported && styles.reportBtnDone]}
            onPress={handleReport}
            disabled={reported}
            activeOpacity={0.8}
          >
            <Text style={[styles.reportBtnText, { fontSize: fontSize.sm }]}>
              {reported
                ? '✓ Nai-report na! Salamat.'
                : 'I-report sa Community Database'}
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── STYLES ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: COLORS.background },
  scroll:  { flex: 1 },
  content: { padding: SPACING.lg, paddingBottom: SPACING.xxl },

  header:      { marginBottom: SPACING.lg },
  brandName:   { fontWeight: '800', color: COLORS.ink, letterSpacing: -0.5 },
  brandAccent: { color: COLORS.primary },
  tagline:     { color: COLORS.muted, marginTop: 2, fontWeight: '500', letterSpacing: 0.5 },

  simpleBanner: {
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    marginBottom: SPACING.md,
    alignItems: 'center',
  },
  simpleBannerText: { fontWeight: '700', textAlign: 'center' },

  inputLabel: {
    fontWeight: '700',
    color: COLORS.muted,
    letterSpacing: 0.5,
    marginBottom: SPACING.sm,
    textTransform: 'uppercase',
  },
  textInput: {
    backgroundColor: COLORS.surface,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    minHeight: 110,
    color: COLORS.ink,
    lineHeight: 22,
    ...SHADOW.card,
  },
  btnRow:        { flexDirection: 'row', gap: 10, marginTop: SPACING.sm },
  btnPrimary:    {
    flex: 1,
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOW.card,
  },
  btnPrimaryText: { color: '#FFFFFF', fontWeight: '700' },
  btnDisabled:   { backgroundColor: COLORS.border2 },
  btnGhost:      {
    paddingHorizontal: SPACING.lg,
    paddingVertical: 13,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    borderColor: COLORS.border2,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnGhostText: { color: COLORS.muted, fontWeight: '600' },

  samplesSection: { marginTop: SPACING.md },
  chipsRow:       { marginTop: SPACING.sm },
  chip:           {
    paddingHorizontal: 13,
    paddingVertical: 6,
    borderRadius: RADIUS.pill,
    borderWidth: 1.5,
    marginRight: SPACING.sm,
  },
  chipDanger: { backgroundColor: COLORS.scamBg, borderColor: COLORS.scamBorder },
  chipSafe:   { backgroundColor: COLORS.safeBg, borderColor: COLORS.safeBorder },
  chipText:   { fontSize: 11, fontWeight: '700' },

  // Result Card
  riskBanner: {
    marginTop: SPACING.md,
    borderRadius: RADIUS.lg,
    borderWidth: 1.5,
    overflow: 'hidden',
    ...SHADOW.card,
  },
  riskHeader:   { flexDirection: 'row', gap: 12, alignItems: 'center', padding: SPACING.md },
  riskIcon:     {
    width: 46, height: 46, borderRadius: 12,
    borderWidth: 1.5, alignItems: 'center', justifyContent: 'center',
  },
  riskIconText: { fontWeight: '800' },
  riskLabel:    { fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase' },
  riskVerdict:  { fontWeight: '800', marginTop: 1 },
  riskSub:      { color: COLORS.muted, marginTop: 2 },

  confTrack: { height: 4, backgroundColor: 'rgba(0,0,0,0.08)', marginHorizontal: SPACING.md },
  confFill:  { height: 4, borderRadius: 4 },

  section:      { padding: SPACING.md, paddingTop: SPACING.sm },
  sectionTitle: {
    fontWeight: '700', color: COLORS.muted, letterSpacing: 0.5,
    textTransform: 'uppercase', marginBottom: SPACING.sm,
  },
  indRow:     { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 6 },
  indDot:     { width: 7, height: 7, borderRadius: 4, marginTop: 5 },
  indText:    { flex: 1, fontSize: 13, color: COLORS.ink, lineHeight: 20 },
  indTag:     { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginLeft: 4 },
  indTagText: { fontSize: 9, fontWeight: '700' },

  whyBox:  {
    backgroundColor: COLORS.card,
    borderWidth: 1, borderColor: COLORS.border,
    borderRadius: RADIUS.sm, padding: SPACING.sm + 2,
  },
  whyText: { color: COLORS.muted, lineHeight: 20 },

  reportBtn: {
    marginTop: SPACING.md,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    borderColor: COLORS.border2,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
  },
  reportBtnDone: { borderColor: COLORS.safeBorder, backgroundColor: COLORS.safeBg },
  reportBtnText: { color: COLORS.muted, fontWeight: '600' },
});