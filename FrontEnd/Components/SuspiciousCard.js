// TruScan/FrontEnd/Components/SuspiciousCard.js
// Shown under a flagged result: recommends reporting (auto-filled) and the Education page.
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { RADIUS, SPACING } from '../Service/theme';

const COPY = {
  en: {
    title: 'This looks suspicious',
    body: 'We recommend reporting it so others stay safe. The report type and category will be filled in for you, and you can add a remark.',
    report: 'Report this',
    learn: 'Learn how to spot scams',
  },
  fil: {
    title: 'Kahina-hinala ito',
    body: 'Inirerekomenda naming i-report ito para maprotektahan ang iba. Awtomatikong mapupunan ang uri at kategorya, at maaari kang magdagdag ng remark.',
    report: 'I-report ito',
    learn: 'Alamin kung paano makilala ang scam',
  },
};

export default function SuspiciousCard({ COLORS, fs, lang = 'en', onReport, onLearn }) {
  const c = COPY[lang] || COPY.en;
  return (
    <View style={[styles.card, { backgroundColor: COLORS.surface, borderColor: COLORS.suspBorder || COLORS.border2 }]}>
      <Text style={[styles.title, { color: COLORS.ink, fontSize: fs.base }]}>⚠️  {c.title}</Text>
      <Text style={[styles.body, { color: COLORS.muted, fontSize: fs.xs }]}>{c.body}</Text>
      <TouchableOpacity style={[styles.primary, { backgroundColor: COLORS.primary }]} onPress={onReport} activeOpacity={0.85}>
        <Text style={[styles.primaryText, { fontSize: fs.sm }]}>📢  {c.report}</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.secondary, { borderColor: COLORS.border2 }]} onPress={onLearn} activeOpacity={0.8}>
        <Text style={[styles.secondaryText, { color: COLORS.ink, fontSize: fs.sm }]}>📖  {c.learn}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: RADIUS.lg, borderWidth: 1.5, padding: SPACING.md, marginTop: SPACING.sm, marginBottom: SPACING.md },
  title: { fontWeight: '800', marginBottom: 6 },
  body: { lineHeight: 18, marginBottom: SPACING.md },
  primary: { borderRadius: RADIUS.md, paddingVertical: 13, alignItems: 'center', marginBottom: SPACING.sm },
  primaryText: { color: '#FFFFFF', fontWeight: '800', letterSpacing: 0.3 },
  secondary: { borderRadius: RADIUS.md, paddingVertical: 12, alignItems: 'center', borderWidth: 1.5 },
  secondaryText: { fontWeight: '700' },
});