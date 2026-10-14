// Shared by dashboard / reports / settings:
//   - who is logged in (session + Firestore profile)
//   - sidebar chip, theme + language from the saved profile, pending badge
//   - audit log writer
//   - calls to the ML backend (/analyze, /model/info, /health)
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  query,
  where,
  limit,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";
import { db } from "./firebase-config.js";
import { PATHS, adminDoc } from "./firestore-helpers.js";

const CACHE_KEY = "ts-admin";

// ---------------------------------------------------------------------------
// Current admin
// ---------------------------------------------------------------------------
export function readAdminCache() {
  try {
    return JSON.parse(sessionStorage.getItem(CACHE_KEY) || "null");
  } catch (e) {
    return null;
  }
}

export function updateAdminCache(partial) {
  try {
    const next = { ...(readAdminCache() || {}), ...partial };
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(next));
    return next;
  } catch (e) {
    return partial;
  }
}

export async function getAdmin() {
  const cached = readAdminCache();
  if (cached && cached.username) return cached;

  const res = await fetch("/api/auth/me", { credentials: "same-origin" });
  if (!res.ok) {
    window.location.href = "/login";
    return null;
  }
  const { username } = await res.json();

  let profile = {};
  try {
    const snap = await getDoc(doc(db, ...adminDoc(username)));
    if (snap.exists()) {
      const d = snap.data();
      // never keep the password in the browser cache
      profile = {
        fullName: d.fullName || "",
        email: d.email || "",
        phone: d.phone || "",
        role: d.role || "Administrator",
        lightMode: !!d.lightMode,
        language: d.language || "English",
      };
    }
  } catch (err) {
    console.warn("Could not read admin profile:", err);
  }
  return updateAdminCache({ username, role: "Administrator", language: "English", ...profile });
}

// ---------------------------------------------------------------------------
// Page shell: call once per page.
// ---------------------------------------------------------------------------
export function fillAdminChip(admin) {
  const nameEl = document.getElementById("adminChipName");
  const roleEl = document.getElementById("adminChipRole");
  if (nameEl) nameEl.textContent = admin.fullName || admin.username;
  if (roleEl) roleEl.textContent = admin.role || "Administrator";
}

export async function refreshPendingBadge() {
  const badge = document.getElementById("notifBadge");
  if (!badge) return 0;
  try {
    const snap = await getDocs(
      query(collection(db, PATHS.reportedScams), where("status", "==", "pending"), limit(100))
    );
    const n = snap.size;
    badge.textContent = n >= 100 ? "99+" : String(n);
    badge.hidden = n === 0;
    const btn = document.getElementById("notifBtn");
    if (btn) btn.setAttribute("aria-label", `${window.TS.t("Notifications")}: ${n} ${window.TS.t("Pending review")}`);
    return n;
  } catch (err) {
    console.warn("Could not count pending reports:", err);
    return 0;
  }
}

export async function initShell() {
  const admin = await getAdmin();
  if (!admin) return null;

  window.TS.applyTheme(admin.lightMode ? "light" : "dark");
  window.TS.setLanguage(admin.language || "English");
  fillAdminChip(admin);

  const bell = document.getElementById("notifBtn");
  if (bell) bell.addEventListener("click", () => (window.location.href = "/reports?status=pending"));
  refreshPendingBadge();
  return admin;
}

// ---------------------------------------------------------------------------
// Audit log
// ---------------------------------------------------------------------------
export async function logAudit(action, details = {}) {
  try {
    const admin = (await getAdmin()) || {};
    await addDoc(collection(db, PATHS.auditLogs), {
      action,
      admin: admin.username || "unknown",
      ...details,
      timestamp: serverTimestamp(),
    });
  } catch (err) {
    console.warn("Could not write audit log:", err);
  }
}

// ---------------------------------------------------------------------------
// ML backend
// ---------------------------------------------------------------------------
async function apiFetch(path, options = {}, timeoutMs = 8000) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(`${window.TS.apiBase()}${path}`, { ...options, signal: ctrl.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchHealth() {
  try {
    await apiFetch("/health", {}, 4000);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

export async function fetchModelInfo() {
  try {
    return { ok: true, data: await apiFetch("/model/info", {}, 5000) };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

// Run the real ML model. Falls back to the keyword heuristic if the backend
// can't be reached, and says so in `source`.
export async function runMlCheck(text) {
  try {
    const data = await apiFetch("/analyze/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, user_id: "admin" }),
    });
    return { ok: true, ...normalizeMl(data) };
  } catch (err) {
    return { ok: false, error: err.message, ...heuristicCheck(text) };
  }
}

const TIER_VERDICT = { high: "Likely scam", medium: "Suspicious", low: "Likely safe" };

export function normalizeMl(data) {
  const lvl = String(data.risk_level || "").toUpperCase();
  let tier = lvl === "HIGH" ? "high" : lvl === "MEDIUM" ? "medium" : lvl ? "low" : null;
  if (!tier) tier = data.prediction === "scam" ? "high" : data.prediction === "suspicious" ? "medium" : "low";

  const conf = Number.isFinite(data.confidence) ? data.confidence : 0;
  const score = Number.isFinite(data.risk_score)
    ? data.risk_score
    : data.prediction === "safe"
    ? 100 - conf
    : conf;

  return {
    source: "ml",
    tier,
    verdict: TIER_VERDICT[tier],
    score,
    confidence: conf,
    explanation: data.explanation || "",
    reasons: data.indicators?.top_features || [],
  };
}

// Offline fallback only. Not the trained model.
const RED_FLAGS = {
  "verify your account": 25,
  "click here": 15,
  otp: 20,
  won: 15,
  urgent: 15,
  gcash: 10,
  bank: 10,
  suspend: 20,
  prize: 15,
  "limited time": 10,
  "bit.ly": 20,
  password: 15,
};

export function heuristicCheck(text) {
  const lower = text.toLowerCase();
  const reasons = [];
  let score = 10;
  for (const [phrase, weight] of Object.entries(RED_FLAGS)) {
    if (lower.includes(phrase)) {
      score += weight;
      reasons.push(`Contains phrase associated with scams: “${phrase}”`);
    }
  }
  score = Math.min(score, 98);
  const tier = score >= 60 ? "high" : score >= 30 ? "medium" : "low";
  if (reasons.length === 0) reasons.push("No known scam patterns detected in the text.");
  return {
    source: "heuristic",
    tier,
    verdict: TIER_VERDICT[tier],
    score,
    confidence: score,
    explanation: "",
    reasons,
  };
}
