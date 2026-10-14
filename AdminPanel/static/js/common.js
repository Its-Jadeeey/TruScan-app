// Shared by every admin page (classic script, loaded before the page's ES module).
// Provides: window.TS  -> { t, applyI18n, setLanguage, getLang, applyTheme,
//                           apiBase, setApiBase, dialog, toast }
//           showToast() global (kept for backwards compatibility)
(function () {
  "use strict";

  // ---------------------------------------------------------------------
  // Language (English / Filipino). Keys are the English strings themselves.
  // ---------------------------------------------------------------------
  var FIL = {
    // navigation + shell
    "Dashboard": "Dashboard",
    "Reports": "Mga Ulat",
    "Settings": "Mga Setting",
    "Log out": "Mag-log out",
    "ADMIN PANEL": "ADMIN PANEL",
    "Notifications": "Mga Abiso",
    "Skip to content": "Lumaktaw sa nilalaman",

    // dashboard
    "System Overview": "Pangkalahatang-ideya ng Sistema",
    "Monitor threat response performance and platform trends": "Subaybayan ang pagtugon sa mga banta at mga trend ng platform",
    "System Metrics": "Mga Sukatan ng Sistema",
    "7 days": "7 araw",
    "30 days": "30 araw",
    "All time": "Lahat ng panahon",
    "Refresh": "I-refresh",
    "Detection Rate": "Antas ng Pagtuklas",
    "Active Threats": "Mga Aktibong Banta",
    "Total Reports": "Kabuuang Ulat",
    "Model Agreement": "Pagsang-ayon ng Modelo",
    "Reports Over Time": "Mga Ulat Ayon sa Panahon",
    "Breakdown": "Pagkakahati",
    "By channel": "Ayon sa channel",
    "By risk level": "Ayon sa antas ng panganib",
    "Model Performance": "Pagganap ng Modelo",
    "Recent Flagged Scams": "Mga Kamakailang Na-flag na Scam",
    "Top Risk Indicators": "Mga Pangunahing Indikasyon ng Panganib",
    "Indicator": "Indikasyon",
    "Score": "Bilang",
    "Flagged": "Na-flag",
    "Safe": "Ligtas",
    "Accuracy": "Katumpakan",
    "Precision": "Precision",
    "Recall": "Recall",
    "F1 Score": "F1 Score",
    "Updated": "Na-update",
    "No flagged scams yet.": "Wala pang na-flag na scam.",
    "No risk indicators yet.": "Wala pang mga indikasyon ng panganib.",
    "No reports in this period.": "Walang ulat sa panahong ito.",
    "Pending review": "Naghihintay ng review",
    "needs attention": "kailangan ng aksyon",
    "No verified cases yet": "Wala pang na-verify na kaso",

    // reports
    "Review community reports and prepare training data": "Suriin ang mga ulat ng komunidad at ihanda ang training data",
    "Overview of Scam, Phishing, Smishing": "Pangkalahatang-ideya ng Scam, Phishing, Smishing",
    "Pending Review": "Naghihintay ng Review",
    "Ready for Training": "Handa para sa Training",
    "Rejected": "Tinanggihan",
    "Model Corrections": "Mga Pagwawasto sa Modelo",
    "Community Reports": "Mga Ulat ng Komunidad",
    "Search text or case ID…": "Maghanap ng teksto o case ID…",
    "All statuses": "Lahat ng status",
    "Pending": "Naghihintay",
    "Verified": "Na-verify",
    "All channels": "Lahat ng channel",
    "All risks": "Lahat ng panganib",
    "High": "Mataas",
    "Medium": "Katamtaman",
    "Low": "Mababa",
    "Newest first": "Pinakabago muna",
    "Oldest first": "Pinakaluma muna",
    "Case ID": "Case ID",
    "Message": "Mensahe",
    "Source": "Pinagmulan",
    "Type": "Uri",
    "Detected": "Natuklasan",
    "Risk": "Panganib",
    "Status": "Status",
    "Action": "Aksyon",
    "Review": "Suriin",
    "View": "Tingnan",
    "Export training CSV": "I-export ang training CSV",
    "Export view (CSV)": "I-export ang view (CSV)",
    "Previous": "Nakaraan",
    "Next": "Susunod",
    "Scam Checker": "Scam Checker",
    "Paste a suspicious message, link, or phone number to analyze…": "Mag-paste ng kahina-hinalang mensahe, link, o numero para suriin…",
    "Check": "Suriin",
    "Clear": "I-clear",
    "Activity Log": "Talaan ng Aktibidad",
    "No cases match your filters.": "Walang kasong tumutugma sa iyong mga filter.",
    "No activity yet.": "Wala pang aktibidad.",
    "Case details": "Detalye ng kaso",
    "Reported message": "Iniulat na mensahe",
    "Mobile app result": "Resulta sa mobile app",
    "Current model": "Kasalukuyang modelo",
    "Re-run ML check": "Patakbuhin muli ang ML check",
    "Admin review": "Review ng admin",
    "Final label": "Pinal na label",
    "Scam": "Scam",
    "Not scam": "Hindi scam",
    "Scam type": "Uri ng scam",
    "Notes (optional)": "Mga tala (opsyonal)",
    "Verify — ready for training": "I-verify — handa para sa training",
    "Reject": "Tanggihan",
    "Reopen case": "Buksan muli ang kaso",
    "Close": "Isara",
    "Confidence": "Kumpiyansa",
    "Category": "Kategorya",
    "Channel": "Channel",
    "Reported from": "Iniulat mula sa",
    "Detected on": "Natuklasan noong",
    "Reviewed by": "Sinuri ni",

    // settings
    "Manage your account, preferences and support": "Pamahalaan ang iyong account, mga kagustuhan at suporta",
    "Profile": "Profile",
    "Full name": "Buong pangalan",
    "Phone": "Telepono",
    "Role": "Tungkulin",
    "Save changes": "I-save ang mga pagbabago",
    "Preferences": "Mga Kagustuhan",
    "Light Mode": "Light Mode",
    "Language": "Wika",
    "System Status": "Katayuan ng Sistema",
    "Backend API": "Backend API",
    "Prediction model": "Modelo ng prediksyon",
    "Backend URL": "Backend URL",
    "Test connection": "Subukan ang koneksyon",
    "Save URL": "I-save ang URL",
    "Reset": "I-reset",
    "Support": "Suporta",
    "Help Center": "Help Center",
    "Privacy Policy": "Patakaran sa Privacy",
    "Terms of Service": "Mga Tuntunin ng Serbisyo",
    "About": "Tungkol",
    "About TruScan (v1.1)": "Tungkol sa TruScan (v1.1)",
    "Online": "Online",
    "Offline": "Offline",
    "Saved": "Na-save",

    // misc
    "Likely scam": "Malamang na scam",
    "Suspicious": "Kahina-hinala",
    "Likely safe": "Malamang na ligtas"
  };

  var lang = "English";
  try { lang = localStorage.getItem("ts-lang") || "English"; } catch (e) {}
  if (lang !== "Filipino") lang = "English";

  function t(key) {
    return (lang === "Filipino" && FIL[key]) || key;
  }

  function applyI18n(root) {
    root = root || document;
    root.querySelectorAll("[data-i18n]").forEach(function (el) {
      el.textContent = t(el.getAttribute("data-i18n"));
    });
    root.querySelectorAll("[data-i18n-placeholder]").forEach(function (el) {
      el.setAttribute("placeholder", t(el.getAttribute("data-i18n-placeholder")));
    });
    root.querySelectorAll("[data-i18n-label]").forEach(function (el) {
      el.setAttribute("aria-label", t(el.getAttribute("data-i18n-label")));
      if (el.hasAttribute("title")) el.setAttribute("title", t(el.getAttribute("data-i18n-label")));
    });
    document.documentElement.lang = lang === "Filipino" ? "fil" : "en";
  }

  function setLanguage(next) {
    next = next === "Filipino" ? "Filipino" : "English";
    if (next === lang) { applyI18n(); return; }
    lang = next;
    try { localStorage.setItem("ts-lang", lang); } catch (e) {}
    applyI18n();
    document.dispatchEvent(new CustomEvent("ts:lang"));
  }

  function getLang() { return lang; }

  // ---------------------------------------------------------------------
  // Theme (dark default; light is applied by [data-theme="light"] CSS)
  // ---------------------------------------------------------------------
  function applyTheme(mode) {
    var m = mode === "light" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", m);
    try { localStorage.setItem("ts-theme", m); } catch (e) {}
  }

  // ---------------------------------------------------------------------
  // Backend (ML API) address: same host as this page, port 8001, unless
  // overridden from Settings > System Status.
  // ---------------------------------------------------------------------
  function defaultApiBase() {
    return location.protocol + "//" + location.hostname + ":8001";
  }
  function apiBase() {
    try {
      var o = localStorage.getItem("ts-api-base");
      if (o) return o.replace(/\/+$/, "");
    } catch (e) {}
    return defaultApiBase();
  }
  function setApiBase(url) {
    try {
      if (url) localStorage.setItem("ts-api-base", url.replace(/\/+$/, ""));
      else localStorage.removeItem("ts-api-base");
    } catch (e) {}
  }

  // ---------------------------------------------------------------------
  // Toast
  // ---------------------------------------------------------------------
  function showToast(message) {
    var toast = document.querySelector(".toast");
    if (!toast) {
      toast = document.createElement("div");
      toast.className = "toast";
      toast.setAttribute("role", "status");
      toast.setAttribute("aria-live", "polite");
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(showToast._t);
    showToast._t = setTimeout(function () { toast.classList.remove("show"); }, 2600);
  }

  // ---------------------------------------------------------------------
  // Dialog (modal). Returns { el, body, close }.
  // ---------------------------------------------------------------------
  function dialog(opts) {
    var back = document.createElement("div");
    back.className = "modal-backdrop";
    back.innerHTML =
      '<div class="modal' + (opts.wide ? " modal-wide" : "") + '" role="dialog" aria-modal="true" aria-labelledby="tsDlgTitle">' +
      '  <div class="modal-head"><h2 id="tsDlgTitle"></h2>' +
      '  <button type="button" class="modal-x" aria-label="Close">×</button></div>' +
      '  <div class="modal-body"></div>' +
      "</div>";
    back.querySelector("h2").textContent = opts.title || "";
    var body = back.querySelector(".modal-body");
    body.innerHTML = opts.html || "";

    var previous = document.activeElement;
    function onKey(e) { if (e.key === "Escape") close(); }
    function close() {
      document.removeEventListener("keydown", onKey);
      back.remove();
      document.body.classList.remove("modal-open");
      if (previous && previous.focus) previous.focus();
      if (opts.onClose) opts.onClose();
    }
    back.addEventListener("mousedown", function (e) { if (e.target === back) close(); });
    back.querySelector(".modal-x").addEventListener("click", close);
    document.addEventListener("keydown", onKey);

    document.body.appendChild(back);
    document.body.classList.add("modal-open");
    applyI18n(back);
    (body.querySelector("[autofocus]") || back.querySelector(".modal-x")).focus();
    return { el: back, body: body, close: close };
  }

  window.TS = {
    t: t,
    applyI18n: applyI18n,
    setLanguage: setLanguage,
    getLang: getLang,
    applyTheme: applyTheme,
    apiBase: apiBase,
    defaultApiBase: defaultApiBase,
    setApiBase: setApiBase,
    dialog: dialog,
    toast: showToast
  };
  window.showToast = showToast;

  document.addEventListener("DOMContentLoaded", function () {
    applyI18n();

    var logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn) {
      logoutBtn.addEventListener("click", function () {
        try { sessionStorage.removeItem("ts-admin"); } catch (e) {}
        fetch("/api/auth/logout", { method: "POST" }).finally(function () {
          window.location.href = "/login";
        });
      });
    }
  });
})();
