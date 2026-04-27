// TruScan/FrontEnd/Screens/reportScreen.js
// Community Reports — real-time Firestore listener + full CRUD

import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, TextInput,
  StyleSheet, Modal, Alert, ActivityIndicator, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp }            from '../Context/AppContext';
import {
  listenToReports, addReport, updateReport, deleteReport,
} from '../Service/firestoreService';
import { COLORS, RADIUS, SPACING, SHADOW, getRiskColors } from '../Service/theme';

// ─── REPORT CARD ──────────────────────────────────────────────────────────────

function ReportCard({ item, onView, onEdit, onDelete, fontSize }) {
  const risk = getRiskColors(item.category);
  const date = item.timestamp?.toDate
    ? item.timestamp.toDate().toLocaleDateString('en-PH', {
        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
      })
    : '—';

  return (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <View style={[styles.badge, { backgroundColor: risk.bg, borderColor: risk.border }]}>
          <Text style={[styles.badgeText, { color: risk.text, fontSize: fontSize.xs }]}>
            {item.category?.toUpperCase()}
          </Text>
        </View>
        <View style={[styles.statusBadge, {
          backgroundColor: item.status === 'verified' ? COLORS.safeBg
            : item.status === 'rejected' ? COLORS.scamBg : COLORS.infoBg,
        }]}>
          <Text style={[styles.statusText, {
            color: item.status === 'verified' ? COLORS.safe
              : item.status === 'rejected' ? COLORS.scam : COLORS.info,
            fontSize: fontSize.xs,
          }]}>
            {item.status || 'pending'}
          </Text>
        </View>
      </View>

      <Text style={[styles.preview, { fontSize: fontSize.sm }]} numberOfLines={2}>
        {item.text}
      </Text>

      <Text style={[styles.meta, { fontSize: fontSize.xs }]}>
        {date}{item.source ? ` • ${item.source}` : ''}
      </Text>

      <View style={styles.cardActions}>
        <TouchableOpacity style={styles.actionBtn} onPress={() => onView(item)}>
          <Text style={[styles.actionBtnText, { fontSize: fontSize.xs }]}>View</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={() => onEdit(item)}>
          <Text style={[styles.actionBtnText, { fontSize: fontSize.xs }]}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionBtn, styles.actionBtnDel]} onPress={() => onDelete(item.id)}>
          <Text style={[styles.actionBtnText, { color: COLORS.scam, fontSize: fontSize.xs }]}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── REPORT FORM MODAL ────────────────────────────────────────────────────────

function ReportFormModal({ visible, onClose, onSave, editItem, fontSize }) {
  const [text, setText]       = useState('');
  const [category, setCategory] = useState('');
  const [source, setSource]   = useState('');
  const [saving, setSaving]   = useState(false);
  const categories = ['scam', 'suspicious', 'safe'];

  useEffect(() => {
    if (editItem) {
      setText(editItem.text || '');
      setCategory(editItem.category || '');
      setSource(editItem.source || '');
    } else {
      setText(''); setCategory(''); setSource('');
    }
  }, [editItem, visible]);

  const handleSave = async () => {
    if (!text.trim())     { Alert.alert('Error', 'Kinakailangan ang mensahe.'); return; }
    if (!category)        { Alert.alert('Error', 'Pumili ng kategorya.'); return; }
    setSaving(true);
    await onSave({ text, category, source });
    setSaving(false);
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.modalSafe}>
        <View style={styles.modalHeader}>
          <Text style={[styles.modalTitle, { fontSize: fontSize.md }]}>
            {editItem ? 'Edit Report' : 'Add Report'}
          </Text>
          <TouchableOpacity onPress={onClose}>
            <Text style={[styles.modalClose, { fontSize: fontSize.base }]}>Cancel</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.modalBody}>
          {/* Message Input */}
          <Text style={[styles.formLabel, { fontSize: fontSize.xs }]}>MESSAGE / URL</Text>
          <TextInput
            style={[styles.formTextArea, { fontSize: fontSize.base }]}
            multiline
            placeholder="I-paste ang mensahe..."
            placeholderTextColor={COLORS.hint}
            value={text}
            onChangeText={setText}
            textAlignVertical="top"
          />

          {/* Category Picker */}
          <Text style={[styles.formLabel, { fontSize: fontSize.xs, marginTop: SPACING.md }]}>
            KATEGORYA
          </Text>
          <View style={styles.catRow}>
            {categories.map(cat => {
              const risk = getRiskColors(cat);
              const active = category === cat;
              return (
                <TouchableOpacity
                  key={cat}
                  style={[styles.catBtn, {
                    backgroundColor: active ? risk.bg : COLORS.surface,
                    borderColor: active ? risk.border : COLORS.border,
                    borderWidth: active ? 2 : 1.5,
                  }]}
                  onPress={() => setCategory(cat)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.catBtnText, {
                    color: active ? risk.text : COLORS.muted,
                    fontSize: fontSize.xs,
                  }]}>
                    {cat.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Source Input */}
          <Text style={[styles.formLabel, { fontSize: fontSize.xs, marginTop: SPACING.md }]}>
            SOURCE (OPTIONAL)
          </Text>
          <TextInput
            style={[styles.formInput, { fontSize: fontSize.base }]}
            placeholder="SMS, Facebook, Email..."
            placeholderTextColor={COLORS.hint}
            value={source}
            onChangeText={setSource}
          />

          {/* Save Button */}
          <TouchableOpacity
            style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
            onPress={handleSave}
            disabled={saving}
            activeOpacity={0.85}
          >
            {saving
              ? <ActivityIndicator color="#FFF" />
              : <Text style={[styles.saveBtnText, { fontSize: fontSize.base }]}>
                  {editItem ? 'I-update ang Report' : 'I-save ang Report'}
                </Text>
            }
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

// ─── DETAIL MODAL ─────────────────────────────────────────────────────────────

function DetailModal({ visible, item, onClose, onEdit, onDelete, fontSize }) {
  if (!item) return null;
  const risk = getRiskColors(item.category);
  const date = item.timestamp?.toDate
    ? item.timestamp.toDate().toLocaleDateString('en-PH', {
        month: 'long', day: 'numeric', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      })
    : '—';

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.modalSafe}>
        <View style={styles.modalHeader}>
          <Text style={[styles.modalTitle, { fontSize: fontSize.md }]}>Report Detail</Text>
          <TouchableOpacity onPress={onClose}>
            <Text style={[styles.modalClose, { fontSize: fontSize.base }]}>Close</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.modalBody}>
          <View style={styles.detailMeta}>
            <View style={[styles.badge, { backgroundColor: risk.bg, borderColor: risk.border }]}>
              <Text style={[styles.badgeText, { color: risk.text }]}>{item.category?.toUpperCase()}</Text>
            </View>
            <Text style={[styles.detailDate, { fontSize: fontSize.xs }]}>{date}</Text>
          </View>
          <View style={styles.detailTextBox}>
            <Text style={[styles.detailText, { fontSize: fontSize.base }]} selectable>
              {item.text}
            </Text>
          </View>
          {item.source && (
            <Text style={[styles.meta, { marginTop: SPACING.sm, fontSize: fontSize.xs }]}>
              Source: {item.source}
            </Text>
          )}
          <View style={[styles.btnRow, { marginTop: SPACING.lg }]}>
            <TouchableOpacity style={[styles.btnGhost, { flex: 1 }]} onPress={() => { onClose(); onEdit(item); }}>
              <Text style={[styles.btnGhostText, { fontSize: fontSize.sm }]}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.btnDanger, { flex: 1 }]}
              onPress={() => { onDelete(item.id); onClose(); }}
            >
              <Text style={[styles.btnDangerText, { fontSize: fontSize.sm }]}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

// ─── MAIN SCREEN ──────────────────────────────────────────────────────────────

export default function ReportScreen() {
  const { fontSize } = useApp();
  const [reports, setReports]       = useState([]);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter]         = useState('all');
  const [showForm, setShowForm]     = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [editItem, setEditItem]     = useState(null);
  const [detailItem, setDetailItem] = useState(null);
  const [search, setSearch]         = useState('');

  // Real-time Firestore listener
  useEffect(() => {
    setLoading(true);
    const unsub = listenToReports(data => {
      setReports(data);
      setLoading(false);
    });
    return () => unsub(); // cleanup on unmount
  }, []);

  const filtered = reports.filter(r => {
    const matchFilter = filter === 'all' || r.category === filter;
    const matchSearch = !search || r.text?.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const handleAdd = () => { setEditItem(null); setShowForm(true); };
  const handleEdit = (item) => { setEditItem(item); setShowForm(true); };

  const handleSave = async ({ text, category, source }) => {
    if (editItem) {
      const res = await updateReport(editItem.id, { text, category, source });
      if (!res.success) { Alert.alert('Error', 'Hindi ma-update ang report.'); return; }
      Alert.alert('Success', 'Report na-update!');
    } else {
      const res = await addReport({ text, category, source });
      if (!res.success) { Alert.alert('Error', 'Hindi ma-save ang report.'); return; }
      Alert.alert('Salamat!', 'Nai-log na ang report sa komunidad.');
    }
    setShowForm(false);
  };

  const handleDelete = (id) => {
    Alert.alert('Delete Report', 'Sigurado ka bang i-delete ang report na ito?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          const res = await deleteReport(id);
          if (!res.success) Alert.alert('Error', 'Hindi ma-delete ang report.');
        },
      },
    ]);
  };

  const handleView = (item) => { setDetailItem(item); setShowDetail(true); };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 800);
  }, []);

  const FILTERS = ['all', 'scam', 'suspicious', 'safe'];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Screen Header */}
      <View style={styles.screenHeader}>
        <Text style={[styles.screenTitle, { fontSize: fontSize.lg }]}>Community Reports</Text>
        <TouchableOpacity style={styles.addBtn} onPress={handleAdd} activeOpacity={0.8}>
          <Text style={[styles.addBtnText, { fontSize: fontSize.sm }]}>+ Add</Text>
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchWrap}>
        <TextInput
          style={[styles.searchInput, { fontSize: fontSize.sm }]}
          placeholder="Maghanap ng report..."
          placeholderTextColor={COLORS.hint}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterRow}>
        {FILTERS.map(f => (
          <TouchableOpacity
            key={f}
            style={[styles.filterBtn, filter === f && styles.filterBtnActive]}
            onPress={() => setFilter(f)}
            activeOpacity={0.7}
          >
            <Text style={[styles.filterBtnText, {
              color: filter === f ? COLORS.primary : COLORS.muted,
              fontSize: fontSize.xs,
            }]}>
              {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* List */}
      {loading
        ? <ActivityIndicator style={{ flex: 1 }} color={COLORS.primary} />
        : <FlatList
            data={filtered}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
            renderItem={({ item }) => (
              <ReportCard
                item={item}
                fontSize={fontSize}
                onView={handleView}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            )}
            ListEmptyComponent={
              <View style={styles.empty}>
                <Text style={[styles.emptyIcon, { fontSize: 36 }]}>📋</Text>
                <Text style={[styles.emptyText, { fontSize: fontSize.base }]}>Walang reports pa</Text>
                <Text style={[styles.emptySub, { fontSize: fontSize.sm }]}>
                  {filter === 'all' ? 'I-tap ang "+ Add" para mag-log.' : `Walang ${filter} reports.`}
                </Text>
              </View>
            }
          />
      }

      {/* Modals */}
      <ReportFormModal
        visible={showForm}
        onClose={() => setShowForm(false)}
        onSave={handleSave}
        editItem={editItem}
        fontSize={fontSize}
      />
      <DetailModal
        visible={showDetail}
        item={detailItem}
        onClose={() => setShowDetail(false)}
        onEdit={handleEdit}
        onDelete={handleDelete}
        fontSize={fontSize}
      />
    </SafeAreaView>
  );
}

// ─── STYLES ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },

  screenHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md,
  },
  screenTitle: { fontWeight: '800', color: COLORS.ink },
  addBtn: {
    backgroundColor: COLORS.primary, borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md, paddingVertical: 8,
  },
  addBtnText: { color: '#FFF', fontWeight: '700' },

  searchWrap: { paddingHorizontal: SPACING.lg, marginBottom: SPACING.sm },
  searchInput: {
    backgroundColor: COLORS.surface, borderWidth: 1.5, borderColor: COLORS.border,
    borderRadius: RADIUS.md, padding: SPACING.sm + 2, color: COLORS.ink,
  },

  filterRow: { flexDirection: 'row', paddingHorizontal: SPACING.lg, gap: SPACING.sm, marginBottom: SPACING.sm },
  filterBtn: {
    paddingHorizontal: SPACING.md, paddingVertical: 6,
    borderRadius: RADIUS.pill, borderWidth: 1.5, borderColor: COLORS.border,
  },
  filterBtnActive: { borderColor: COLORS.primary, backgroundColor: COLORS.safeBg },
  filterBtnText:   { fontWeight: '700' },

  list: { padding: SPACING.lg, paddingBottom: 80 },

  card: {
    backgroundColor: COLORS.surface, borderRadius: RADIUS.lg,
    borderWidth: 1.5, borderColor: COLORS.border,
    padding: SPACING.md, marginBottom: SPACING.sm, ...SHADOW.card,
  },
  cardTop:     { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.sm },
  badge:       { paddingHorizontal: 9, paddingVertical: 3, borderRadius: 6, borderWidth: 1 },
  badgeText:   { fontWeight: '700' },
  statusBadge: { paddingHorizontal: 9, paddingVertical: 3, borderRadius: 6 },
  statusText:  { fontWeight: '700' },
  preview:     { color: COLORS.ink, lineHeight: 20, marginBottom: SPACING.sm },
  meta:        { color: COLORS.hint, fontWeight: '600' },

  cardActions:    { flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.sm },
  actionBtn:      {
    paddingHorizontal: 12, paddingVertical: 5,
    borderRadius: 6, borderWidth: 1.5, borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  actionBtnDel:  { borderColor: COLORS.scamBorder, backgroundColor: COLORS.scamBg },
  actionBtnText: { fontWeight: '700', color: COLORS.muted },

  empty:     { alignItems: 'center', paddingTop: 60 },
  emptyIcon: {},
  emptyText: { fontWeight: '800', color: COLORS.muted, marginTop: SPACING.sm },
  emptySub:  { color: COLORS.hint, marginTop: 4 },

  // Modal
  modalSafe:   { flex: 1, backgroundColor: COLORS.background },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: SPACING.lg, borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  modalTitle:  { fontWeight: '800', color: COLORS.ink },
  modalClose:  { color: COLORS.primary, fontWeight: '600' },
  modalBody:   { flex: 1, padding: SPACING.lg },

  formLabel:    { fontWeight: '700', color: COLORS.muted, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: SPACING.sm },
  formTextArea: {
    backgroundColor: COLORS.surface, borderWidth: 1.5, borderColor: COLORS.border,
    borderRadius: RADIUS.md, padding: SPACING.md, minHeight: 100, color: COLORS.ink, lineHeight: 22,
  },
  formInput: {
    backgroundColor: COLORS.surface, borderWidth: 1.5, borderColor: COLORS.border,
    borderRadius: RADIUS.md, padding: SPACING.md, color: COLORS.ink,
  },
  catRow:        { flexDirection: 'row', gap: SPACING.sm },
  catBtn:        { flex: 1, paddingVertical: 10, borderRadius: RADIUS.md, alignItems: 'center' },
  catBtnText:    { fontWeight: '700' },

  saveBtn:         {
    backgroundColor: COLORS.primary, borderRadius: RADIUS.md,
    padding: SPACING.md, alignItems: 'center', marginTop: SPACING.lg, ...SHADOW.card,
  },
  saveBtnDisabled: { backgroundColor: COLORS.border2 },
  saveBtnText:     { color: '#FFF', fontWeight: '700' },

  // Detail Modal
  detailMeta:    { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.md },
  detailDate:    { color: COLORS.muted, fontWeight: '600' },
  detailTextBox: {
    backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border,
    borderRadius: RADIUS.md, padding: SPACING.md,
  },
  detailText: { color: COLORS.ink, lineHeight: 22 },

  btnRow:        { flexDirection: 'row', gap: SPACING.sm },
  btnGhost:      {
    padding: SPACING.md, borderRadius: RADIUS.md,
    borderWidth: 1.5, borderColor: COLORS.border, alignItems: 'center',
  },
  btnGhostText:  { color: COLORS.muted, fontWeight: '700' },
  btnDanger:     {
    padding: SPACING.md, borderRadius: RADIUS.md,
    borderWidth: 1.5, borderColor: COLORS.scamBorder, backgroundColor: COLORS.scamBg, alignItems: 'center',
  },
  btnDangerText: { color: COLORS.scam, fontWeight: '700' },
});