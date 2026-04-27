// TruScan/FrontEnd/Service/firestoreService.js

import { db } from './firebase';
import {
  collection, addDoc, getDocs, doc,
  updateDoc, deleteDoc, onSnapshot,
  query, orderBy, limit, where,
  serverTimestamp, getDoc
} from 'firebase/firestore';

const COLLECTION = 'reported_scams';

// ─── CREATE ──────────────────────────────────────────────────────────────────

export async function addReport({ text, category, source = 'mobile_app', mlPrediction = null }) {
  try {
    const data = {
      text:           text.trim(),
      category,
      source,
      mlPrediction,
      status:         'pending',
      usedInTraining: false,
      timestamp:      serverTimestamp(),
      reportedBy:     'anonymous',
    };
    const ref = await addDoc(collection(db, COLLECTION), data);
    return { success: true, id: ref.id };
  } catch (error) {
    console.error('[firestoreService] addReport error:', error);
    return { success: false, error: error.message };
  }
}

// ─── READ ────────────────────────────────────────────────────────────────────

export async function getReports({ status = null, category = null, limitCount = 50 } = {}) {
  try {
    let constraints = [orderBy('timestamp', 'desc'), limit(limitCount)];
    if (status)   constraints.push(where('status', '==', status));
    if (category) constraints.push(where('category', '==', category));

    const q = query(collection(db, COLLECTION), ...constraints);
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (error) {
    console.error('[firestoreService] getReports error:', error);
    return [];
  }
}

export function listenToReports(callback, { status = null, limitCount = 50 } = {}) {
  let constraints = [orderBy('timestamp', 'desc'), limit(limitCount)];
  if (status) constraints.push(where('status', '==', status));

  const q = query(collection(db, COLLECTION), ...constraints);

  return onSnapshot(
    q,
    snapshot => {
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      callback(data);
    },
    error => console.error('[firestoreService] listenToReports error:', error)
  );
}

export async function getReportById(id) {
  try {
    const ref = doc(db, COLLECTION, id);
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() };
  } catch (error) {
    console.error('[firestoreService] getReportById error:', error);
    return null;
  }
}

// ─── UPDATE ──────────────────────────────────────────────────────────────────

export async function updateReport(id, fields) {
  try {
    const ref = doc(db, COLLECTION, id);
    await updateDoc(ref, {
      ...fields,
      updatedAt: serverTimestamp(),
    });
    return { success: true };
  } catch (error) {
    console.error('[firestoreService] updateReport error:', error);
    return { success: false, error: error.message };
  }
}

// ─── DELETE ──────────────────────────────────────────────────────────────────

export async function deleteReport(id) {
  try {
    const ref = doc(db, COLLECTION, id);
    await deleteDoc(ref);
    return { success: true };
  } catch (error) {
    console.error('[firestoreService] deleteReport error:', error);
    return { success: false, error: error.message };
  }
}

// ─── STATS ───────────────────────────────────────────────────────────────────

export async function getReportStats() {
  try {
    const snapshot = await getDocs(collection(db, COLLECTION));
    const stats = { total: 0, scam: 0, suspicious: 0, safe: 0, pending: 0, verified: 0 };
    snapshot.docs.forEach(d => {
      const data = d.data();
      stats.total++;
      if (data.category) stats[data.category] = (stats[data.category] || 0) + 1;
      if (data.status)   stats[data.status]   = (stats[data.status]   || 0) + 1;
    });
    return stats;
  } catch (error) {
    console.error('[firestoreService] getReportStats error:', error);
    return null;
  }
}