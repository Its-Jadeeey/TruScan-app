// Shared by dashboard / reports / settings:
//   - who is logged in (Firebase Authentication + Firestore profile)
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
import {
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";
import { db, auth } from "./firebase-config.js";
import { PATHS, adminDoc, riskOf, channelLabel, toDate, timeAgo, truncate, escapeHtml } from "./firestore-helpers.js";

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

// Resolves with the signed-in Firebase user (or null) once Firebase has restored the session.
function waitForUser() {
  return new Promise((resolve) => {
    const off = onAuthStateChanged(auth, (u) => { off(); resolve(u); });
  });
}

function clearAdminCache() {
  try { sessionStorage.removeItem(CACHE_KEY); } catch (e) {}
}

// End the server's session cookie. Without this, a leftover cookie would make the server
// bounce /login -> /dashboard while the browser bounces /dashboard -> /login (redirect loop).
async function endServerSession() {
  try { await fetch("/api/auth/logout", { method: "POST", credentials: "same-origin" }); } catch (e) {}
}

export async function getAdmin() {
  const user = await waitForUser();
  if (!user) {
    clearAdminCache();
    await endServerSession();
    window.location.href = "/login";
    return null;
  }

  const cached = readAdminCache();
  if (cached && cached.uid === user.uid && cached.username) return cached;

  // Only accounts marked admin (BackEnd/make_admin.py) may use the panel.
  const token = await user.getIdTokenResult();
  if (token.claims.admin !== true) {
    clearAdminCache();
    await signOut(auth);
    await endServerSession();
    window.location.href = "/login?denied=1";
    return null;
  }

  // Profile: the admins/* document whose email matches this account.
  // (Keeps the existing admins/admin profile; falls back to a default.)
  const fallbackName = (user.email || "admin").split("@")[0];
  let username = fallbackName;
  let profile = { fullName: user.displayName || fallbackName, email: user.email || "" };
  try {
    const snap = await getDocs(
      query(collection(db, PATHS.admins), where("email", "==", user.email), limit(1))
    );
    if (!snap.empty) {
      const d = snap.docs[0].data();
      username = snap.docs[0].id;
      profile = {
        fullName: d.fullName || fallbackName,
        email: d.email || user.email || "",
        phone: d.phone || "",
        role: d.role || "Administrator",
        lightMode: !!d.lightMode,
        language: d.language || "English",
      };
    }
  } catch (err) {
    console.warn("Could not read admin profile:", err);
  }
  return updateAdminCache({ uid: user.uid, username, role: "Administrator", language: "English", ...profile });
}

// Log out = sign out of Firebase, then back to the login page.
function setupLogout() {
  const old = document.getElementById("logoutBtn");
  if (!old) return;
  const btn = old.cloneNode(true); // drops the old click handler (server-session logout)
  old.replaceWith(btn);
  btn.addEventListener("click", async () => {
    clearAdminCache();
    await endServerSession();
    try { await signOut(auth); } catch (e) {}
    window.location.href = "/login";
  });
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
    fillNotifPanel(snap.docs.map((d) => ({ id: d.id, ...d.data() })), n);
    return n;
  } catch (err) {
    console.warn("Could not count pending reports:", err);
    const list = document.getElementById("notifList");
    if (list) list.innerHTML = '<li class="notif-empty">Could not load notifications.</li>';
    return 0;
  }
}

// Fill the bell dropdown with basic information about pending reports.
function fillNotifPanel(rows, total) {
  const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
  const dayAgo = Date.now() - 24 * 3600 * 1000;
  const time = (r) => toDate(r.timestamp)?.getTime() || 0;
  set("nsPending", total >= 100 ? "99+" : String(total));
  set("nsHigh", String(rows.filter((r) => riskOf(r) === "high").length));
  set("nsToday", String(rows.filter((r) => time(r) >= dayAgo).length));

  const list = document.getElementById("notifList");
  if (!list) return;
  const latest = rows.filter((r) => (r.text || "").trim()).sort((a, b) => time(b) - time(a)).slice(0, 5);
  if (!latest.length) {
    list.innerHTML = '<li class="notif-empty">You are all caught up. No pending reports.</li>';
    return;
  }
  list.innerHTML = latest
    .map((r) => {
      const risk = riskOf(r);
      return `<li><a class="notif-item" href="/reports?status=pending&case=${encodeURIComponent(r.id)}">
        <span class="notif-dot risk-${risk}" aria-hidden="true"></span>
        <span class="notif-body">
          <span class="notif-text">${escapeHtml(truncate(r.text, 70))}</span>
          <span class="notif-meta">${escapeHtml(channelLabel(r.channel))} &middot; ${escapeHtml(risk.charAt(0).toUpperCase() + risk.slice(1))} &middot; ${escapeHtml(timeAgo(r.timestamp))}</span>
        </span>
      </a></li>`;
    })
    .join("");
}

function setupBell() {
  const btn = document.getElementById("notifBtn");
  const panel = document.getElementById("notifPanel");
  if (!btn || !panel) return;
  const close = () => { panel.hidden = true; btn.setAttribute("aria-expanded", "false"); };
  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    const open = panel.hidden;
    panel.hidden = !open;
    btn.setAttribute("aria-expanded", String(open));
    if (open) refreshPendingBadge();
  });
  document.addEventListener("click", (e) => { if (!panel.hidden && !panel.contains(e.target)) close(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") close(); });
  const refresh = document.getElementById("notifRefresh");
  if (refresh) refresh.addEventListener("click", (e) => { e.stopPropagation(); refreshPendingBadge(); });
}

export async function initShell() {
  const admin = await getAdmin();
  if (!admin) return null;

  window.TS.applyTheme(admin.lightMode ? "light" : "dark");
  window.TS.setLanguage(admin.language || "English");
  fillAdminChip(admin);
  setupLogout();

  setupBell();
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