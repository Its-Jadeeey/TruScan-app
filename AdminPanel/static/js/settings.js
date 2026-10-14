import { doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";
import { db } from "./firebase-config.js";
import { adminDoc, escapeHtml, t } from "./firestore-helpers.js";
import {
  initShell,
  fillAdminChip,
  updateAdminCache,
  logAudit,
  fetchHealth,
  fetchModelInfo,
} from "./admin-core.js";

let admin = null;
const $ = (id) => document.getElementById(id);

document.addEventListener("DOMContentLoaded", async () => {
  admin = await initShell();
  if (!admin) return;

  try {
    await loadAdmin();
  } catch (err) {
    console.error("Failed to load settings from Firestore:", err);
    showToast("Couldn't load settings — check the console.");
  }

  $("profileForm").addEventListener("submit", saveProfile);
  $("lightModeToggle").addEventListener("change", savePreferences);
  $("languageSelect").addEventListener("change", savePreferences);

  $("apiUrl").value = localStorage.getItem("ts-api-base") || "";
  $("apiUrl").placeholder = window.TS.defaultApiBase();
  $("testApiBtn").addEventListener("click", checkStatus);
  $("saveApiBtn").addEventListener("click", () => {
    const v = $("apiUrl").value.trim();
    if (v && !/^https?:\/\//i.test(v)) {
      showToast("The URL must start with http:// or https://");
      return;
    }
    window.TS.setApiBase(v);
    showToast(v ? "Backend URL saved" : "Using the default backend URL");
    checkStatus();
  });
  $("resetApiBtn").addEventListener("click", () => {
    window.TS.setApiBase("");
    $("apiUrl").value = "";
    checkStatus();
  });
  document.addEventListener("ts:lang", checkStatus);

  document.querySelectorAll("[data-doc]").forEach((b) => b.addEventListener("click", () => openDoc(b.dataset.doc)));
  $("aboutBtn").addEventListener("click", openAbout);

  checkStatus();
});

async function loadAdmin() {
  const snap = await getDoc(doc(db, ...adminDoc(admin.username)));
  const data = snap.exists()
    ? snap.data()
    : { fullName: admin.username, email: "", phone: "", role: "Administrator", lightMode: false, language: "English" };

  $("fullName").value = data.fullName || "";
  $("email").value = data.email || "";
  $("phone").value = data.phone || "";
  $("role").value = data.role || "Administrator";
  document.querySelector(".avatar").textContent = (data.fullName || admin.username).charAt(0).toUpperCase();

  $("lightModeToggle").checked = !!data.lightMode;
  $("languageSelect").value = data.language || "English";
}

async function saveProfile(e) {
  e.preventDefault();
  const payload = {
    fullName: $("fullName").value.trim(),
    email: $("email").value.trim(),
    phone: $("phone").value.trim(),
  };

  try {
    await setDoc(doc(db, ...adminDoc(admin.username)), payload, { merge: true });
    const next = updateAdminCache(payload);
    fillAdminChip(next);
    document.querySelector(".avatar").textContent = (payload.fullName || admin.username).charAt(0).toUpperCase();
    const savedMsg = $("profileSavedMsg");
    savedMsg.hidden = false;
    setTimeout(() => (savedMsg.hidden = true), 2000);
    showToast("Profile saved");
    logAudit("profile_updated");
  } catch (err) {
    console.error("Failed to save profile:", err);
    showToast("Couldn't save profile — check the console.");
  }
}

async function savePreferences() {
  const payload = {
    lightMode: $("lightModeToggle").checked,
    language: $("languageSelect").value,
  };

  // Apply immediately; saving to Firestore keeps it for the next login/device.
  window.TS.applyTheme(payload.lightMode ? "light" : "dark");
  window.TS.setLanguage(payload.language);
  updateAdminCache(payload);

  try {
    await setDoc(doc(db, ...adminDoc(admin.username)), payload, { merge: true });
    showToast(t("Saved"));
    logAudit("preferences_updated", payload);
  } catch (err) {
    console.error("Failed to save preferences:", err);
    showToast("Couldn't save preferences — check the console.");
  }
}

// ---------------------------------------------------------------------------
// System status
// ---------------------------------------------------------------------------
function chip(el, ok, text) {
  el.textContent = text;
  el.className = `status-chip ${ok ? "ok" : "bad"}`;
}

async function checkStatus() {
  const apiEl = $("apiStatus");
  const modelEl = $("modelStatus");
  apiEl.className = modelEl.className = "status-chip";
  apiEl.textContent = modelEl.textContent = "…";

  const [health, model] = await Promise.all([fetchHealth(), fetchModelInfo()]);
  chip(apiEl, health.ok, health.ok ? `${t("Online")} · ${window.TS.apiBase()}` : `${t("Offline")} · ${window.TS.apiBase()}`);

  if (model.ok) {
    const trained = model.data.trained_at
      ? new Date(model.data.trained_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
      : "";
    chip(modelEl, true, `${model.data.model || "Model"}${trained ? ` · ${trained}` : ""}`);
  } else {
    chip(modelEl, false, health.ok ? "No model info (add routes/model_info.py)" : t("Offline"));
  }
}

// ---------------------------------------------------------------------------
// Support / About dialogs
// ---------------------------------------------------------------------------
const DOCS = {
  help: {
    title: "Help Center",
    html: `
      <h3 class="modal-h">Reviewing reports</h3>
      <ol class="doc-list">
        <li>Open <strong>Reports</strong>. New community submissions are <em>Pending</em>.</li>
        <li>Click a case to read the full message and what the mobile app predicted.</li>
        <li>Use <em>Re-run ML check</em> to see what the current model says.</li>
        <li>Choose the correct <strong>final label</strong> (and scam type), then <em>Verify</em>. Reject spam, duplicates, or unreadable reports.</li>
      </ol>
      <h3 class="modal-h">Retraining the model</h3>
      <ol class="doc-list">
        <li>On <strong>Reports</strong>, click <em>Export training CSV</em>. Only verified cases are included.</li>
        <li>Save the file in <code>MachineLearningTraining/data/</code> and add it to <code>DATASETS</code> in <code>01_preprocess.py</code>.</li>
        <li>Run <code>01_preprocess.py</code>, <code>02_train_model.py</code>, <code>03_evaluate.py</code>, then restart the backend.</li>
      </ol>
      <h3 class="modal-h">Cases the model got wrong</h3>
      <p>When your final label differs from the model's, the case is counted under <strong>Model Corrections</strong>. These are the most valuable rows for retraining.</p>`,
  },
  privacy: {
    title: "Privacy Policy",
    html: `
      <p>TruScan processes the text users paste into the app only to classify it.</p>
      <ul class="doc-list">
        <li><strong>Voluntary reports.</strong> A message is stored for review only when the user chooses to report it.</li>
        <li><strong>Used for safety.</strong> Reports are used to improve scam detection and model retraining, and for community safety statistics.</li>
        <li><strong>Personal details.</strong> Reports should not contain more personal information than needed. Admins should not copy report text outside this panel except in the training export.</li>
        <li><strong>Anonymous by default.</strong> Reports are stored without the reporter's name.</li>
        <li><strong>Admin actions are logged</strong> in the Activity Log (who verified, rejected, or exported what).</li>
      </ul>
      <p class="muted-note">Draft text for the capstone prototype. Have it reviewed before any public release.</p>`,
  },
  terms: {
    title: "Terms of Service",
    html: `
      <ul class="doc-list">
        <li>TruScan gives an automated estimate of how likely a message is to be a scam. It is not a guarantee.</li>
        <li>Do not rely on a "safe" result alone before sharing money, passwords, or one-time codes.</li>
        <li>Admins must review reports honestly and only use the panel for the purposes described in the Privacy Policy.</li>
        <li>Admin accounts are personal. Do not share your login.</li>
      </ul>
      <p class="muted-note">Draft text for the capstone prototype. Have it reviewed before any public release.</p>`,
  },
};

function openDoc(key) {
  const d = DOCS[key];
  if (!d) return;
  window.TS.dialog({ title: t(d.title), html: d.html });
}

async function openAbout() {
  const dlg = window.TS.dialog({
    title: "TruScan",
    html: `
      <p><strong>TruScan Admin Panel</strong> · v1.1</p>
      <p>AI-assisted scam, smishing and phishing detection for Filipino users. This panel lets administrators review community reports, check messages with the live model, and export verified cases for retraining.</p>
      <p class="muted-note" id="aboutModel">…</p>`,
  });
  const res = await fetchModelInfo();
  const el = dlg.body.querySelector("#aboutModel");
  if (!el) return;
  el.textContent = res.ok ? `${res.data.model || "Model"} · scikit-learn ${res.data.sklearn_version || "?"}` : "Model info unavailable (backend offline)";
}
