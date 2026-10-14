import {
  collection,
  getDocs,
  query,
  orderBy,
  limit,
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";
import { db } from "./firebase-config.js";
import {
  PATHS,
  t,
  toDate,
  timeAgo,
  dayKey,
  escapeHtml,
  capitalize,
  truncate,
  riskOf,
  channelLabel,
  isFlagged,
  agreesWithModel,
} from "./firestore-helpers.js";
import { initShell, fetchModelInfo } from "./admin-core.js";

// Bounded recent window keeps this fast and needs no composite indexes.
// Fine while scan volume is low; swap for aggregation queries / a rollup doc later.
const SAMPLE_SIZE = 500;
const REFRESH_MS = 60000;

let allScans = [];
let range = "all"; // "7" | "30" | "all"
try {
  range = localStorage.getItem("ts-dash-range") || "all";
} catch (e) {}
if (!["7", "30", "all"].includes(range)) range = "all";

const $ = (id) => document.getElementById(id);

document.addEventListener("DOMContentLoaded", async () => {
  await initShell();

  $("rangeSwitch").addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-range]");
    if (!btn) return;
    range = btn.dataset.range;
    try {
      localStorage.setItem("ts-dash-range", range);
    } catch (err) {}
    render();
  });
  $("refreshBtn").addEventListener("click", load);
  document.addEventListener("ts:lang", render);

  document.addEventListener("click", (e) => {
    const item = e.target.closest("[data-case]");
    if (item) window.location.href = `/reports?case=${encodeURIComponent(item.dataset.case)}`;
  });
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Enter") return;
    const item = e.target.closest && e.target.closest("[data-case]");
    if (item) window.location.href = `/reports?case=${encodeURIComponent(item.dataset.case)}`;
  });

  await load();
  loadModelPanel();
  setInterval(() => {
    if (!document.hidden) load();
  }, REFRESH_MS);
});

async function load() {
  const btn = $("refreshBtn");
  btn.disabled = true;
  try {
    const q = query(collection(db, PATHS.reportedScams), orderBy("timestamp", "desc"), limit(SAMPLE_SIZE));
    const snap = await getDocs(q);
    allScans = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    $("lastUpdated").textContent = `${t("Updated")} ${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
    render();
  } catch (err) {
    console.error("Failed to load dashboard data from Firestore:", err);
    showToast("Couldn't load dashboard data — check the console.");
  } finally {
    btn.disabled = false;
  }
}

function inRange(scan) {
  if (range === "all") return true;
  const d = toDate(scan.timestamp);
  if (!d) return false;
  return Date.now() - d.getTime() <= Number(range) * 86400000;
}

function render() {
  document.querySelectorAll("#rangeSwitch button").forEach((b) => {
    const on = b.dataset.range === range;
    b.classList.toggle("active", on);
    b.setAttribute("aria-pressed", String(on));
  });

  const scans = allScans.filter(inRange);
  renderMetrics(scans);
  renderTimeline(scans);
  renderBreakdown(scans);
  renderFlaggedScams(scans);
  renderRiskIndicators(scans);
}

// ---------------------------------------------------------------------------
// Metrics
// ---------------------------------------------------------------------------
function renderMetrics(scans) {
  const total = scans.length;
  const flagged = scans.filter(isFlagged);
  const rate = total > 0 ? ((flagged.length / total) * 100).toFixed(1) : "0.0";
  const active = flagged.filter((s) => (s.status || "pending") === "pending").length;

  $("detectionRate").textContent = `${rate}%`;
  $("detectionTrend").textContent = total > 0 ? `${flagged.length} / ${total}` : "—";

  $("activeThreats").textContent = active;
  $("activeThreatsTrend").textContent = active > 0 ? t("needs attention") : t("Pending review");

  $("totalReports").textContent = total;
  $("totalReportsTrend").textContent = `${scans.filter((s) => s.status === "verified").length} ${t("Verified").toLowerCase()} · ${scans.filter((s) => s.status === "rejected").length} ${t("Rejected").toLowerCase()}`;

  const judged = scans.map(agreesWithModel).filter((v) => v !== null);
  if (judged.length === 0) {
    $("modelAgreement").textContent = "—";
    $("modelAgreementTrend").textContent = t("No verified cases yet");
  } else {
    const agree = judged.filter(Boolean).length;
    $("modelAgreement").textContent = `${Math.round((agree / judged.length) * 100)}%`;
    $("modelAgreementTrend").textContent = `${agree} / ${judged.length} ${t("Verified").toLowerCase()}`;
  }
}

// ---------------------------------------------------------------------------
// Reports over time (stacked bars, inline SVG)
// ---------------------------------------------------------------------------
function renderTimeline(scans) {
  const el = $("timelineChart");
  if (scans.length === 0) {
    el.innerHTML = `<p class="empty-note">${escapeHtml(t("No reports in this period."))}</p>`;
    return;
  }

  let days;
  if (range === "all") {
    const times = scans.map((s) => toDate(s.timestamp)?.getTime()).filter(Boolean);
    const spanDays = times.length ? Math.ceil((Date.now() - Math.min(...times)) / 86400000) + 1 : 7;
    days = Math.min(60, Math.max(7, spanDays));
  } else {
    days = Number(range);
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const keys = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    keys.push({ key: dayKey(d), date: d });
  }
  const counts = Object.fromEntries(keys.map((k) => [k.key, { flagged: 0, safe: 0 }]));
  for (const s of scans) {
    const d = toDate(s.timestamp);
    if (!d) continue;
    const c = counts[dayKey(d)];
    if (c) isFlagged(s) ? c.flagged++ : c.safe++;
  }

  const peak = Math.max(1, ...keys.map((k) => counts[k.key].flagged + counts[k.key].safe));
  const step = peak <= 4 ? 1 : Math.ceil(peak / 4);
  const top = step * Math.ceil(peak / step);

  const W = 640, H = 200, padL = 30, padR = 8, padT = 10, padB = 24;
  const plotW = W - padL - padR, plotH = H - padT - padB;
  const slot = plotW / days;
  const barW = Math.max(3, Math.min(26, slot * 0.66));
  const y = (v) => padT + plotH - (v / top) * plotH;

  let svg = `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet" aria-hidden="true">`;
  for (let v = 0; v <= top; v += step) {
    svg += `<line x1="${padL}" x2="${W - padR}" y1="${y(v)}" y2="${y(v)}" class="grid"/>`;
    svg += `<text x="${padL - 6}" y="${y(v) + 3}" class="axis" text-anchor="end">${v}</text>`;
  }
  const labelEvery = days <= 7 ? 1 : days <= 14 ? 2 : days <= 30 ? 5 : 10;
  keys.forEach((k, i) => {
    const c = counts[k.key];
    const x = padL + slot * i + (slot - barW) / 2;
    const hF = plotH * (c.flagged / top);
    const hS = plotH * (c.safe / top);
    const tip = `${k.date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}: ${c.flagged} ${t("Flagged").toLowerCase()}, ${c.safe} ${t("Safe").toLowerCase()}`;
    if (c.flagged + c.safe > 0) {
      svg += `<g><title>${escapeHtml(tip)}</title>`;
      if (c.safe) svg += `<rect x="${x}" y="${y(c.safe + c.flagged) + hF}" width="${barW}" height="${hS}" rx="2" class="bar-safe"/>`;
      if (c.flagged) svg += `<rect x="${x}" y="${y(c.flagged)}" width="${barW}" height="${hF}" rx="2" class="bar-flagged"/>`;
      svg += `</g>`;
    }
    if ((days - 1 - i) % labelEvery === 0) {
      svg += `<text x="${x + barW / 2}" y="${H - 6}" class="axis" text-anchor="middle">${k.date.getMonth() + 1}/${k.date.getDate()}</text>`;
    }
  });
  svg += `</svg>`;
  el.innerHTML = svg;
}

// ---------------------------------------------------------------------------
// Breakdown bars
// ---------------------------------------------------------------------------
function bars(el, items) {
  const max = Math.max(1, ...items.map((i) => i.count));
  el.innerHTML = items
    .map((i) => {
      const pct = Math.round((i.count / max) * 100);
      return `
        <div class="dist-row">
          <span class="dist-label">${escapeHtml(i.label)}</span>
          <span class="dist-track"><span class="dist-fill ${i.cls || ""}" style="width:${pct}%"></span></span>
          <span class="dist-count">${i.count}</span>
        </div>`;
    })
    .join("");
}

function renderBreakdown(scans) {
  const ch = { sms: 0, email: 0, link: 0, other: 0 };
  for (const s of scans) {
    const c = String(s.channel || "").toLowerCase();
    if (c in ch) ch[c]++;
    else ch.other++;
  }
  const chItems = [
    { label: "SMS", count: ch.sms },
    { label: "Email", count: ch.email },
    { label: "Link", count: ch.link },
  ];
  if (ch.other) chItems.push({ label: capitalize(t("Other")) || "Other", count: ch.other });
  bars($("channelBars"), chItems);

  const rk = { high: 0, medium: 0, low: 0 };
  for (const s of scans) {
    const r = riskOf(s);
    rk[r === "safe" ? "low" : r]++;
  }
  bars($("riskBars"), [
    { label: t("High"), count: rk.high, cls: "fill-bad" },
    { label: t("Medium"), count: rk.medium, cls: "fill-warn" },
    { label: t("Low"), count: rk.low, cls: "fill-good" },
  ]);
}

// ---------------------------------------------------------------------------
// Recent flagged + indicators
// ---------------------------------------------------------------------------
function renderFlaggedScams(scans) {
  const list = $("flaggedList");
  const flagged = scans.filter(isFlagged).slice(0, 5);

  if (flagged.length === 0) {
    list.innerHTML = `<p class="empty-note">${escapeHtml(t("No flagged scams yet."))}</p>`;
    return;
  }

  list.innerHTML = flagged
    .map((s) => {
      const risk = riskOf(s);
      const title = `${capitalize(s.category)} · ${channelLabel(s.channel)}`;
      return `
        <div class="flagged-item clickable" data-case="${escapeHtml(s.id)}" tabindex="0" role="link">
          <div class="flagged-head">
            <span class="flagged-title">${escapeHtml(title)}</span>
            <span class="severity-pill ${escapeHtml(risk)}">${escapeHtml(t(capitalize(risk)))}</span>
          </div>
          <div class="flagged-desc">${escapeHtml(truncate(s.text))}</div>
          <div class="flagged-time">${escapeHtml(timeAgo(s.timestamp))}</div>
        </div>`;
    })
    .join("");
}

function renderRiskIndicators(scans) {
  const riskList = $("riskList");
  const tally = {};
  for (const s of scans.filter(isFlagged)) {
    for (const reason of s.mlPrediction?.reasons || []) {
      tally[reason] = (tally[reason] || 0) + 1;
    }
  }
  const ranked = Object.entries(tally)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);

  if (ranked.length === 0) {
    riskList.innerHTML = `<li class="empty-note">${escapeHtml(t("No risk indicators yet."))}</li>`;
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

// ---------------------------------------------------------------------------
// Model performance (from the backend's evaluation report)
// ---------------------------------------------------------------------------
async function loadModelPanel() {
  const panel = $("modelPanel");
  const res = await fetchModelInfo();

  if (!res.ok) {
    panel.innerHTML = `
      <div class="model-offline">
        <p><strong>${escapeHtml(t("Offline"))}</strong> — ${escapeHtml(window.TS.apiBase())}</p>
        <p class="muted-note">Start the backend (<code>uvicorn main:app --host 0.0.0.0 --port 8001</code>) and make sure <code>routes/model_info.py</code> is installed.</p>
        <button type="button" class="btn btn-ghost btn-sm" id="retryModel">${escapeHtml(t("Refresh"))}</button>
      </div>`;
    $("retryModel").addEventListener("click", loadModelPanel);
    return;
  }

  const m = res.data.metrics || {};
  const pct = (v) => (typeof v === "number" ? `${(v * 100).toFixed(1)}%` : "—");
  const trained = res.data.trained_at ? new Date(res.data.trained_at).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" }) : "—";
  const th = res.data.thresholds || {};

  panel.innerHTML = `
    <div class="model-grid">
      <div class="stat"><span class="stat-label">${escapeHtml(t("Accuracy"))}</span><span class="stat-value">${pct(m.accuracy)}</span></div>
      <div class="stat"><span class="stat-label">${escapeHtml(t("Precision"))}</span><span class="stat-value">${pct(m.precision)}</span></div>
      <div class="stat"><span class="stat-label">${escapeHtml(t("Recall"))}</span><span class="stat-value">${pct(m.recall)}</span></div>
      <div class="stat"><span class="stat-label">${escapeHtml(t("F1 Score"))}</span><span class="stat-value">${pct(m.f1_score)}</span></div>
    </div>
    <p class="muted-note model-meta">
      ${escapeHtml(res.data.model || "")} · ${m.test_samples ?? "—"} test messages · trained ${escapeHtml(trained)}
      ${th.high != null ? ` · High ≥ ${Math.round(th.high * 100)}% · Medium ≥ ${Math.round(th.low * 100)}% · Low < ${Math.round(th.low * 100)}%` : ""}
    </p>`;
}
