import { requireAuth, attachLogout } from "../../ui/utils/auth-guard.js"
import { getPost, updatePost, deletePost } from "../../api/posts.js";
import { isAuthed, ensureApiKey } from "../../api/auth.js";

// Redirect to login if not logged in
requireAuth("../login.html");
attachLogout("#logoutBtn", "../login.html");

const els = {
    title: document.getElementById("postTitle"),
    author: document.getElementById("postAuthor"),
    time: document.getElementById("postTime"),
    body: document.getElementById("postBody"),
    img: document.getElementById("postImage"),
    imgCap: document.getElementById("postImageCaption"),
    editBtn: document.getElementById("editPostBtn"),
    deleteBtn: document.getElementById("deletePostBtn"),
};

/**
 * Get the post ID from the URL query string.
 * @returns {string|null}
 */
function getIdFromQuery() {
    const p = new URLSearchParams(location.search);
    return p.get("id");
}

/**
 * Format an ISO date string into readable text
 * @param {string} iso - The ISO date string.
 * @returns {string} A formatted date string.
 */
function formatDate(iso) {
    if (!iso) return "";
    const d = new Date(iso);
    return d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

function setLoading() {
    els.title.textContent = "Loading...";
    els.body.textContent = "Loading post...";
}

function setError(msg) {
    els.title.textContent = "Post not found";
    els.body.textContent = msg || "Could not load this post.";
}

/**
 * Force visability helpers to avoid relying header toggling.
 */
function showOwnerButtons() {
    if (!els.editBtn || !els.deleteBtn) return;
    els.editBtn.disabled = false;
    els.editBtn.setAttribute("aria-disabled", "false");
    els.deleteBtn.disabled = false;
    els.deleteBtn.setAttribute("aria-disabled", "false");

    els.editBtn.style.display = "inline-block";
    els.deleteBtn.style.display = "inline-block";
}

function hideSigninNote() {
    const note = document.querySelector(".post-actions-note");
    if (note) note.style.display = "none";
}

function showNotOwnerNote() {
    const note = document.querySelector(".post-actions-note");
    if (note) {
        note.textContent = "Only the author can edit or delete this post";
        note.style.display = "block"
    }
}

 /** Simple escaper for dynamic values in editor HTML */
function escapeHtml(s = "") {
    return String(s).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

/** Inline editor */
function ensureEditorContainer() {
    let editor = document.getElementById("inlineEditor");
    if (!editor) {
        editor = document.createElement("div");
        editor.id = "inlineEditor";
        editor.style.marginTop = "1rem";
        els.body.insertAdjacentElement("afterend", editor);
    }
        return editor;
}
function showInlineEditor(post) {
    const editor = ensureEditorContainer();
    const id = String(post.id);

    editor.innerHTML = `
          <form id="editForm" class="edit-form">
            <div class="form-row">
              <label class="label">Title</label>
              <input id="editTitle" class="input" type="text" value="${escapeHtml(post.title || "")}" required>
            </div>
            <div class="form-row" style="margin-top:.5rem;">
              <label class="label">Content</label>
              <textarea id="editBody" class="input" rows="5" required>${escapeHtml(post.body || "")}</textarea>
            </div>
            <p id="editError" class="form-error" aria-live="polite" style="margin:.5rem 0;"></p>
            <div class="post-actions" style="gap:.5rem; margin-top:.5rem;">
              <button type="submit" id="saveEdit" class="btn btn-primary">Save changes</button>
              <button type="button" id="cancelEdit" class="btn">Cancel</button>
            </div>
          </form>
        `;

        const form = editor.querySelector("#editForm");
        const titleInput = editor.querySelector("#editTitle");
        const bodyInput = editor.querySelector("#editBody");
        const errorE1 = editor.querySelector("#editError");
        const cancelBtn = editor.querySelector("#cancelEdit");
        const saveBtn = editor.querySelector("#saveEdit");

        const setErr = (msg) => (errorE1.textContent = msg || "");

        form.addEventListener("submit", async (e) => {
            e.preventDefault();
            setErr("");

            const title = titleInput.value.trim();
            const body = bodyInput.value.trim();
            if (!title || !body) {
                setErr("Title and content are required.");
                return;
            }

            const prevText = saveBtn?.textContent;
            if (saveBtn) {
                saveBtn.disabled = true;
                saveBtn.textContent = "Saving...";
            }

            try {
                await updatePost(id, { title, body });
                sessionStorage.setItem("toast", "Post updated.");
                location.reload();
            } catch (err) {
                setErr(err?.message || "Could not update this post.");
            } finally {
                if (saveBtn) {
                    saveBtn.disabled = false;
                    saveBtn.textContent = prevText || "save changes";
                }
            }
        });

        cancelBtn.addEventListener("click", () => {
            editor.innerHTML = "";
        });
    }

/**
 * Render a post into the DOM
 * @param {any} post - Post object returned from the API. 
 */
function render(post) {
    // Title
    els.title.textContent = post.title || "(Untitled)";

    // Author
    const authorName = post.author?.name || "Unknown";
    els.author.textContent = authorName;
    els.author.href = `../profile.html?name=${encodeURIComponent(authorName)}`;

    // Time
    els.time.textContent = formatDate(post.created);
    if (post.created) els.time.setAttribute("datetime", post.created);

    // Body 
    els.body.textContent = post.body || "";

    // Media
    const url = post.media?.url;
    const alt = post.media?.alt || post.title || "Post media";
    if (url) {
        els.img.src = url;
        els.img.alt = alt;
        els.img.classList.remove("hidden");
        els.imgCap.textContent = alt;
    } else {
        els.img.classList.add("hidden");
        els.img.removeAttribute("src");
        els.imgCap.textContent = "";
    }
    // Owner controls
    try {
        const myName = (localStorage.getItem("profileName") || "").toLowerCase();
        const author = (post.author?.name || "").toLowerCase();
        const isOwner = Boolean(myName && author && myName === author);

        if (isAuthed()) hideSigninNote();
        if (isAuthed() && isOwner) {
            showOwnerButtons();
            wireActions(post);
        } else if (isAuthed() && !isOwner) {
            showNotOwnerNote();
        }
    } catch {}
}

/** Wire Edit/Delete actions (owner only) */
function wireActions(post) {
    const id = String(post.id);

    // Delete 
    els.deleteBtn?.addEventListener("click", async () => {
        if (!confirm("Delete this post? This cannot be undone.")) return;
        try {
            await deletePost(id);
            sessionStorage.setItem("toast", "Post deleted.");
            window.location.href = "../index.html";
        } catch (e) {
            alert(e?.message || "Could not delete this post.");
        }
    });

    // Edit
    els.editBtn?.addEventListener("click", () => {
        showInlineEditor(post);
    });
}

/**
 * Initialize the post page: load and render a single post.
 */
async function init() {
    const id = getIdFromQuery();
    if (!id) {
        setError("Missing post id in URL.");
        return;
    }

    // Ensure API key before first fetch.
    try {
        const hasToken = !!localStorage.getItem("accessToken");
        const hasApiKey = !!localStorage.getItem("apiKey");
        if (hasToken && !hasApiKey) {
            await ensureApiKey();
        }
    } catch (e) {
        console.warn("ensureApiKey failed", e)
    }

    setLoading();

    try {
        const res = await getPost(id, { includeAuthor: true });
        const post = res?.data || res;
        if (!post) throw new Error("No post data.");
        render(post);
    } catch (e) {
        setError(e?.message || "Failed to load post.");
    }
}

init();
