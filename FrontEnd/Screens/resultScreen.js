// TruScan/FrontEnd/Screens/resultScreen.js
// Standalone Result screen — shown after a deep scan or when viewing a saved result.
// Receives `route.params.result` and `route.params.originalText` from navigation.

import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Share, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp }       from '../Context/AppContext';
import { addReport }    from '../Service/firestoreService';
import { COLORS, RADIUS, SPACING, SHADOW, getRiskColors } from '../Service/theme';

// ─── RISK LEVEL BAR ───────────────────────────────────────────────────────────

function RiskMeter({ confidence, prediction, fontSize }) {
  const risk = getRiskColors(prediction);
  const levels = [
    { label: 'Low',    max: 30,  color: COLORS.safe },
    { label: 'Medium', max: 60,  color: COLORS.suspicious },
    { label: 'High',   max: 100, color: COLORS.scam },
  ];

  return (
    <View style={styles.meterWrap}>
      <View style={styles.meterTrack}>
        {levels.map((l, i) => (
          <View
            key={i}
            style={[styles.meterSegment, {
              backgroundColor: confidence > (i === 0 ? 0 : levels[i - 1].max) ? l.color : COLORS.border,
              opacity: confidence >= (i === 0 ? 1 : levels[i - 1].max + 1) ? 1 : 0.25,
            }]}
          />
        ))}
      </View>
      <View style={styles.meterLabels}>
        {levels.map((l, i) => (
          <Text key={i} style={[styles.meterLabel, { fontSize: fontSize.xs, color: COLORS.muted }]}>
            {l.label}
          </Text>
        ))}
      </View>
      <Text style={[styles.meterValue, { fontSize: fontSize.xxl, color: risk.text }]}>
        {confidence}%
      </Text>
      <Text style={[styles.meterSub, { fontSize: fontSize.sm }]}>Confidence Score</Text>
    </View>
  );
}

// ─── DETAIL ROW ───────────────────────────────────────────────────────────────

function DetailRow({ icon, label, value, valueColor, fontSize }) {
  return (
    <View style={styles.detailRow}>
      <Text style={{ fontSize: fontSize.base }}>{icon}</Text>
      <View style={{ flex: 1 }}>
        <Text style={[styles.detailLabel, { fontSize: fontSize.xs }]}>{label}</Text>
        <Text style={[styles.detailValue, { fontSize: fontSize.sm, color: valueColor || COLORS.ink }]}>
          {value}
        </Text>
      </View>
    </View>
  );
}

// ─── MAIN SCREEN ──────────────────────────────────────────────────────────────

export default function ResultScreen({ route, navigation }) {
  const { fontSize } = useApp();
  const [reported, setReported] = useState(false);

  // Fallback mock result if navigated to directly (for testing)
  const result = route?.params?.result || {
    prediction:  'scam',
    confidence:  87,
    risk_level:  'HIGH',
    indicators:  { urgency: ['URGENT', '24 HOURS'], keywords: ['GCASH', 'WINNER'], domains: ['gcash-winner.xyz'] },
    source:      'ml_model',
  };
  const originalText = route?.params?.originalText || 'Sample scam message for testing.';

  const risk = getRiskColors(result.prediction);
  const icons   = { scam: '⚠', suspicious: '!', safe: '✓' };
  const labels  = { scam: 'SCAM DETECTED', suspicious: 'SUSPICIOUS', safe: 'LOOKS SAFE' };
  const advices = {
    scam: [
      'Huwag tumugon sa mensaheng ito.',
      'Huwag i-click ang anumang link.',
      'Huwag ibahagi ang personal o financial na impormasyon.',
      'I-report sa iyong telco provider at NBI Cybercrime.',
      'I-block ang numero o email address.',
    ],
    suspicious: [
      'Mag-ingat bago sumagot.',
      'I-verify ang identity ng nagpadala sa official channels.',
      'Huwag magpadala ng pera o personal na impormasyon.',
      'Kapag may duda, huwag ituloy ang transaksyon.',
    ],
    safe: [
      'Ang mensaheng ito ay mukhang lehitimo.',
      'Palaging mag-ingat — kapag may duda, i-verify.',
      'Kung inaasahan mo ang mensahe, maaaring ligtas.',
    ],
  };

  const handleReport = async () => {
    if (reported) return;
    const res = await addReport({
      text:         originalText,
      category:     result.prediction,
      source:       'result_screen',
      mlPrediction: result,
    });
    if (res.success) {
      setReported(true);
      Alert.alert('Salamat!', 'Nai-report ang mensahe sa community database.');
    } else {
      Alert.alert('Error', 'Hindi ma-save ang report. Subukan ulit.');
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `TruScan Result\n\nVerdict: ${labels[result.prediction]}\nConfidence: ${result.confidence}%\n\nAng mensaheng ito ay ${result.prediction === 'safe' ? 'ligtas' : 'kahina-hinala'}.\n\nMag-download ng TruScan para maprotektahan ang iyong sarili mula sa mga scam!`,
        title: 'TruScan Scan Result',
      });
    } catch (e) {}
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Nav Bar */}
      <View style={styles.navBar}>
        <TouchableOpacity onPress={() => navigation?.goBack()} activeOpacity={0.7}>
          <Text style={[styles.backBtn, { fontSize: fontSize.base }]}>← Back</Text>
        </TouchableOpacity>
        <Text style={[styles.navTitle, { fontSize: fontSize.base }]}>Scan Result</Text>
        <TouchableOpacity onPress={handleShare} activeOpacity={0.7}>
          <Text style={[styles.shareBtn, { fontSize: fontSize.base }]}>Share</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Hero Verdict */}
        <View style={[styles.heroCard, { backgroundColor: risk.bg, borderColor: risk.border }]}>
          <Text style={[styles.heroIcon, { color: risk.text, fontSize: fontSize.xxl + 10 }]}>
            {icons[result.prediction]}
          </Text>
          <Text style={[styles.heroVerdict, { color: risk.text, fontSize: fontSize.xl }]}>
            {labels[result.prediction]}
          </Text>
          <Text style={[styles.heroRisk, { color: risk.text, fontSize: fontSize.xs }]}>
            Risk Level: {result.risk_level || 'UNKNOWN'} •{' '}
            {result.source === 'ml_model' ? 'ML Model' : 'Keyword Engine'}
          </Text>
        </View>

        {/* Confidence Meter */}
        <View style={[styles.card, SHADOW.card]}>
          <RiskMeter confidence={result.confidence} prediction={result.prediction} fontSize={fontSize} />
        </View>

        {/* Details */}
        <View style={[styles.card, SHADOW.card]}>
          <Text style={[styles.cardTitle, { fontSize: fontSize.xs }]}>ANALYSIS BREAKDOWN</Text>
          <DetailRow
            icon="🎯"
            label="Verdict"
            value={labels[result.prediction]}
            valueColor={risk.text}
            fontSize={fontSize}
          />
          {result.indicators?.domains?.length > 0 && (
            <DetailRow
              icon="🔗"
              label="Phishing Domains"
              value={result.indicators.domains.join(', ')}
              valueColor={COLORS.scam}
              fontSize={fontSize}
            />
          )}
          {result.indicators?.urgency?.length > 0 && (
            <DetailRow
              icon="⏰"
              label="Urgency Words"
              value={result.indicators.urgency.join(', ')}
              valueColor={COLORS.suspicious}
              fontSize={fontSize}
            />
          )}
          {result.indicators?.keywords?.length > 0 && (
            <DetailRow
              icon="🔑"
              label="Flagged Keywords"
              value={result.indicators.keywords.slice(0, 5).join(', ')}
              valueColor={COLORS.suspicious}
              fontSize={fontSize}
            />
          )}
        </View>

        {/* Original Message */}
        <View style={[styles.card, SHADOW.card]}>
          <Text style={[styles.cardTitle, { fontSize: fontSize.xs }]}>SINABI SA MENSAHE</Text>
          <View style={styles.msgBox}>
            <Text style={[styles.msgText, { fontSize: fontSize.sm }]} selectable>
              {originalText}
            </Text>
          </View>
        </View>

        {/* What to do */}
        <View style={[styles.card, SHADOW.card]}>
          <Text style={[styles.cardTitle, { fontSize: fontSize.xs }]}>ANO ANG GAGAWIN?</Text>
          {advices[result.prediction].map((a, i) => (
            <View key={i} style={styles.adviceRow}>
              <View style={[styles.adviceDot, { backgroundColor: risk.text }]} />
              <Text style={[styles.adviceText, { fontSize: fontSize.sm }]}>{a}</Text>
            </View>
          ))}
        </View>

        {/* Action Buttons */}
        <TouchableOpacity
          style={[styles.reportBtn, reported && styles.reportBtnDone]}
          onPress={handleReport}
          disabled={reported}
          activeOpacity={0.85}
        >
          <Text style={[styles.reportBtnText, { fontSize: fontSize.base }]}>
            {reported ? '✓ Nai-report na! Salamat sa komunidad.' : 'I-report sa Community Database'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.scanAgainBtn}
          onPress={() => navigation?.goBack()}
          activeOpacity={0.8}
        >
          <Text style={[styles.scanAgainText, { fontSize: fontSize.base }]}>Mag-scan ng bago</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── STYLES ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SPACING.lg, paddingBottom: 80 },

  navBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
    backgroundColor: COLORS.background,
  },
  backBtn:   { color: COLORS.primary, fontWeight: '600' },
  navTitle:  { fontWeight: '800', color: COLORS.ink },
  shareBtn:  { color: COLORS.primary, fontWeight: '600' },

  heroCard: {
    borderRadius: RADIUS.lg, borderWidth: 1.5,
    padding: SPACING.xl, alignItems: 'center', marginBottom: SPACING.md,
  },
  heroIcon:    { fontWeight: '800', marginBottom: SPACING.sm },
  heroVerdict: { fontWeight: '800', textAlign: 'center' },
  heroRisk:    { fontWeight: '600', marginTop: 4, textTransform: 'uppercase', letterSpacing: 0.5 },

  card: {
    backgroundColor: COLORS.surface, borderRadius: RADIUS.lg,
    borderWidth: 1.5, borderColor: COLORS.border,
    padding: SPACING.md, marginBottom: SPACING.md,
  },
  cardTitle: {
    fontWeight: '700', color: COLORS.muted, letterSpacing: 0.5,
    textTransform: 'uppercase', marginBottom: SPACING.sm,
  },

  meterWrap:    { alignItems: 'center', paddingVertical: SPACING.sm },
  meterTrack:   { flexDirection: 'row', gap: 4, width: '100%', height: 8, marginBottom: 4 },
  meterSegment: { flex: 1, borderRadius: 4 },
  meterLabels:  { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: SPACING.md },
  meterLabel:   { fontWeight: '600' },
  meterValue:   { fontWeight: '800', marginTop: 4 },
  meterSub:     { color: COLORS.muted, marginTop: 2 },

  detailRow:   {
    flexDirection: 'row', gap: SPACING.sm, paddingVertical: SPACING.sm,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  detailLabel: { color: COLORS.muted, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.3 },
  detailValue: { fontWeight: '600', marginTop: 2 },

  msgBox:  {
    backgroundColor: COLORS.card, borderRadius: RADIUS.sm,
    borderWidth: 1, borderColor: COLORS.border, padding: SPACING.sm,
  },
  msgText: { color: COLORS.ink, lineHeight: 20 },

  adviceRow:   { flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.sm, paddingVertical: 5 },
  adviceDot:   { width: 7, height: 7, borderRadius: 4, marginTop: 6 },
  adviceText:  { flex: 1, color: COLORS.ink, lineHeight: 20 },

  reportBtn:     {
    backgroundColor: COLORS.primary, borderRadius: RADIUS.md,
    padding: SPACING.md, alignItems: 'center', marginBottom: SPACING.sm, ...SHADOW.card,
  },
  reportBtnDone: { backgroundColor: COLORS.safe },
  reportBtnText: { color: '#FFF', fontWeight: '700' },

  scanAgainBtn: {
    borderRadius: RADIUS.md, padding: SPACING.md, alignItems: 'center',
    borderWidth: 1.5, borderColor: COLORS.border, backgroundColor: COLORS.surface,
  },
  scanAgainText: { color: COLORS.muted, fontWeight: '600' },
});