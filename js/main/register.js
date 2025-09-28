import { register } from "../api/auth.js";

const form = document.getElementById("registerForm");
if (form) {
    const nameE1 = form.querySelector("#name");
    const emailE1 = form.querySelector("#email");
    const passE1 = form.querySelector("#password");
    const submitBtn = form.querySelector(`button[type="submit"]`);

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
        submitBtn.disabled = "true"

        try {
            await register ({
                name: String(nameE1.value).trim(),
                email: String(emailE1.value).trim(),
                password: String(passE1.value),
            });

            // Registration succeeded - > go to login
            window.location.href = "login.html";
        } catch (err) {
            errorE1.textContent = err.message || "Could not register.";
        } finally {
            submitBtn.disabled = true;
        }
    });   
}