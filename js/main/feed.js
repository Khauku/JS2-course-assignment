import { attachLogout } from "../ui/utils/auth-guard.js";
import { getAllPosts, getUserPosts, filterPostsClientside } from "../api/posts.js";
import { ensureApiKey } from "../api/auth.js";

attachLogout("#logoutBtn", "login.html");

const list = document.querySelector(".feed-list");
const statusE1 = document.getElementById("feedStatus");
const headingEl = document.querySelector(".section-heading");
const searchInput = document.getElementById("postSearch");

function isProfilePage() {
    return !!document.getElementById("profileHeaderMount");
}

function getLocalProfileName() {
    try {
        return (
            localStorage.getItem("profileName") ||
            localStorage.getItem("name") ||
            localStorage.getItem("username") ||
            ""
        );
    } catch {
        return "";
    }
}

function sanitizeName(s) {
    return (s || "").trim().replace(/^@+/, "");
}

function setStatus(msg) {
    if (statusE1) {
        statusE1.textContent = msg || "";
        statusE1.setAttribute("aria-live", "polite");
    }
}

/**
 * Render a single postcard.
 * @param {any}
 * @return {string} HTML
 */
function renderCard(p) {
    const author = p.author?.name || "Unknown";
    const created = p.created ? new Date(p.created).toLocaleDateString(undefined, { month: "short", day: "numeric" }) : "";
    const mediaUrl = p.media?.url || "";
    const mediaAlt = p.media?.alt || p.title || "Post media";
    const avatarUrl = p.author?.avatar?.url || "";

    // Card HTML
    return `
    <article class="bg-white border border-[var(--border)] rounded-xl shadow overflow-x-hidden transition">
      <header class="flex items-center gap-3 p-3">
        ${avatarUrl 
            ? `<img src="${avatarUrl}" alt="${author}'s avatar" 
               class="w-10 h-10 rounded-full object-cover border border-[var(--border)] bg-[#f3f4f6]">` 
            : `<div class="w-10 h-10 rounded-full border border-[var(--border)] bg-[#f3f4f6]" aria-hidden="true"></div>`
        }
        <div>
          <h2 class="m-0 text-[var(--text)] font-semibold text-[0.95rem]">${author}</h2>
          <time class="block text-[0.8rem] text-[var(--muted)]">${created}</time>
        </div>
      </header>
      ${mediaUrl ? `
        <figure class="m-0 p-0">
          <img src="${mediaUrl}" alt="${mediaAlt}" class="w-full aspect-[16/9] object-cover bg-[#f3f4f6]">
        </figure>` : ``}
        <div class="p-4 text-[0.95rem] leading-6 text-[var(--text)]">
          <p>${p.body ? escapeHtml(p.body) : ""}</p>
        </div>
        <footer class="flex items-center gap-4 border-t border-[var(--border)] p-4" aria-label="Post actions">
          <a href="post/index.html?id=${encodeURIComponent(p.id)}" class="inline-flex items-center gap-1 text-[var(--muted)] text-sm font-medium no-underline hover:underline hover:text-[var(--primary)]">Open</a>
        </footer>
    </article>
    `;
}

/** Simple HTML escaper for body text */
function escapeHtml(s = "") {
    return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
}

/**
 * Render an array of posts into the list.
 * @param {any[]} posts
 */
function renderList(posts) {
    if (!list) return;
    if (!posts || posts.length === 0) {
        list.innerHTML = `<p>No posts found.</p>`;
        return;
    }
    list.innerHTML = posts.map(renderCard).join("");
}

/**
 * Load feed from API
 * On Profile.html: Show only that users's posts
 * Elsewhere: show all posts
 * @returns {Promise<any[]>}
 */
async function loadFeed() {
    setStatus("Loading posts...");
    try {
        const hasToken = !!localStorage.getItem("accessToken");
        const hasApiKey = !!localStorage.getItem("apiKey");
        if (hasToken && !hasApiKey) {
            await ensureApiKey();
        }

        const params = new URLSearchParams(location.search);
        const qpName = sanitizeName(params.get("name") || "");
        const ownName = sanitizeName(getLocalProfileName());
        const onProfile = isProfilePage();
        const targetName = onProfile ? (qpName || ownName) : "";

        let res;
        if (onProfile && targetName) {
            res = await getUserPosts(targetName, { limit: 50, page: 1, includeAuthor: true });
            if (headingEl) headingEl.textContent = `Posts by ${targetName}`;
        } else {
            res = await getAllPosts({ limit: 50, page: 1, includeAuthor: true });
            if (headingEl) headingEl.textContent = "Latest posts";
        }

        const posts = res?.data || res || [];
        renderList(posts);
        setStatus(`${posts.length} post${posts.length === 1 ? "" : "s"} loaded`);
        return posts;
    } catch (e) {
        console.error("Feed load failed:", e);
        setStatus(e?.message || "Could not load posts.");
        renderList([]);
        return [];
    }
}

let currentPosts = [];
(async () => {
    currentPosts = await loadFeed();
})();

// Search wiring
if (searchInput) {
    let t;
    searchInput.addEventListener("input", (e) => {
        const q = e.target.value;
        clearTimeout(t);
        t = setTimeout(() => {
            const filtered = filterPostsClientside(currentPosts, q);
            renderList(filtered);
            setStatus(
              q
              ? `Showing ${filtered.length} of ${currentPosts.length} posts`
              : `${currentPosts.length} posts${currentPosts.length === 1 ? "" : "s"} loaded`
            );
        
        }, 150);
    });
}


