// Shared Firestore path constants + tiny helpers, used by dashboard.js,
// reports.js and settings.js. Keeping the collection/doc names in one place
// avoids typos across files.
export const PATHS = {
  metricsDoc: ["metrics", "system"],
  flaggedScams: "flaggedScams",
  riskIndicators: "riskIndicators",
  reportsOverviewDoc: ["reportsOverview", "summary"],
  intrusionCases: "intrusionCases",
  scamChecks: "scamChecks",
  adminProfileDoc: ["adminProfile", "main"],
  adminPreferencesDoc: ["adminPreferences", "main"],
};

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