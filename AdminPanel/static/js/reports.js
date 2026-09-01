import {
  doc,
  updateDoc,
  collection,
  getDocs,
  addDoc,
  query,
  orderBy,
  limit,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";
import { db } from "./firebase-config.js";
import { PATHS, formatDate, escapeHtml, capitalize, truncate } from "./firestore-helpers.js";

const SAMPLE_SIZE = 300;
const TABLE_SIZE = 15;

let allScans = [];
let reviewingCaseId = null; // set when a table row's "Review" button is clicked

document.addEventListener("DOMContentLoaded", async () => {
  try {
    allScans = await loadRecentScans();
    renderOverview(allScans);
    renderCasesTable(allScans);
  } catch (err) {
    console.error("Failed to load reports data from Firestore:", err);
    showToast("Couldn't load reports data \u2014 check the console.");
  }

  document.getElementById("checkBtn").addEventListener("click", runScamCheck);
  document.getElementById("clearBtn").addEventListener("click", clearChecker);
});

async function loadRecentScans() {
  const q = query(collection(db, PATHS.reportedScams), orderBy("timestamp", "desc"), limit(SAMPLE_SIZE));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

function renderOverview(scans) {
  const totalNewCases = scans.filter((s) => s.status === "pending").length;
  const readyForTraining = scans.filter((s) => s.usedInTraining === true).length;

  document.getElementById("totalNewCases").textContent = totalNewCases;
  document.getElementById("totalNewCasesTrend").textContent = "Awaiting review";
  document.getElementById("readyForTraining").textContent = readyForTraining;
  document.getElementById("readyForTrainingTrend").textContent = "Verified by admin";
}

function renderCasesTable(scans) {
  const body = document.getElementById("casesBody");
  const rows = scans.slice(0, TABLE_SIZE);

  if (rows.length === 0) {
    body.innerHTML = `<tr><td colspan="6" class="empty-note">No cases reported from the mobile app yet.</td></tr>`;
    return;
  }

  body.innerHTML = rows
    .map((s) => {
      const risk = s.mlPrediction?.riskLevel || "medium";
      let actionCell;
      if (s.status === "pending") {
        actionCell = `<button class="btn-link review-btn" data-id="${escapeHtml(s.id)}">Review</button>`;
      } else if (s.status === "verified") {
        actionCell = `<span class="status-pill status-verified">Verified\u2713</span>`;
      } else if (s.status === "rejected") {
        actionCell = `<span class="status-pill status-rejected">Rejected</span>`;
      } else {
        actionCell = `<span class="status-pill">${escapeHtml(s.status || "")}</span>`;
      }

      return `
        <tr data-row-id="${escapeHtml(s.id)}">
          <td>${escapeHtml(s.id.slice(0, 8))}</td>
          <td>${escapeHtml(capitalize(s.channel || "unknown"))}</td>
          <td>${escapeHtml(capitalize(s.category || ""))}</td>
          <td>${formatDate(s.timestamp)}</td>
          <td><span class="risk-tag ${escapeHtml(risk)}">${escapeHtml(capitalize(risk))}</span></td>
          <td>${actionCell}</td>
        </tr>`;
    })
    .join("");

  body.querySelectorAll(".review-btn").forEach((btn) => {
    btn.addEventListener("click", () => startReview(btn.dataset.id));
  });
}

// ---------------------------------------------------------------------------
// Review workflow: clicking "Review" on a pending case loads its text into
// the Scam Checker. Running Check shows the usual verdict, plus two extra
// buttons to mark the case verified (ready for training) or rejected.
// ---------------------------------------------------------------------------
function startReview(caseId) {
  const scan = allScans.find((s) => s.id === caseId);
  if (!scan) return;

  reviewingCaseId = caseId;
  document.getElementById("scamInput").value = scan.text || "";

  let banner = document.getElementById("reviewBanner");
  if (!banner) {
    banner = document.createElement("div");
    banner.id = "reviewBanner";
    banner.className = "review-banner";
    document.querySelector(".scam-checker").insertBefore(banner, document.getElementById("scamInput"));
  }
  banner.innerHTML = `Reviewing case <strong>${escapeHtml(caseId.slice(0, 8))}</strong> \u2014 run Check, then Verify or Reject below. <button type="button" id="cancelReviewBtn" class="btn-link">Cancel</button>`;
  document.getElementById("cancelReviewBtn").addEventListener("click", clearChecker);

  document.querySelector(".scam-checker").scrollIntoView({ behavior: "smooth", block: "center" });
}

function clearChecker() {
  reviewingCaseId = null;
  document.getElementById("scamInput").value = "";
  const resultEl = document.getElementById("scamResult");
  resultEl.hidden = true;
  resultEl.innerHTML = "";
  const banner = document.getElementById("reviewBanner");
  if (banner) banner.remove();
}

async function setCaseStatus(caseId, status) {
  try {
    await updateDoc(doc(db, PATHS.reportedScams, caseId), {
      status,
      usedInTraining: status === "verified",
      updatedAt: serverTimestamp(),
    });
    showToast(status === "verified" ? "Case marked ready for training" : "Case rejected");

    const scan = allScans.find((s) => s.id === caseId);
    if (scan) {
      scan.status = status;
      scan.usedInTraining = status === "verified";
    }
    renderOverview(allScans);
    renderCasesTable(allScans);
    clearChecker();
  } catch (err) {
    console.error("Failed to update case status:", err);
    showToast("Couldn't update that case \u2014 check the console.");
  }
}

// ---------------------------------------------------------------------------
// Scam checker — small client-side keyword heuristic (swap for a call into
// your ML backend / analyze.py later). Every check is logged to the
// `scamChecks` collection.
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

    let actionsHtml = "";
    if (reviewingCaseId) {
      actionsHtml = `
        <div class="scam-result-actions">
          <button type="button" id="verifyCaseBtn" class="btn btn-blue">Mark ready for training</button>
          <button type="button" id="rejectCaseBtn" class="btn btn-red">Reject case</button>
        </div>`;
    }

    resultEl.innerHTML = `
      <div class="verdict">${escapeHtml(result.verdict)} \u00b7 ${result.confidence}% confidence</div>
      <ul>${result.reasons.map((r) => `<li>${escapeHtml(r)}</li>`).join("")}</ul>
      ${actionsHtml}
    `;

    if (reviewingCaseId) {
      const caseId = reviewingCaseId;
      document.getElementById("verifyCaseBtn").addEventListener("click", () => setCaseStatus(caseId, "verified"));
      document.getElementById("rejectCaseBtn").addEventListener("click", () => setCaseStatus(caseId, "rejected"));
    }

    await addDoc(collection(db, PATHS.scamChecks), {
      content,
      verdict: result.verdict,
      confidence: result.confidence,
      reasons: result.reasons,
      relatedCaseId: reviewingCaseId,
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