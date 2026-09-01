import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";
import { db } from "./firebase-config.js";
import { adminDoc } from "./firestore-helpers.js";

document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const btn = document.getElementById("loginBtn");
  const errorEl = document.getElementById("loginError");
  errorEl.hidden = true;
  btn.disabled = true;
  btn.textContent = "Logging in\u2026";

  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value;

  try {
    // 1) Try the built-in demo admin (checked server-side by FastAPI).
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();

    if (res.ok && data.success) {
      window.location.href = "/dashboard";
      return;
    }

    // 2) Fall back to checking the Firestore `admins` collection.
    const matched = await checkFirestoreAdmin(username, password);
    if (matched) {
      const sessionRes = await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username }),
      });
      if (sessionRes.ok) {
        window.location.href = "/dashboard";
        return;
      }
    }

    errorEl.textContent = "Invalid username or password.";
    errorEl.hidden = false;
  } catch (err) {
    console.error("Login failed:", err);
    errorEl.textContent = "Could not reach the server. Please try again.";
    errorEl.hidden = false;
  } finally {
    btn.disabled = false;
    btn.textContent = "Login";
  }
});

async function checkFirestoreAdmin(username, password) {
  if (!username || !password) return false;
  try {
    const snap = await getDoc(doc(db, ...adminDoc(username)));
    if (!snap.exists()) return false;
    return snap.data().password === password;
  } catch (err) {
    console.error("Firestore admin lookup failed:", err);
    return false;
  }
}