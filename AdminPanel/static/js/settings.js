import {
  doc,
  getDoc,
  setDoc,
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";
import { db } from "./firebase-config.js";
import { PATHS } from "./firestore-helpers.js";

document.addEventListener("DOMContentLoaded", async () => {
  try {
    await Promise.all([loadProfile(), loadPreferences()]);
  } catch (err) {
    console.error("Failed to load settings from Firestore:", err);
    showToast("Couldn't load settings \u2014 check the console.");
  }

  document.getElementById("profileForm").addEventListener("submit", saveProfile);
  document.getElementById("lightModeToggle").addEventListener("change", savePreferences);
  document.getElementById("languageSelect").addEventListener("change", savePreferences);
});

async function loadProfile() {
  const snap = await getDoc(doc(db, ...PATHS.adminProfileDoc));
  const profile = snap.exists()
    ? snap.data()
    : { fullName: "Admin User", email: "", phone: "", role: "Administrator" };

  document.getElementById("fullName").value = profile.fullName || "";
  document.getElementById("email").value = profile.email || "";
  document.getElementById("phone").value = profile.phone || "";
  document.getElementById("role").value = profile.role || "Administrator";
  document.querySelector(".avatar").textContent = (profile.fullName || "A").charAt(0).toUpperCase();
}

async function loadPreferences() {
  const snap = await getDoc(doc(db, ...PATHS.adminPreferencesDoc));
  const prefs = snap.exists() ? snap.data() : { lightMode: false, language: "English" };

  document.getElementById("lightModeToggle").checked = !!prefs.lightMode;
  document.getElementById("languageSelect").value = prefs.language || "English";
}

async function saveProfile(e) {
  e.preventDefault();
  const payload = {
    fullName: document.getElementById("fullName").value.trim(),
    email: document.getElementById("email").value.trim(),
    phone: document.getElementById("phone").value.trim(),
    role: document.getElementById("role").value,
  };

  try {
    await setDoc(doc(db, ...PATHS.adminProfileDoc), payload, { merge: true });
    document.querySelector(".avatar").textContent = (payload.fullName || "A").charAt(0).toUpperCase();
    const savedMsg = document.getElementById("profileSavedMsg");
    savedMsg.hidden = false;
    setTimeout(() => (savedMsg.hidden = true), 2000);
    showToast("Profile saved");
  } catch (err) {
    console.error("Failed to save profile:", err);
    showToast("Couldn't save profile \u2014 check the console.");
  }
}

async function savePreferences() {
  const payload = {
    lightMode: document.getElementById("lightModeToggle").checked,
    language: document.getElementById("languageSelect").value,
  };
  try {
    await setDoc(doc(db, ...PATHS.adminPreferencesDoc), payload, { merge: true });
    showToast("Preferences updated");
  } catch (err) {
    console.error("Failed to save preferences:", err);
    showToast("Couldn't save preferences \u2014 check the console.");
  }
}