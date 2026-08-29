import {
  doc,
  getDoc,
  collection,
  getDocs,
  query,
  orderBy,
  limit,
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";
import { db } from "./firebase-config.js";
import { PATHS, timeAgo, escapeHtml } from "./firestore-helpers.js";

document.addEventListener("DOMContentLoaded", async () => {
  try {
    await Promise.all([loadMetrics(), loadFlaggedScams(), loadRiskIndicators()]);
  } catch (err) {
    console.error("Failed to load dashboard data from Firestore:", err);
    showToast("Couldn't load dashboard data \u2014 check the console.");
  }
});

async function loadMetrics() {
  const snap = await getDoc(doc(db, ...PATHS.metricsDoc));
  if (!snap.exists()) return;
  const m = snap.data();
  document.getElementById("detectionRate").textContent = `${m.detectionRate}%`;
  document.getElementById("detectionTrend").textContent = m.detectionRateTrend || "";
  document.getElementById("activeThreats").textContent = m.activeThreats;
  document.getElementById("activeThreatsTrend").textContent = m.activeThreatsTrend || "";
}

async function loadFlaggedScams() {
  const q = query(collection(db, PATHS.flaggedScams), orderBy("reportedAt", "desc"), limit(5));
  const snap = await getDocs(q);
  const flaggedList = document.getElementById("flaggedList");

  if (snap.empty) {
    flaggedList.innerHTML = `<p class="empty-note">No flagged scams yet.</p>`;
    return;
  }

  flaggedList.innerHTML = snap.docs
    .map((d) => {
      const item = d.data();
      return `
        <div class="flagged-item">
          <div class="flagged-head">
            <span class="flagged-title">${escapeHtml(item.title)}</span>
            <span class="severity-pill ${escapeHtml(item.severity)}">${escapeHtml(item.severity)}</span>
          </div>
          <div class="flagged-desc">${escapeHtml(item.description)}</div>
          <div class="flagged-time">${timeAgo(item.reportedAt)}</div>
        </div>`;
    })
    .join("");
}

async function loadRiskIndicators() {
  const q = query(collection(db, PATHS.riskIndicators), orderBy("score", "desc"), limit(6));
  const snap = await getDocs(q);
  const riskList = document.getElementById("riskList");

  if (snap.empty) {
    riskList.innerHTML = `<li class="empty-note">No risk indicators yet.</li>`;
    return;
  }

  riskList.innerHTML = snap.docs
    .map((d) => {
      const r = d.data();
      return `
        <li>
          <span class="risk-label">${escapeHtml(r.label)}</span>
          <span class="risk-bar-track"><span class="risk-bar-fill" style="width:${r.score}%"></span></span>
          <span class="risk-score">${r.score}</span>
        </li>`;
    })
    .join("");
}