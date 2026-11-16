// Shared Firestore path constants + small helpers, used by dashboard.js,
// reports.js, settings.js, login.js and admin-core.js.
export const PATHS = {
  reportedScams: "reported_scams", // written by the mobile app (Service/firestoreService.js)
  scamChecks: "scamChecks",         // logged by the admin panel's own Scam Checker
  admins: "admins",
  auditLogs: "audit_logs",          // admin actions (verify / reject / export / settings)
};

// Each admin is one doc in the `admins` collection, keyed by username:
// admins/{username} = { password, fullName, email, phone, role, lightMode, language }
export function adminDoc(username) {
  return ["admins", username];
}

// Scam types used when an admin confirms a report (same names as TruScanDATASET.csv).
export const SCAM_TYPES = [
  "Phishing",
  "Credential Phishing",
  "Banking Scam",
  "Impersonation Scam",
  "Investment Scam",
  "Job Scam",
  "Loan Scam",
  "Courier/Delivery Scam",
  "Lottery/Prize Scam",
  "Gambling/Betting Scam",
  "Subscription Scam",
  "Online Shopping Scam",
  "Romance Scam",
  "Travel/Accommodation Scam",
  "SIM Swap Scam",
  "Charity/Donation Scam",
  "Miscellaneous Scam",
];

// The mobile app's report categories -> the admin's scam types (so both count together).
const REPORTER_CATEGORY_TO_TYPE = {
  financial: "Banking Scam",
  government: "Impersonation Scam",
  delivery: "Courier/Delivery Scam",
  job: "Job Scam",
  lottery: "Lottery/Prize Scam",
  shopping: "Online Shopping Scam",
  investment: "Investment Scam",
  phishing: "Phishing",
  smishing: "Phishing",
  romance: "Romance Scam",
  impersonation: "Impersonation Scam",
  loan: "Loan Scam",
  travel: "Travel/Accommodation Scam",
  simswap: "SIM Swap Scam",
  charity: "Charity/Donation Scam",
};

// What the reporter chose in the app, expressed as an admin scam type (or null).
export function reporterTypeOf(scan) {
  return REPORTER_CATEGORY_TO_TYPE[scan?.scamCategory] || null;
}

// One category label per report, for the dashboard breakdown:
// admin-confirmed type > reporter's choice > "Uncategorized".
export function categoryOf(scan) {
  if (scan?.status === "verified" && scan.finalLabel === "Not Scam") return "Not a scam";
  return scan?.scamType || reporterTypeOf(scan) || "Uncategorized";
}

export const CHANNELS = { sms: "SMS", email: "Email", link: "Link" };

export function t(key) {
  return window.TS ? window.TS.t(key) : key;
}

// Accepts a Firestore Timestamp, a Date, a number or an ISO string.
export function toDate(ts) {
  if (!ts) return null;
  if (typeof ts.toDate === "function") return ts.toDate();
  if (ts instanceof Date) return ts;
  const d = new Date(ts);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function timeAgo(timestamp) {
  const d = toDate(timestamp);
  if (!d) return "";
  const fil = window.TS && window.TS.getLang() === "Filipino";
  const mins = Math.round((Date.now() - d.getTime()) / 60000);
  if (mins < 1) return fil ? "ngayon lang" : "just now";
  if (mins < 60) return fil ? `${mins} min ang nakalipas` : `${mins} minute${mins === 1 ? "" : "s"} ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return fil ? `${hrs} oras ang nakalipas` : `${hrs} hour${hrs === 1 ? "" : "s"} ago`;
  const days = Math.round(hrs / 24);
  return fil ? `${days} araw ang nakalipas` : `${days} day${days === 1 ? "" : "s"} ago`;
}

export function formatDate(timestamp) {
  const d = toDate(timestamp);
  if (!d) return "";
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function dayKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str ?? "";
  return div.innerHTML;
}

export function capitalize(str) {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function truncate(str, max = 90) {
  if (!str) return "";
  return str.length > max ? str.slice(0, max).trim() + "…" : str;
}

// ---- Report helpers ------------------------------------------------------
export function riskOf(scan) {
  const r = String(scan?.mlPrediction?.riskLevel || "").toLowerCase();
  return ["high", "medium", "low", "safe"].includes(r) ? r : "medium";
}

export function channelLabel(channel) {
  const c = String(channel || "").toLowerCase();
  return CHANNELS[c] || capitalize(c) || "Unknown";
}

// Risk AFTER the admin's decision. The model's own risk (riskOf) is kept untouched
// so "Model corrections" and accuracy still compare against what the model said.
//  - verified "Not Scam"  -> low
//  - verified "Scam"      -> the model's risk, but never below medium (admin confirmed it is a scam)
//  - anything else        -> the model's risk
export function effectiveRiskOf(scan) {
  const model = riskOf(scan);
  if (scan?.status === "verified" && scan.finalLabel) {
    if (scan.finalLabel === "Not Scam") return "low";
    return model === "low" || model === "safe" ? "high" : model;
  }
  return model;
}

// True when the admin's decision changed the risk shown (so we can note what the model said).
export function riskChanged(scan) {
  const norm = (r) => (r === "safe" ? "low" : r);
  return norm(effectiveRiskOf(scan)) !== norm(riskOf(scan));
}

// "Scam" | "Safe" | model category (e.g. "suspicious"), after the admin's decision.
export function effectiveCategory(scan) {
  if (scan?.status === "verified" && scan.finalLabel) {
    if (scan.finalLabel === "Not Scam") return "safe";
    return scan.category === "safe" ? "scam" : scan.category;
  }
  return scan?.category;
}

// Still a threat? (model flagged it and the admin has not cleared it as Not Scam)
export function isStillFlagged(scan) {
  return isFlagged(scan) && !(scan.status === "verified" && scan.finalLabel === "Not Scam");
}

export function isFlagged(scan) {
  return scan.category !== "safe";
}

// The label the mobile app's model gave this report, as "Scam" | "Not Scam".
export function modelLabel(scan) {
  return scan.category === "safe" ? "Not Scam" : "Scam";
}

// Did the admin's confirmed label match what the model said?
// Returns true / false, or null when the case has no admin label yet.
export function agreesWithModel(scan) {
  if (scan.status !== "verified" || !scan.finalLabel) return null;
  return scan.finalLabel === modelLabel(scan);
}

// ---- CSV / download helpers ---------------------------------------------
export function csvEscape(value) {
  const s = String(value ?? "").replace(/\r\n/g, "\n");
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function toCsv(header, rows) {
  return [header, ...rows].map((r) => r.map(csvEscape).join(",")).join("\n") + "\n";
}

export function downloadText(filename, text, mime = "text/csv;charset=utf-8") {
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}