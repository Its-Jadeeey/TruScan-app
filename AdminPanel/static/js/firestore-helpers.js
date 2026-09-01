// Shared Firestore path constants + tiny helpers, used by dashboard.js,
// reports.js, settings.js and login.js.
export const PATHS = {
  reportedScams: "reported_scams", // written by the mobile app (Service/firestoreService.js)
  scamChecks: "scamChecks",         // logged by the admin panel's own Scam Checker
  admins: "admins",
};

// Each admin is one doc in the `admins` collection, keyed by username:
// admins/{username} = { password, fullName, email, phone, role, lightMode, language }
export function adminDoc(username) {
  return ["admins", username];
}

export function timeAgo(timestamp) {
  if (!timestamp || !timestamp.toDate) return "";
  const diffMs = Date.now() - timestamp.toDate().getTime();
  const mins = Math.round(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} minute${mins === 1 ? "" : "s"} ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs === 1 ? "" : "s"} ago`;
  const days = Math.round(hrs / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

export function formatDate(timestamp) {
  if (!timestamp || !timestamp.toDate) return "";
  return timestamp.toDate().toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
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
  return str.length > max ? str.slice(0, max).trim() + "\u2026" : str;
}