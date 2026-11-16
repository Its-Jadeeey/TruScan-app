// Admin sign-in with Firebase Authentication (email + password).
// Only accounts carrying the `admin: true` claim (set with BackEnd/make_admin.py) get in.
import {
  signInWithEmailAndPassword,
  signOut,
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";
import { auth } from "./firebase-config.js";

const form = document.getElementById("loginForm");
const btn = document.getElementById("loginBtn");
const errorEl = document.getElementById("loginError");

function showError(msg) {
  errorEl.textContent = msg;
  errorEl.hidden = false;
}

if (new URLSearchParams(location.search).get("denied")) {
  showError("This account is not an admin account.");
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  errorEl.hidden = true;
  btn.disabled = true;
  btn.textContent = "Logging in…";

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  try {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    const token = await cred.user.getIdTokenResult(true); // force-refresh so a new claim is seen
    if (token.claims.admin !== true) {
      await signOut(auth);
      showError("This account is not an admin account.");
      return;
    }
    // Hand the verified Firebase token to the server so it can start its session cookie.
    const res = await fetch("/api/auth/firebase", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id_token: await cred.user.getIdToken() }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      await signOut(auth);
      showError(data.message || "The server rejected this sign-in.");
      return;
    }
    try { sessionStorage.removeItem("ts-admin"); } catch (err) {}
    window.location.href = "/dashboard";
  } catch (err) {
    console.error("Login failed:", err.code || err);
    const code = err.code || "";
    if (code === "auth/too-many-requests") {
      showError("Too many attempts. Wait a few minutes and try again.");
    } else if (code === "auth/network-request-failed") {
      showError("Could not reach Firebase. Check your connection.");
    } else {
      showError("Invalid email or password.");
    }
  } finally {
    btn.disabled = false;
    btn.textContent = "Login";
  }
});