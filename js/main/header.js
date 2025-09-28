import { isAuthed, clearSession } from "../api/auth.js";

function setAuthUI() {
    const authed = isAuthed();
    document.querySelectorAll(".show-when-auth").forEach((el) => (el.hidden = !authed));
    document.querySelectorAll(".hide-when-auth").forEach((el) => (el.hidden = authed));
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", setAuthUI);
} else {
    setAuthUI();
}

//Keep UI in sync if storage changes (example. another tab)
window.addEventListener("storage", (e) => {
    if (e.key === "accessToken" || e.key === "profileName") setAuthUI();
});