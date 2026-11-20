// Remembers what was scanned/reported this session so the same text isn't sent twice.
// Lives in memory only, so it resets when the app is closed.
const scanned = new Map();   // normalized text -> scan result
const reported = new Set();  // normalized text

export const normalize = (t) => (t || '').trim().toLowerCase().replace(/\s+/g, ' ');
export const getScanned = (t) => scanned.get(normalize(t));
export const rememberScan = (t, result) => scanned.set(normalize(t), result);
export const wasReported = (t) => reported.has(normalize(t));
export const rememberReport = (t) => reported.add(normalize(t));