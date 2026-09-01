import {
  doc,
  getDoc,
  setDoc,
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";
import { db } from "./firebase-config.js";
import { adminDoc } from "./firestore-helpers.js";

let currentUsername = null;

document.addEventListener("DOMContentLoaded", async () => {
  try {
    currentUsername = await getCurrentUsername();
    if (!currentUsername) {
      window.location.href = "/login";
      return;
    }
    await loadAdmin(currentUsername);
  } catch (err) {
    console.error("Failed to load settings from Firestore:", err);
    showToast("Couldn't load settings \u2014 check the console.");
  }

  document.getElementById("profileForm").addEventListener("submit", saveProfile);
  document.getElementById("lightModeToggle").addEventListener("change", savePreferences);
  document.getElementById("languageSelect").addEventListener("change", savePreferences);
});

async function getCurrentUsername() {
  const res = await fetch("/api/auth/me", { credentials: "same-origin" });
  if (!res.ok) return null;
  const data = await res.json();
  return data.username;
}

async function loadAdmin(username) {
  const snap = await getDoc(doc(db, ...adminDoc(username)));
  const admin = snap.exists()
    ? snap.data()
    : { fullName: username, email: "", phone: "", role: "Administrator", lightMode: false, language: "English" };

  document.getElementById("fullName").value = admin.fullName || "";
  document.getElementById("email").value = admin.email || "";
  document.getElementById("phone").value = admin.phone || "";
  document.getElementById("role").value = admin.role || "Administrator";
  document.querySelector(".avatar").textContent = (admin.fullName || username).charAt(0).toUpperCase();

  document.getElementById("lightModeToggle").checked = !!admin.lightMode;
  document.getElementById("languageSelect").value = admin.language || "English";
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
    await setDoc(doc(db, ...adminDoc(currentUsername)), payload, { merge: true });
    document.querySelector(".avatar").textContent = (payload.fullName || currentUsername).charAt(0).toUpperCase();
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
    await setDoc(doc(db, ...adminDoc(currentUsername)), payload, { merge: true });
    showToast("Preferences updated");
  } catch (err) {
    console.error("Failed to save preferences:", err);
    showToast("Couldn't save preferences \u2014 check the console.");
  }
}