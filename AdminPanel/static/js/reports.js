import {
  doc,
  getDoc,
  updateDoc,
  collection,
  getDocs,
  addDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";
import { db } from "./firebase-config.js";
import {
  PATHS,
  SCAM_TYPES,
  t,
  toDate,
  formatDate,
  timeAgo,
  escapeHtml,
  capitalize,
  truncate,
  riskOf,
  channelLabel,
  modelLabel,
  agreesWithModel,
  toCsv,
  downloadText,
} from "./firestore-helpers.js";
import { initShell, getAdmin, logAudit, runMlCheck, refreshPendingBadge } from "./admin-core.js";

const SAMPLE_SIZE = 500;
const PAGE_SIZE = 10;

let allScans = [];
let page = 1;
const filters = { q: "", status: "all", channel: "all", risk: "all", sort: "new" };

const $ = (id) => document.getElementById(id);

document.addEventListener("DOMContentLoaded", async () => {
  await initShell();

  // Filters can be pre-set from the URL: /reports?status=pending&case=<id>
  const params = new URLSearchParams(window.location.search);
  if (["pending", "verified", "rejected"].includes(params.get("status"))) {
    filters.status = params.get("status");
    $("fStatus").value = filters.status;
  }

  $("fSearch").addEventListener("input", (e) => {
    filters.q = e.target.value;
    page = 1;
    renderCasesTable();
  });
  for (const [id, key] of [["fStatus", "status"], ["fChannel", "channel"], ["fRisk", "risk"], ["fSort", "sort"]]) {
    $(id).addEventListener("change", (e) => {
      filters[key] = e.target.value;
      page = 1;
      renderCasesTable();
    });
  }
  $("prevBtn").addEventListener("click", () => { page--; renderCasesTable(); });
  $("nextBtn").addEventListener("click", () => { page++; renderCasesTable(); });

  $("casesBody").addEventListener("click", (e) => {
    const row = e.target.closest("tr[data-row-id]");
    if (row) openCase(row.dataset.rowId);
  });
  $("exportViewBtn").addEventListener("click", exportView);
  $("exportTrainBtn").addEventListener("click", exportTraining);
  $("checkBtn").addEventListener("click", runScamCheck);
  $("clearBtn").addEventListener("click", clearChecker);
  document.addEventListener("ts:lang", () => { renderOverview(); renderCasesTable(); loadLog(); });

  await loadScans();
  loadLog();

  const caseId = params.get("case");
  if (caseId) openCase(caseId);
});

async function loadScans() {
  try {
    const q = query(collection(db, PATHS.reportedScams), orderBy("timestamp", "desc"), limit(SAMPLE_SIZE));
    const snap = await getDocs(q);
    allScans = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    renderOverview();
    renderCasesTable();
  } catch (err) {
    console.error("Failed to load reports data from Firestore:", err);
    showToast("Couldn't load reports data — check the console.");
  }
}

// ---------------------------------------------------------------------------
// Overview cards
// ---------------------------------------------------------------------------
function statusOf(s) {
  return s.status || "pending";
}

function renderOverview() {
  const pending = allScans.filter((s) => statusOf(s) === "pending").length;
  const ready = allScans.filter((s) => s.usedInTraining === true).length;
  const rejected = allScans.filter((s) => statusOf(s) === "rejected").length;
  const judged = allScans.map(agreesWithModel).filter((v) => v !== null);
  const corrections = judged.filter((v) => v === false).length;

  $("totalNewCases").textContent = pending;
  $("totalNewCasesTrend").textContent = t("Pending review");
  $("readyForTraining").textContent = ready;
  $("readyForTrainingTrend").textContent = t("Verified");
  $("rejectedCount").textContent = rejected;
  $("rejectedTrend").textContent = `${allScans.length} ${t("Total Reports").toLowerCase()}`;
  $("correctionCount").textContent = corrections;
  $("correctionTrend").textContent = judged.length ? `${judged.length} ${t("Verified").toLowerCase()}` : t("No verified cases yet");
}

// ---------------------------------------------------------------------------
// Cases table (filters + pagination)
// ---------------------------------------------------------------------------
function filteredScans() {
  const q = filters.q.trim().toLowerCase();
  const rows = allScans.filter((s) => {
    if (filters.status !== "all" && statusOf(s) !== filters.status) return false;
    if (filters.channel !== "all" && String(s.channel || "").toLowerCase() !== filters.channel) return false;
    if (filters.risk !== "all" && riskOf(s) !== filters.risk) return false;
    if (q && !(String(s.text || "").toLowerCase().includes(q) || s.id.toLowerCase().includes(q))) return false;
    return true;
  });
  const time = (s) => toDate(s.timestamp)?.getTime() || 0;
  rows.sort((a, b) => (filters.sort === "old" ? time(a) - time(b) : time(b) - time(a)));
  return rows;
}

function statusCell(s) {
  const st = statusOf(s);
  if (st === "verified") {
    const wrong = agreesWithModel(s) === false;
    return `<span class="status-pill status-verified">${escapeHtml(t("Verified"))} ✓</span>${
      wrong ? ` <span class="tag-corrected" title="The admin label differs from the model">${escapeHtml(t("Model Corrections"))}</span>` : ""
    }`;
  }
  if (st === "rejected") return `<span class="status-pill status-rejected">${escapeHtml(t("Rejected"))}</span>`;
  return `<span class="status-pill status-pending">${escapeHtml(t("Pending"))}</span>`;
}

function renderCasesTable() {
  const body = $("casesBody");
  const rows = filteredScans();
  const pages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  page = Math.min(Math.max(1, page), pages);
  const slice = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  if (slice.length === 0) {
    body.innerHTML = `<tr><td colspan="8" class="empty-note">${escapeHtml(
      allScans.length === 0 ? "No cases reported from the mobile app yet." : t("No cases match your filters.")
    )}</td></tr>`;
  } else {
    body.innerHTML = slice
      .map((s) => {
        const risk = riskOf(s);
        const pending = statusOf(s) === "pending";
        return `
        <tr data-row-id="${escapeHtml(s.id)}" class="clickable-row">
          <td><code>${escapeHtml(s.id.slice(0, 8))}</code></td>
          <td class="msg-cell">${escapeHtml(truncate(s.text, 60))}</td>
          <td>${escapeHtml(channelLabel(s.channel))}</td>
          <td>${escapeHtml(capitalize(s.category || ""))}</td>
          <td>${escapeHtml(formatDate(s.timestamp))}</td>
          <td><span class="risk-tag ${escapeHtml(risk)}">${escapeHtml(t(capitalize(risk)))}</span></td>
          <td>${statusCell(s)}</td>
          <td><button type="button" class="btn-link" data-open="${escapeHtml(s.id)}">${escapeHtml(t(pending ? "Review" : "View"))}</button></td>
        </tr>`;
      })
      .join("");
  }

  const from = rows.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const to = Math.min(rows.length, page * PAGE_SIZE);
  $("pagerInfo").textContent = `${from}–${to} / ${rows.length}`;
  $("prevBtn").disabled = page <= 1;
  $("nextBtn").disabled = page >= pages;
}

// ---------------------------------------------------------------------------
// Case detail + review
// ---------------------------------------------------------------------------
async function findCase(id) {
  let s = allScans.find((x) => x.id === id);
  if (s) return s;
  try {
    const snap = await getDoc(doc(db, PATHS.reportedScams, id));
    if (snap.exists()) {
      s = { id: snap.id, ...snap.data() };
      allScans.push(s);
      return s;
    }
  } catch (err) {
    console.error("Could not load case:", err);
  }
  return null;
}

async function openCase(id) {
  const s = await findCase(id);
  if (!s) {
    showToast("Case not found");
    return;
  }

  const st = statusOf(s);
  const risk = riskOf(s);
  const reasons = s.mlPrediction?.reasons || [];
  const reviewed = st !== "pending";
  const defaultLabel = s.finalLabel || modelLabel(s);
  const typeOptions = SCAM_TYPES.map(
    (x) => `<option value="${escapeHtml(x)}" ${x === (s.scamType || "Miscellaneous Scam") ? "selected" : ""}>${escapeHtml(x)}</option>`
  ).join("");

  const html = `
    <dl class="case-grid">
      <div><dt>${escapeHtml(t("Case ID"))}</dt><dd><code>${escapeHtml(s.id)}</code></dd></div>
      <div><dt>${escapeHtml(t("Channel"))}</dt><dd>${escapeHtml(channelLabel(s.channel))}</dd></div>
      <div><dt>${escapeHtml(t("Reported from"))}</dt><dd>${s.mode === "simple" ? "Simple Mode" : "Standard"}</dd></div>
      <div><dt>${escapeHtml(t("Detected on"))}</dt><dd>${escapeHtml(formatDate(s.timestamp))} <span class="muted-note">(${escapeHtml(timeAgo(s.timestamp))})</span></dd></div>
      <div><dt>${escapeHtml(t("Status"))}</dt><dd>${statusCell(s)}</dd></div>
    </dl>

    <h3 class="modal-h">${escapeHtml(t("Reported message"))}</h3>
    <pre class="case-text" tabindex="0">${escapeHtml(s.text || "")}</pre>

    <h3 class="modal-h">${escapeHtml(t("Mobile app result"))}</h3>
    <div class="case-ml">
      <span class="risk-tag ${escapeHtml(risk)}">${escapeHtml(t(capitalize(risk)))}</span>
      <span>${escapeHtml(t("Confidence"))}: <strong>${s.mlPrediction?.confidence ?? "—"}%</strong></span>
      <span>${escapeHtml(t("Category"))}: <strong>${escapeHtml(capitalize(s.category || ""))}</strong></span>
    </div>
    ${reasons.length ? `<ul class="reason-list">${reasons.map((r) => `<li>${escapeHtml(r)}</li>`).join("")}</ul>` : ""}

    <h3 class="modal-h">${escapeHtml(t("Current model"))}</h3>
    <div class="recheck">
      <button type="button" class="btn btn-ghost btn-sm" id="recheckBtn">${escapeHtml(t("Re-run ML check"))}</button>
      <div id="recheckOut" class="recheck-out" aria-live="polite"></div>
    </div>

    <h3 class="modal-h">${escapeHtml(t("Admin review"))}</h3>
    ${
      reviewed
        ? `<div class="review-summary">
            <p>${statusCell(s)}${s.finalLabel ? ` · <strong>${escapeHtml(s.finalLabel)}</strong>${s.scamType ? ` · ${escapeHtml(s.scamType)}` : ""}` : ""}</p>
            ${s.reviewedBy ? `<p class="muted-note">${escapeHtml(t("Reviewed by"))} ${escapeHtml(s.reviewedBy)} · ${escapeHtml(formatDate(s.reviewedAt))}</p>` : ""}
            ${s.adminNotes ? `<p class="admin-notes">${escapeHtml(s.adminNotes)}</p>` : ""}
            <div class="modal-actions"><button type="button" class="btn btn-ghost" id="reopenBtn">${escapeHtml(t("Reopen case"))}</button></div>
           </div>`
        : `<form id="reviewForm" class="review-form">
            <fieldset class="seg-radio">
              <legend>${escapeHtml(t("Final label"))}</legend>
              <label><input type="radio" name="finalLabel" value="Scam" ${defaultLabel === "Scam" ? "checked" : ""}> <span>${escapeHtml(t("Scam"))}</span></label>
              <label><input type="radio" name="finalLabel" value="Not Scam" ${defaultLabel === "Not Scam" ? "checked" : ""}> <span>${escapeHtml(t("Not scam"))}</span></label>
            </fieldset>
            <label class="field-col"><span>${escapeHtml(t("Scam type"))}</span>
              <select id="scamType" class="input">${typeOptions}</select>
            </label>
            <label class="field-col"><span>${escapeHtml(t("Notes (optional)"))}</span>
              <textarea id="adminNotes" class="input" rows="2" maxlength="500"></textarea>
            </label>
            <div class="modal-actions">
              <button type="submit" class="btn btn-blue" autofocus>${escapeHtml(t("Verify — ready for training"))}</button>
              <button type="button" class="btn btn-red" id="rejectBtn">${escapeHtml(t("Reject"))}</button>
            </div>
           </form>`
    }`;

  const dlg = window.TS.dialog({ title: t("Case details"), html, wide: true });
  const root = dlg.body;

  root.querySelector("#recheckBtn").addEventListener("click", () => recheck(s, root));

  if (reviewed) {
    root.querySelector("#reopenBtn").addEventListener("click", async () => {
      await saveReview(s, {
        status: "pending",
        usedInTraining: false,
        finalLabel: null,
        scamType: null,
        adminNotes: null,
      }, "case_reopened", {});
      dlg.close();
    });
    return;
  }

  const form = root.querySelector("#reviewForm");
  const typeSel = root.querySelector("#scamType");
  const syncType = () => {
    typeSel.disabled = form.finalLabel.value === "Not Scam";
  };
  form.addEventListener("change", syncType);
  syncType();

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const finalLabel = form.finalLabel.value;
    const scamType = finalLabel === "Scam" ? typeSel.value : null;
    await saveReview(s, {
      status: "verified",
      usedInTraining: true,
      finalLabel,
      scamType,
      adminNotes: root.querySelector("#adminNotes").value.trim() || null,
    }, "case_verified", { finalLabel, scamType });
    dlg.close();
  });

  root.querySelector("#rejectBtn").addEventListener("click", async () => {
    await saveReview(s, {
      status: "rejected",
      usedInTraining: false,
      finalLabel: null,
      scamType: null,
      adminNotes: root.querySelector("#adminNotes").value.trim() || null,
    }, "case_rejected", {});
    dlg.close();
  });
}

async function recheck(scan, root) {
  const out = root.querySelector("#recheckOut");
  const btn = root.querySelector("#recheckBtn");
  btn.disabled = true;
  out.textContent = "…";
  const res = await runMlCheck(scan.text || "");
  btn.disabled = false;
  out.innerHTML = renderCheckResult(res, { compact: true });
}

async function saveReview(scan, fields, action, auditExtra) {
  try {
    const admin = (await getAdmin()) || {};
    const payload = {
      ...fields,
      reviewedBy: admin.username || "unknown",
      reviewedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    await updateDoc(doc(db, PATHS.reportedScams, scan.id), payload);

    Object.assign(scan, fields, { reviewedBy: payload.reviewedBy, reviewedAt: new Date() });
    logAudit(action, { caseId: scan.id, ...auditExtra });
    refreshPendingBadge();
    renderOverview();
    renderCasesTable();
    loadLog();
    showToast(
      action === "case_verified" ? "Case marked ready for training" : action === "case_rejected" ? "Case rejected" : "Case reopened"
    );
  } catch (err) {
    console.error("Failed to update case:", err);
    showToast("Couldn't update that case — check the console.");
  }
}

// ---------------------------------------------------------------------------
// CSV export
// ---------------------------------------------------------------------------
// Rows use the same columns as MachineLearningTraining/data/TruScanDATASET.csv so
// the file can be added straight to DATASETS in 01_preprocess.py.
function trainingRow(s) {
  const ch = String(s.channel || "sms").toLowerCase();
  const hasUrl = /(https?:\/\/|www\.)/i.test(s.text || "");
  const source = ch === "email" ? "email" : ch === "link" ? "web" : "SMS";
  const contentType = ch === "email" ? "emails" : ch === "link" ? "URL" : hasUrl ? "Message + URL" : "Message";
  const label = s.finalLabel || modelLabel(s);
  return [s.text, source, contentType, label, label === "Scam" ? s.scamType || "Miscellaneous Scam" : "", "Verified"];
}

async function exportTraining() {
  const btn = $("exportTrainBtn");
  btn.disabled = true;
  try {
    // Query every verified case (not just the 500 shown in the table).
    const snap = await getDocs(query(collection(db, PATHS.reportedScams), where("usedInTraining", "==", true)));
    const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() })).filter((s) => (s.text || "").trim());
    if (rows.length === 0) {
      showToast("No verified cases to export yet");
      return;
    }
    const legacy = rows.filter((s) => !s.finalLabel).length;
    const csv = toCsv(
      ["text", "source", "content_type", "label", "scam_type", "review_status"],
      rows.map(trainingRow)
    );
    const stamp = new Date().toISOString().slice(0, 10);
    downloadText(`truscan_verified_reports_${stamp}.csv`, csv);
    logAudit("export_training_csv", { rows: rows.length });
    loadLog();
    showToast(
      `Exported ${rows.length} training rows` + (legacy ? ` (${legacy} verified before labels existed use the app's category)` : "")
    );
  } catch (err) {
    console.error("Export failed:", err);
    showToast("Couldn't export — check the console.");
  } finally {
    btn.disabled = false;
  }
}

function exportView() {
  const rows = filteredScans();
  if (rows.length === 0) {
    showToast("Nothing to export");
    return;
  }
  const csv = toCsv(
    ["case_id", "text", "channel", "category", "risk", "confidence", "status", "final_label", "scam_type", "reviewed_by", "detected"],
    rows.map((s) => [
      s.id,
      s.text,
      s.channel,
      s.category,
      riskOf(s),
      s.mlPrediction?.confidence ?? "",
      statusOf(s),
      s.finalLabel || "",
      s.scamType || "",
      s.reviewedBy || "",
      toDate(s.timestamp)?.toISOString() || "",
    ])
  );
  downloadText(`truscan_reports_${new Date().toISOString().slice(0, 10)}.csv`, csv);
  logAudit("export_view_csv", { rows: rows.length });
  loadLog();
}

// ---------------------------------------------------------------------------
// Scam checker (real ML model; keyword fallback if the backend is down)
// ---------------------------------------------------------------------------
function renderCheckResult(res, { compact = false } = {}) {
  const cls = { high: "likely-scam", medium: "suspicious", low: "likely-safe" }[res.tier];
  const reasons = (res.reasons || []).map((r) => `<li>${escapeHtml(r)}</li>`).join("");
  const sourceNote =
    res.source === "ml"
      ? `<span class="muted-note">ML model</span>`
      : `<span class="warn-note">Backend unreachable (${escapeHtml(res.error || "offline")}) — showing offline keyword check, not the trained model.</span>`;
  return `
    <div class="check-result ${cls}">
      <div class="verdict">${escapeHtml(t(res.verdict))} · ${Math.round(res.score)}% scam risk</div>
      ${!compact && res.explanation ? `<p class="check-expl">${escapeHtml(res.explanation)}</p>` : ""}
      <ul>${reasons}</ul>
      <div class="check-source">${sourceNote}</div>
    </div>`;
}

function clearChecker() {
  $("scamInput").value = "";
  const resultEl = $("scamResult");
  resultEl.hidden = true;
  resultEl.innerHTML = "";
}

async function runScamCheck() {
  const input = $("scamInput");
  const resultEl = $("scamResult");
  const content = input.value.trim();
  if (!content) {
    input.focus();
    return;
  }

  const btn = $("checkBtn");
  btn.disabled = true;
  resultEl.hidden = false;
  resultEl.className = "scam-result";
  resultEl.textContent = "…";

  try {
    const res = await runMlCheck(content);
    resultEl.className = "scam-result";
    resultEl.innerHTML = renderCheckResult(res);

    await addDoc(collection(db, PATHS.scamChecks), {
      content,
      verdict: res.verdict,
      riskScore: Math.round(res.score),
      tier: res.tier,
      source: res.source,
      reasons: res.reasons,
      checkedBy: (await getAdmin())?.username || "unknown",
      checkedAt: serverTimestamp(),
    });
  } catch (err) {
    console.error("Scam check failed:", err);
    showToast("Couldn't save that check — check the console.");
  } finally {
    btn.disabled = false;
  }
}

// ---------------------------------------------------------------------------
// Activity log
// ---------------------------------------------------------------------------
function describeAction(l) {
  const id = l.caseId ? ` ${String(l.caseId).slice(0, 8)}` : "";
  switch (l.action) {
    case "case_verified": return `verified case${id} as ${l.finalLabel || "?"}${l.scamType ? ` (${l.scamType})` : ""}`;
    case "case_rejected": return `rejected case${id}`;
    case "case_reopened": return `reopened case${id}`;
    case "export_training_csv": return `exported ${l.rows ?? "?"} training rows`;
    case "export_view_csv": return `exported ${l.rows ?? "?"} rows from the reports table`;
    case "profile_updated": return "updated their profile";
    case "preferences_updated": return "changed preferences";
    default: return l.action || "did something";
  }
}

async function loadLog() {
  const list = $("logList");
  try {
    const snap = await getDocs(query(collection(db, PATHS.auditLogs), orderBy("timestamp", "desc"), limit(15)));
    if (snap.empty) {
      list.innerHTML = `<li class="empty-note">${escapeHtml(t("No activity yet."))}</li>`;
      return;
    }
    list.innerHTML = snap.docs
      .map((d) => {
        const l = d.data();
        return `<li><span class="log-text"><strong>${escapeHtml(l.admin || "?")}</strong> ${escapeHtml(describeAction(l))}</span><span class="log-time">${escapeHtml(timeAgo(l.timestamp))}</span></li>`;
      })
      .join("");
  } catch (err) {
    console.warn("Could not load activity log:", err);
    list.innerHTML = `<li class="empty-note">${escapeHtml(t("No activity yet."))}</li>`;
  }
}
