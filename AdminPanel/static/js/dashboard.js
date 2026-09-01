import {
  collection,
  getDocs,
  query,
  orderBy,
  limit,
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";
import { db } from "./firebase-config.js";
import { PATHS, timeAgo, escapeHtml, capitalize, truncate } from "./firestore-helpers.js";

// How many recent scans to pull for computing dashboard stats. Reading a
// bounded recent window (instead of the whole collection) keeps this fast
// and avoids needing composite Firestore indexes. Fine while scan volume is
// low; swap for aggregation queries / a scheduled rollup doc once it grows.
const SAMPLE_SIZE = 300;

document.addEventListener("DOMContentLoaded", async () => {
  try {
    const scans = await loadRecentScans();
    renderMetrics(scans);
    renderFlaggedScams(scans);
    renderRiskIndicators(scans);
  } catch (err) {
    console.error("Failed to load dashboard data from Firestore:", err);
    showToast("Couldn't load dashboard data \u2014 check the console.");
  }
});

async function loadRecentScans() {
  const q = query(collection(db, PATHS.reportedScams), orderBy("timestamp", "desc"), limit(SAMPLE_SIZE));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

function renderMetrics(scans) {
  const total = scans.length;
  const flagged = scans.filter((s) => s.category !== "safe");
  const detectionRate = total > 0 ? ((flagged.length / total) * 100).toFixed(1) : "0.0";
  const activeThreats = scans.filter((s) => s.category !== "safe" && s.status === "pending").length;

  document.getElementById("detectionRate").textContent = `${detectionRate}%`;
  document.getElementById("detectionTrend").textContent =
    total > 0 ? `${flagged.length} of ${total} recent scans flagged` : "No scans yet";
  document.getElementById("activeThreats").textContent = activeThreats;
  document.getElementById("activeThreatsTrend").textContent = "Pending review";
}

function renderFlaggedScams(scans) {
  const flaggedList = document.getElementById("flaggedList");
  const flagged = scans.filter((s) => s.category !== "safe").slice(0, 5);

  if (flagged.length === 0) {
    flaggedList.innerHTML = `<p class="empty-note">No flagged scams yet.</p>`;
    return;
  }

  flaggedList.innerHTML = flagged
    .map((s) => {
      const risk = s.mlPrediction?.riskLevel || "medium";
      const title = `${capitalize(s.category)} \u00b7 ${capitalize(s.channel || "unknown")}`;
      return `
        <div class="flagged-item">
          <div class="flagged-head">
            <span class="flagged-title">${escapeHtml(title)}</span>
            <span class="severity-pill ${escapeHtml(risk)}">${escapeHtml(risk)}</span>
          </div>
          <div class="flagged-desc">${escapeHtml(truncate(s.text))}</div>
          <div class="flagged-time">${timeAgo(s.timestamp)}</div>
        </div>`;
    })
    .join("");
}

function renderRiskIndicators(scans) {
  const riskList = document.getElementById("riskList");
  const flagged = scans.filter((s) => s.category !== "safe");

  const tally = {};
  for (const s of flagged) {
    const reasons = s.mlPrediction?.reasons || [];
    for (const reason of reasons) {
      tally[reason] = (tally[reason] || 0) + 1;
    }
  }

  const ranked = Object.entries(tally)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);

  if (ranked.length === 0) {
    riskList.innerHTML = `<li class="empty-note">No risk indicators yet.</li>`;
    return;
  }

  const maxCount = ranked[0][1];
  riskList.innerHTML = ranked
    .map(([label, count]) => {
      const pct = Math.round((count / maxCount) * 100);
      return `
        <li>
          <span class="risk-label">${escapeHtml(label)}</span>
          <span class="risk-bar-track"><span class="risk-bar-fill" style="width:${pct}%"></span></span>
          <span class="risk-score">${count}</span>
        </li>`;
    })
    .join("");
}