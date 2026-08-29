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
    errorEl.textContent = data.message || "Invalid username or password.";
    errorEl.hidden = false;
  } catch (err) {
    errorEl.textContent = "Could not reach the server. Please try again.";
    errorEl.hidden = false;
  } finally {
    btn.disabled = false;
    btn.textContent = "Login";
  }
});
