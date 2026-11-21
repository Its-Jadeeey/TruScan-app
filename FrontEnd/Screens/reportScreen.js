// "Report a Scam" form — type + category dropdowns, message field, submit toast.
// Re-themes to light or dark based on Light Mode.
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, Modal, FlatList, Animated, ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ScreenHeader from '../Components/ScreenHeader';
import Chevron from '../Components/Chevron';
import { useApp }    from '../Context/AppContext';
import { addReport } from '../Service/reportService';
import { useLang } from '../Service/i18n';
import { getTheme, RADIUS, SPACING, SHADOW } from '../Service/theme';
const MAX_CHARS = 5000;
const TYPE_DEFS = [
  { key: 'sms',   label: 'SMS Messages' },
  { key: 'email', label: 'Email Extensions' },
  { key: 'url',   label: 'URL/ Website Links' },
];
const CAT_DEFS = [
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
        <Chevron direction="down" color={COLORS.muted} />
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
      Animated.delay(2000),
      Animated.timing(opacity, { toValue: 0, duration: 250, useNativeDriver: true }),
    ]).start(() => setVisible(false));
  };
  return { visible, opacity, show };
}
// ─── MAIN SCREEN ──────────────────────────────────────────────────────────────
export default function ReportScreen({ navigation, route }) {
  const { fontSize, simpleMode, lightMode } = useApp();
  const { t: tr } = useLang();
  const typeOptions = TYPE_DEFS.map(o => ({ key: o.key, label: tr('type.' + o.key) }));
  const catOptions  = CAT_DEFS.map(o => ({ key: o.key, label: tr('cat.' + o.key) }));
  const COLORS = getTheme(simpleMode, lightMode);
  const styles = makeStyles(COLORS);
  const [type, setType]         = useState(null);
  const [category, setCategory] = useState(null);
  const [text, setText]         = useState('');
  const [remark, setRemark]     = useState('');
  const [prefill, setPrefill]   = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors]     = useState({});
  const toast = useToast();
  // Clear the whole form (also used when leaving the page, so it is fresh next time)
  const resetForm = () => {
    setType(null);
    setCategory(null);
    setText('');
    setRemark('');
    setPrefill(null);
    setErrors({});
  };
  useFocusEffect(useCallback(() => () => resetForm(), []));
  // Pre-fill from a scan result (sent by the Scan / Simple Mode screens)
  useEffect(() => {
    const p = route?.params?.prefill;
    if (!p) return;
    setPrefill(p);
    setType(p.type || null);
    setCategory(p.category || null);
    setText(p.text || '');
    setRemark('');
    setErrors({});
    navigation?.setParams?.({ prefill: undefined });
  }, [route?.params?.nonce]);
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
    channel: { sms: 'sms', email: 'email', url: 'link' }[type] || 'sms',
    type,
    scamCategory: category,
    remark,
    mode: simpleMode ? 'simple' : 'normal',
    source: prefill ? 'scan_recommendation' : 'report_form',
  });
  setSubmitting(false);
  if (res.success) {
    toast.show();
    resetForm();
  } else if (res.duplicate) {
    Alert.alert(tr('rep.dupTitle'), tr('rep.dupBody'));
  } else if (res.rateLimited) {
    Alert.alert(tr('rep.rateTitle'), tr('rep.rateBody'));
  } else {
    Alert.alert(tr('rep.errTitle'), tr('rep.errBody'));
  }
};
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <ScreenHeader title={tr('rep.header')} navigation={navigation} COLORS={COLORS} fontSize={fontSize} />
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {prefill && (
          <View style={styles.prefillNote}>
            <Text style={[styles.prefillText, { fontSize: fontSize.xs }]}>
              {tr('rep.prefill')}
            </Text>
          </View>
        )}
        {/* Type */}
        <Dropdown
          label={tr('rep.type')}
          placeholder={tr('rep.typePh')}
          value={type}
          options={typeOptions}
          onSelect={setType}
          fontSize={fontSize}
          COLORS={COLORS}
          styles={styles}
        />
        {errors.type && <Text style={styles.errorText}>{tr('rep.typeErr')}</Text>}
        {/* Message */}
        <View style={styles.fieldWrap}>
          <Text style={[styles.fieldLabel, { fontSize: fontSize.xs }]}>{tr('rep.msg')}</Text>
          <View style={styles.textAreaWrap}>
            <TextInput
              style={[styles.textArea, { fontSize: fontSize.base }]}
              multiline
              maxLength={MAX_CHARS}
              placeholder={tr('rep.msgPh')}
              placeholderTextColor={COLORS.hint}
              value={text}
              onChangeText={setText}
              textAlignVertical="top"
            />
            <Text style={[styles.charCount, { fontSize: fontSize.xs }]}>
              {text.length}/{MAX_CHARS}
            </Text>
          </View>
          {errors.text && <Text style={styles.errorInline}>{tr('rep.msgErr')}</Text>}
        </View>
        {/* Category */}
        <Dropdown
          label={tr('rep.cat')}
          placeholder={tr('rep.catPh')}
          value={category}
          options={catOptions}
          onSelect={setCategory}
          fontSize={fontSize}
          COLORS={COLORS}
          styles={styles}
        />
        {errors.category && <Text style={styles.errorText}>{tr('rep.catErr')}</Text>}
        {/* Remark */}
        <View style={styles.fieldWrap}>
          <Text style={[styles.fieldLabel, { fontSize: fontSize.xs }]}>{tr('rep.remark')}</Text>
          <View style={[styles.textAreaWrap, { minHeight: 110 }]}>
            <TextInput
              style={[styles.textArea, { fontSize: fontSize.sm }]}
              multiline
              maxLength={500}
              placeholder={tr('rep.remarkPh')}
              placeholderTextColor={COLORS.hint}
              value={remark}
              onChangeText={setRemark}
              textAlignVertical="top"
            />
            <Text style={[styles.charCount, { fontSize: fontSize.xs }]}>{remark.length}/500</Text>
          </View>
          <Text style={[styles.remarkHint, { fontSize: fontSize.xs }]}>
            {tr('rep.remarkHint')}
          </Text>
        </View>
        {/* Submit */}
        <TouchableOpacity
          style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={submitting}
          activeOpacity={0.85}
        >
          {submitting
            ? <ActivityIndicator color="#FFFFFF" size="small" />
            : <Text style={[styles.submitBtnText, { fontSize: fontSize.base }]}>{tr('rep.submit')}</Text>
          }
        </TouchableOpacity>
        {/* Footer note */}
        <View style={styles.footerNote}>
          <View style={styles.footerIconWrap}>
            <Text style={styles.footerIcon}>🛡️</Text>
          </View>
          <Text style={[styles.footerText, { fontSize: fontSize.xs }]}>
            {tr('rep.footer')}
          </Text>
        </View>
      </ScrollView>
      {/* Submit toast */}
      {toast.visible && (
        <Animated.View pointerEvents="none" style={[styles.toastOverlay, { opacity: toast.opacity }]}>
          <View style={styles.toast}>
            <View style={styles.toastCheck}><Text style={styles.toastCheckText}>✓</Text></View>
            <Text style={[styles.toastText, { fontSize: fontSize.base }]}>{tr('rep.toast')}</Text>
            <Text style={[styles.toastSub, { fontSize: fontSize.xs }]}>{tr('rep.toastSub')}</Text>
          </View>
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
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', paddingHorizontal: SPACING.lg },
  modalSheet: {
    backgroundColor: COLORS.surface, borderRadius: RADIUS.lg,
    borderWidth: 1.5, borderColor: COLORS.border, padding: SPACING.lg, maxHeight: '70%',
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
  errorInline: { color: COLORS.scam, fontSize: 11, fontWeight: '600', marginTop: 6 },
  errorText: { color: COLORS.scam, fontSize: 11, fontWeight: '600', marginTop: -SPACING.sm, marginBottom: SPACING.md },
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
  prefillNote: {
    backgroundColor: COLORS.infoBg, borderWidth: 1.5, borderColor: COLORS.infoBorder,
    borderRadius: RADIUS.md, paddingHorizontal: SPACING.md, paddingVertical: 10, marginBottom: SPACING.md,
  },
  prefillText: { color: COLORS.ink, lineHeight: 17 },
  remarkHint:  { color: COLORS.hint, marginTop: 6 },
  toastOverlay: {
    position: 'absolute', top: 0, bottom: 0, left: 0, right: 0,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  toast: {
    backgroundColor: COLORS.surface, borderWidth: 1.5, borderColor: COLORS.border2,
    borderRadius: RADIUS.lg, paddingHorizontal: SPACING.xl, paddingVertical: SPACING.lg,
    alignItems: 'center', minWidth: 260, ...SHADOW.card,
  },
  toastCheck: {
    width: 56, height: 56, borderRadius: 28, backgroundColor: '#22C55E',
    alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.sm,
  },
  toastCheckText: { color: '#FFFFFF', fontSize: 30, fontWeight: '900', lineHeight: 34 },
  toastText: { color: COLORS.ink, fontWeight: '800', letterSpacing: 0.5, textAlign: 'center' },
  toastSub:  { color: COLORS.muted, marginTop: 4, textAlign: 'center' },
});