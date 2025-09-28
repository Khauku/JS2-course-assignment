import { login, saveSession, ensureApiKey } from "../api/auth.js";

const form = document.getElementById("loginForm");
if (form) {
    const emailE1 = form.querySelector("#email");
    const passE1 = form.querySelector("#password");
    const submitBtn = form.querySelector(`button[type="submit"]`);

    // Inline error area
    let errorE1 = form.querySelector("[data-error]");
    if (!errorE1) {
        errorE1 = document.createElement("p");
        errorE1.className = "form-error";
        errorE1.setAttribute("data-error", "");
        errorE1.setAttribute("aria-live", "polite");
        form.appendChild(errorE1)
    }

    form.setAttribute("novalidate", "");

    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        errorE1.textContent = "";

        // Loading state
        submitBtn.disabled = true;
        const prevText = submitBtn.textContent;
        submitBtn.textContent = "Signing in...";

        try {
            // 1: Login -> get token + name
            const session = await login ({
                email : String(emailE1.value).trim(),
                password: String(passE1.value),
            });
            // 2: save token + name
            saveSession(session);

            // 3: ensure API key exists
            try {
                await ensureApiKey();
            } catch (apiKeyErr) {
                console.warn("Could not create API", apiKeyErr); 
            }

            // 4: redirect
            window.location.href = "profile.html";
        } catch (err) {
            errorE1.textContent = err.message || "Could not log in";
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = prevText;
        }
    });
}
