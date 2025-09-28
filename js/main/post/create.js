import { requireAuth, attachLogout } from "../../ui/utils/auth-guard.js";
import { createPost } from "../../api/posts.js";
import { ensureApiKey } from "../../api/auth.js";

requireAuth("../login.html");
attachLogout("#logoutBtn", "../login.html");

// Ensure API key exists on page load.
(async () => {
    try {
        const hasToken = !!localStorage.getItem("accessToken");
        const hasApiKey = !!localStorage.getItem("apiKey");
        if (hasToken && !hasApiKey) {
            await ensureApiKey();
        }
    } catch (e) {
        console.warn("ensureApiKey failed", e);
    }
})();

const form = document.getElementById("create-post-form");
const msg = document.getElementById("create-message");
const submitBtn = form?.querySelector('button[type="submit"]');

const isHttpUrl = (v) => /^https?:\/\//i.test(v);

function setMessage(text, isError = false) {
    if (!msg) return;
    msg.textContent = text;
    msg.classList.toggle("form-error", isError);
    msg.setAttribute("aria-live", "polite");
}

/** 
 * Navigate to the newly created post.
 * @param {string|undefined|null} id
 * @returns {void}
 */
function redirectToPost(id) {
    if (id) {
        window.location.href = `./index.html?id=${encodeURIComponent(id)}`;
    } else {
        window.location.href = `./index.html`;
    }
}

// if the form isn't on the page, exit. 
if (form) {
    form.setAttribute("novalidate", "");

    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        setMessage("");

        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = "Publishing...";
        }

        const title = form.elements["title"].value.trim();
        const body = form.elements["content"].value.trim();
        const mediaUrl = form.elements["media"].value.trim();
        const rawTags = form.elements["tags"].value.trim();

        if (!title || title.length < 2) {
            setMessage("Please enter a title (min 2 characters).", true);
            if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = "Publish"; }
            return;
        }
        if (!body || body.length < 2) {
            setMessage("Please enter content (min 2 characters).", true);
            if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = "Publish"; }
            return;
        }
        if (mediaUrl && !isHttpUrl(mediaUrl)) {
            setMessage("Image URL must start with http(s)://", true);
            if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = "Publish"; }
            return;
        }

       /** @type {{title:string, body:string, tags?:string[], media?:{url:string,alt?:string}}} */
        const payload = {
            title,
            body,
            ...(rawTags && { tags: rawTags.split(",").map(t => t.trim()).filter(Boolean) }),
            ...(mediaUrl && { media: { url: mediaUrl, alt: title || "Post media" } }),
        };

        try {
            let res = await createPost(payload);
            let created = res?.data || res;
            let id = created?.id || created?.data?.id;

            //Toast after redirecting single-post page
            sessionStorage.setItem("toast", "Post published!🎉");

            redirectToPost(id);
        } catch (err) {
            const needsApiKey = /api key/i.test(err?.message || "");
            if (needsApiKey) {
                try {
                    await ensureApiKey();
                    const res2 = await createPost(payload);
                    const created2 = res2?.data || res2;
                    const id2 = created2?.id || created2?.data?.id;
                    redirectToPost(id2);
                    return;
                }   catch (retryErr) {
                    setMessage(retryErr?.message || "Could not publish post.", true);
                }
            } else {
                setMessage(err?.message || "Could not publish post", true);
            }
        } finally {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = "Publish";
          }
        }
    });
}