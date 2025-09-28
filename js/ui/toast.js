/**
 * @param {string} message
 * @param {{timeout?: number}} [opts]
 */
export function showToast(message, { timeout = 3000 } = {}) {
    const toast = document.createElement("div");
    toast.className = "toast";
    toast.setAttribute("role", "status");
    toast.setAttribute("aria-live", "polite");
    toast.textContent = message;

    document.body.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add("show"));

    setTimeout(() => {
        toast.classList.remove("show");
        setTimeout(() => toast.remove(), 300);
    }, timeout);
}

/* show toast if sessionStorage exists (use on feed or profile) */
export function showToastFromSession() {
    const msg = sessionStorage.getItem("toast");
    if (msg) {
        sessionStorage.removeItem("toast");
        showToast(msg);
    }
}