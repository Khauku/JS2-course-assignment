import { isAuthed, clearSession } from "../../api/auth.js";

/**
 * Redirects to login if the user is not authenticated.
 * @param {string} redirectTo - Path to redirect to ("login.html")
 * @returns {void}
 */

export function requireAuth(redirectTo = "login.html") {
    if (!isAuthed()) {
        window.location.href = redirectTo;
    }
}

/**
 * Wires a logout control that clears session and redirects.
 * Accepts either a CSS selector or a DOM element (button/link).
 * @param {string | Element} selector - Selector or element for the logout button/link.
 * @param {string} redirectTo - Where to send the user after logout
 */
export function attachLogout(selector = "#logoutBtn", redirectTo = "login.html") {
    /** @type {Element|null} */
    const el = typeof selector === "string" ? document.querySelector(selector) : selector;
    if (!el) return;

    el.addEventListener("click", (e) => {
        e.preventDefault();
        clearSession();
        window.location.href = redirectTo;
    });
}