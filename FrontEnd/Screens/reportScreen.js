// TruScan/FrontEnd/Screens/reportScreen.js
// "Report a Scam" form — type + category dropdowns, message field, submit toast.
// Re-themes to light or dark based on Light Mode.

import React, { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, Modal, FlatList, Animated, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp }    from '../Context/AppContext';
import { addReport } from '../Service/firestoreService';
import { getTheme, RADIUS, SPACING, SHADOW } from '../Service/theme';

const MAX_CHARS = 5000;

const TYPES = [
  { key: 'sms',   label: 'SMS Messages' },
  { key: 'email', label: 'Email Extensions' },
  { key: 'url',   label: 'URL/ Website Links' },
];

const CATEGORIES = [
  { key: 'financial',    label: 'Financial & eWallet' },
  { key: 'government',   label: 'Government Impersonation' },
  { key: 'delivery',     label: 'Delivery Courier' },
  { key: 'job',          label: 'Job Task' },
  { key: 'lottery',      label: 'Lottery Prize' },
  { key: 'shopping',     label: 'Online Shopping' },
  { key: 'investment',   label: 'Investment' },
  { key: 'phishing',     label: 'Phishing Link' },
  { key: 'smishing',     label: 'Smishing SMS' },
  { key: 'romance',      label: 'Romance' },
  { key: 'impersonation',label: 'Personal Impersonation' },
  { key: 'loan',         label: 'Online Loan' },
  { key: 'travel',       label: 'Travel Accommodation' },
  { key: 'simswap',      label: 'SIM Swap' },
  { key: 'charity',      label: 'Charity Donations' },
];

// ─── DROPDOWN ─────────────────────────────────────────────────────────────────

function Dropdown({ label, placeholder, value, options, onSelect, fontSize, COLORS, styles }) {
  const [open, setOpen] = useState(false);
  const selected = options.find(o => o.key === value);

  return (
    <View style={styles.fieldWrap}>
      <Text style={[styles.fieldLabel, { fontSize: fontSize.xs }]}>{label}</Text>
      <TouchableOpacity
        style={styles.dropdownBtn}
        onPress={() => setOpen(true)}
        activeOpacity={0.8}
      >
        <Text style={[
          styles.dropdownText,
          { fontSize: fontSize.sm, color: selected ? COLORS.ink : COLORS.hint },
        ]}>
          {selected ? selected.label : placeholder}
        </Text>
        <Text style={styles.dropdownChevron}>⌄</Text>
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setOpen(false)}>
          <View style={styles.modalSheet}>
            <Text style={[styles.modalTitle, { fontSize: fontSize.sm }]}>{label}</Text>
            <FlatList
              data={options}
              keyExtractor={o => o.key}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.optionRow, value === item.key && styles.optionRowActive]}
                  onPress={() => { onSelect(item.key); setOpen(false); }}
                  activeOpacity={0.7}
                >
                  <Text style={[
                    styles.optionText,
                    { fontSize: fontSize.sm, color: value === item.key ? COLORS.primary : COLORS.ink },
                  ]}>
                    {item.label.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

// ─── SUBMIT TOAST ─────────────────────────────────────────────────────────────

function useToast() {
  const opacity = useRef(new Animated.Value(0)).current;
  const [visible, setVisible] = useState(false);

  const show = () => {
    setVisible(true);
    Animated.sequence([
      Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.delay(1600),
      Animated.timing(opacity, { toValue: 0, duration: 250, useNativeDriver: true }),
    ]).start(() => setVisible(false));
  };

  return { visible, opacity, show };
}

// ─── MAIN SCREEN ──────────────────────────────────────────────────────────────

export default function ReportScreen({ navigation }) {
  const { fontSize, simpleMode, lightMode } = useApp();
  const COLORS = getTheme(simpleMode, lightMode);
  const styles = makeStyles(COLORS);

  const [type, setType]         = useState(null);
  const [category, setCategory] = useState(null);
  const [text, setText]         = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors]     = useState({});
  const toast = useToast();

  const validate = () => {
    const e = {};
    if (!type) e.type = true;
    if (!text.trim()) e.text = true;
    if (!category) e.category = true;
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSubmitting(true);
    const res = await addReport({
      text,
      category: 'scam',
      type,
      scamCategory: category,
      source: 'report_form',
    });
    setSubmitting(false);
    if (res.success) {
      toast.show();
      setType(null);
      setCategory(null);
      setText('');
      setErrors({});
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        {navigation?.canGoBack?.() && (
          <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.7} hitSlop={10}>
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>
        )}
        <Text style={[styles.headerTitle, { fontSize: fontSize.sm }]}>REPORT A SCAM</Text>
        <View style={{ width: 20 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Type */}
        <Dropdown
          label="TYPE"
          placeholder="Select type"
          value={type}
          options={TYPES}
          onSelect={setType}
          fontSize={fontSize}
          COLORS={COLORS}
          styles={styles}
        />
        {errors.type && <Text style={styles.errorText}>Please select a type.</Text>}

        {/* Message */}
        <View style={styles.fieldWrap}>
          <Text style={[styles.fieldLabel, { fontSize: fontSize.xs }]}>MESSAGE/CONTENT</Text>
          <View style={styles.textAreaWrap}>
            <TextInput
              style={[styles.textArea, { fontSize: fontSize.base }]}
              multiline
              maxLength={MAX_CHARS}
              placeholder="Paste your message here..."
              placeholderTextColor={COLORS.hint}
              value={text}
              onChangeText={setText}
              textAlignVertical="top"
            />
            <Text style={[styles.charCount, { fontSize: fontSize.xs }]}>
              {text.length}/{MAX_CHARS}
            </Text>
          </View>
          {errors.text && <Text style={styles.errorText}>Message can't be empty.</Text>}
        </View>

        {/* Category */}
        <Dropdown
          label="CATEGORY"
          placeholder="Select category"
          value={category}
          options={CATEGORIES}
          onSelect={setCategory}
          fontSize={fontSize}
          COLORS={COLORS}
          styles={styles}
        />
        {errors.category && <Text style={styles.errorText}>Please select a category.</Text>}

        {/* Submit */}
        <TouchableOpacity
          style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={submitting}
          activeOpacity={0.85}
        >
          {submitting
            ? <ActivityIndicator color="#FFFFFF" size="small" />
            : <Text style={[styles.submitBtnText, { fontSize: fontSize.base }]}>SUBMIT REPORT</Text>
          }
        </TouchableOpacity>

        {/* Footer note */}
        <View style={styles.footerNote}>
          <View style={styles.footerIconWrap}>
            <Text style={styles.footerIcon}>🛡️</Text>
          </View>
          <Text style={[styles.footerText, { fontSize: fontSize.xs }]}>
            Your report helps keep others safe.{'\n'}Thank you!
          </Text>
        </View>
      </ScrollView>

      {/* Submit toast */}
      {toast.visible && (
        <Animated.View style={[styles.toast, { opacity: toast.opacity }]}>
          <Text style={[styles.toastText, { fontSize: fontSize.sm }]}>REPORT SUBMITTED!</Text>
        </Animated.View>
      )}
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

  content: { padding: SPACING.lg, paddingBottom: SPACING.xxl },

  fieldWrap:  { marginBottom: SPACING.md },
  fieldLabel: {
    color: COLORS.muted, fontWeight: '700', letterSpacing: 0.5,
    textTransform: 'uppercase', marginBottom: SPACING.sm,
  },

  dropdownBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: COLORS.surface, borderWidth: 1.5, borderColor: COLORS.border,
    borderRadius: RADIUS.md, paddingHorizontal: SPACING.md, paddingVertical: 13,
  },
  dropdownText:    { fontWeight: '500' },
  dropdownChevron: { color: COLORS.muted, fontSize: 18, fontWeight: '700' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: COLORS.surface, borderTopLeftRadius: RADIUS.lg, borderTopRightRadius: RADIUS.lg,
    borderTopWidth: 1.5, borderColor: COLORS.border, padding: SPACING.lg, maxHeight: '75%',
  },
  modalTitle: {
    color: COLORS.muted, fontWeight: '700', letterSpacing: 0.5,
    textTransform: 'uppercase', marginBottom: SPACING.sm,
  },
  optionRow: {
    paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  optionRowActive: { backgroundColor: COLORS.infoBg, borderRadius: RADIUS.sm, paddingHorizontal: SPACING.sm },
  optionText: { fontWeight: '600' },

  textAreaWrap: {
    backgroundColor: COLORS.surface, borderWidth: 1.5, borderColor: COLORS.border,
    borderRadius: RADIUS.md, padding: SPACING.md, minHeight: 190, ...SHADOW.card,
  },
  textArea:  { color: COLORS.ink, lineHeight: 22, flex: 1 },
  charCount: { color: COLORS.hint, textAlign: 'right', marginTop: 6 },

  errorText: { color: COLORS.scam, fontSize: 11, fontWeight: '600', marginTop: -SPACING.sm, marginBottom: SPACING.sm },

  submitBtn: {
    backgroundColor: COLORS.primary, borderRadius: RADIUS.md, paddingVertical: 15,
    alignItems: 'center', justifyContent: 'center', marginTop: SPACING.sm, ...SHADOW.card,
  },
  submitBtnDisabled: { backgroundColor: COLORS.border2 },
  submitBtnText:     { color: '#FFFFFF', fontWeight: '800', letterSpacing: 0.5 },

  footerNote: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
    marginTop: SPACING.lg, paddingTop: SPACING.md,
  },
  footerIconWrap: {
    width: 34, height: 34, borderRadius: 10, backgroundColor: COLORS.infoBg,
    borderWidth: 1.5, borderColor: COLORS.infoBorder,
    alignItems: 'center', justifyContent: 'center',
  },
  footerIcon: { fontSize: 15 },
  footerText: { color: COLORS.muted, lineHeight: 16, flex: 1 },

  toast: {
    position: 'absolute', top: 60, alignSelf: 'center',
    backgroundColor: COLORS.surface, borderWidth: 1.5, borderColor: COLORS.border2,
    borderRadius: RADIUS.md, paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm + 2,
    ...SHADOW.card,
  },
  toastText: { color: COLORS.ink, fontWeight: '800', letterSpacing: 0.5 },
});