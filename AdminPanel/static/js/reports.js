import {
  doc,
  getDoc,
  collection,
  getDocs,
  addDoc,
  query,
  orderBy,
  limit,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";
import { db } from "./firebase-config.js";
import { PATHS, formatDate, escapeHtml } from "./firestore-helpers.js";

document.addEventListener("DOMContentLoaded", async () => {
  try {
    await Promise.all([loadOverview(), loadIntrusionCases()]);
  } catch (err) {
    console.error("Failed to load reports data from Firestore:", err);
    showToast("Couldn't load reports data \u2014 check the console.");
  }

  document.getElementById("checkBtn").addEventListener("click", runScamCheck);
  document.getElementById("clearBtn").addEventListener("click", () => {
    document.getElementById("scamInput").value = "";
    const resultEl = document.getElementById("scamResult");
    resultEl.hidden = true;
    resultEl.innerHTML = "";
  });
});

async function loadOverview() {
  const snap = await getDoc(doc(db, ...PATHS.reportsOverviewDoc));
  if (!snap.exists()) return;
  const o = snap.data();
  document.getElementById("totalNewCases").textContent = o.totalNewCases;
  document.getElementById("totalNewCasesTrend").textContent = o.totalNewCasesTrend || "";
  document.getElementById("readyForTraining").textContent = o.readyForTraining;
  document.getElementById("readyForTrainingTrend").textContent = o.readyForTrainingTrend || "";
}

async function loadIntrusionCases() {
  const q = query(collection(db, PATHS.intrusionCases), orderBy("detectedAt", "desc"), limit(10));
  const snap = await getDocs(q);
  const body = document.getElementById("casesBody");

  if (snap.empty) {
    body.innerHTML = `<tr><td colspan="6" class="empty-note">No intrusion cases yet.</td></tr>`;
    return;
  }

  body.innerHTML = snap.docs
    .map((d) => {
      const c = d.data();
      return `
        <tr>
          <td>${escapeHtml(c.caseId)}</td>
          <td>${escapeHtml(c.source)}</td>
          <td>${escapeHtml(c.type)}</td>
          <td>${formatDate(c.detectedAt)}</td>
          <td><span class="risk-tag ${escapeHtml((c.risk || "").toLowerCase())}">${escapeHtml(c.risk)}</span></td>
          <td><span class="status-pill">${escapeHtml(c.status)}</span></td>
        </tr>`;
    })
    .join("");
}

// ---------------------------------------------------------------------------
// Scam checker — small client-side keyword heuristic (swap for a real model
// or a Cloud Function later). Every check is also logged to the
// `scamChecks` collection so you can review what admins have been testing.
// ---------------------------------------------------------------------------
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

function analyzeScamText(content) {
  const lower = content.toLowerCase();
  const reasons = [];
  let score = 10;

  for (const [phrase, weight] of Object.entries(RED_FLAGS)) {
    if (lower.includes(phrase)) {
      score += weight;
      reasons.push(`Contains phrase associated with scams: \u201c${phrase}\u201d`);
    }
  }
  score = Math.min(score, 98);

  let verdict = "Likely safe";
  if (score >= 60) verdict = "Likely scam";
  else if (score >= 30) verdict = "Suspicious";

  if (reasons.length === 0) reasons.push("No known scam patterns detected in the text.");

  return { verdict, confidence: score, reasons };
}

async function runScamCheck() {
  const input = document.getElementById("scamInput");
  const resultEl = document.getElementById("scamResult");
  const content = input.value.trim();
  if (!content) {
    input.focus();
    return;
  }

  const btn = document.getElementById("checkBtn");
  btn.disabled = true;
  btn.textContent = "Checking\u2026";

  try {
    const result = analyzeScamText(content);

    const cls = result.verdict.toLowerCase().replace(/\s+/g, "-");
    resultEl.className = `scam-result ${cls}`;
    resultEl.hidden = false;
    resultEl.innerHTML = `
      <div class="verdict">${escapeHtml(result.verdict)} \u00b7 ${result.confidence}% confidence</div>
      <ul>${result.reasons.map((r) => `<li>${escapeHtml(r)}</li>`).join("")}</ul>
    `;

    await addDoc(collection(db, PATHS.scamChecks), {
      content,
      verdict: result.verdict,
      confidence: result.confidence,
      reasons: result.reasons,
      checkedAt: serverTimestamp(),
    });
  } catch (err) {
    console.error("Scam check failed:", err);
    showToast("Couldn't save that check \u2014 check the console.");
  } finally {
    btn.disabled = false;
    btn.textContent = "Check";
  }
}