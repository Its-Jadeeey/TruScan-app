// Animates the loading bar on the splash screen, then hands off to /login.
document.addEventListener("DOMContentLoaded", () => {
  const fill = document.getElementById("heroFill");
  requestAnimationFrame(() => {
    fill.style.width = "100%";
  });
  setTimeout(() => {
    window.location.href = "/login";
  }, 2200);
});
