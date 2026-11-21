//// TruScan/FrontEnd/Components/PasteboardBanner.js
// "Copied text detected" suggestion bar shown at the top of the scan screens.
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { RADIUS, SPACING } from '../Service/theme';

const COPY = {
  en:  { title: 'Copied text detected', scan: 'Scan it', dismiss: 'Dismiss',
         tab: { message: 'Message', email: 'Email', link: 'Link' } },
  fil: { title: 'May nakopyang teksto', scan: 'Suriin', dismiss: 'Isara',
         tab: { message: 'Mensahe', email: 'Email', link: 'Link' } },
};

export default function PasteboardBanner({ suggestion, COLORS, fs, lang = 'en', onScan, onDismiss }) {
  if (!suggestion) return null;
  const c = COPY[lang] || COPY.en;
  const primary = COLORS.primary || COLORS.accentGreen || '#6C5CE7';
  const bg = COLORS.infoBg || COLORS.card || COLORS.surface;
  const preview = suggestion.text.length > 90 ? suggestion.text.slice(0, 90) + '…' : suggestion.text;
  return (
    <View style={[s.wrap, { backgroundColor: bg, borderColor: primary }]}>
      <Text style={[s.title, { color: COLORS.ink, fontSize: fs.sm }]}>
        📋 {c.title} · {c.tab[suggestion.tab]}
      </Text>
      <Text style={[s.preview, { color: COLORS.muted, fontSize: fs.xs }]} numberOfLines={2}>{preview}</Text>
      <View style={s.row}>
        <TouchableOpacity style={[s.btn, { backgroundColor: primary }]} onPress={onScan} activeOpacity={0.85}>
          <Text style={[s.btnText, { fontSize: fs.sm }]}>{c.scan}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.btn, s.ghost, { borderColor: COLORS.border2 }]} onPress={onDismiss} activeOpacity={0.85}>
          <Text style={[s.btnText, { color: COLORS.muted, fontSize: fs.sm }]}>{c.dismiss}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  wrap:    { borderWidth: 1.5, borderRadius: RADIUS.lg, padding: SPACING.md, marginBottom: SPACING.md },
  title:   { fontWeight: '800' },
  preview: { marginTop: 4, lineHeight: 18 },
  row:     { flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.sm },
  btn:     { flex: 1, paddingVertical: 10, borderRadius: RADIUS.md, alignItems: 'center' },
  ghost:   { backgroundColor: 'transparent', borderWidth: 1.5 },
  btnText: { color: '#FFFFFF', fontWeight: '800' },
});