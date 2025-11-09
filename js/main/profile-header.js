import { request } from "../api/client.js";
import { ensureApiKey } from "../api/auth.js";

/**
 * fetch a profile with related data (post/followers/following).
 * @param { name: string } params
 * @returns {Promise<objects>} Normalized profile object.
 */
export async function fetchProfile({ name }) {
    const params = new URLSearchParams({
        _posts: "true",
        _followers: "true",
        _following: "true",
    });

    const res = await request(
        `/social/profiles/${encodeURIComponent(name)}?${params.toString()}`,
        {
            method: "GET",
            auth: "token",
        }
    );
    return res?.data || res || {};
}

/**
 * Get saved auth token.
 * @returns {string} Bearer token or empty string.
 */
export function getToken() {
    try { 
        return (
            localStorage.getItem("accessToken") ||
            localStorage.getItem("token") || 
            ""
        );
    } catch { 
      return "";
    }
}

/**
 * Get the current user's profile name saved at login/registration.
 * @returns {string} profile name or empty string.
 */
export function getLocalProfileName() {
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

/** Normalize profile name (strip leading @ and trim). */
function sanitizeProfileName(name) {
    return (name || "").trim().replace(/^@+/, "");
}

// Follow / unfollow 
async function followUser(name) {
    return request(`/social/profiles/${encodeURIComponent(name)}/follow`, {
        method: "PUT",
        auth: true,
    });
}

async function unfollowUser(name) {
    return request(`/social/profiles/${encodeURIComponent(name)}/unfollow`, {
        method: "PUT",
        auth: true,
    });
}

/**
 * Create the DOM for the profile header (no innerHTML; fully constructed in JS).
 * Uses your exact CSS classes.
 * @param {object} profile - Profile data from API.
 * @param {object} opts
 * @param {boolean} [opts.isOwner=false] - Wheter to show the "Edit profile" button.
 * @returns {HTMLElement} The <section> element ready to mount. 
 */
export function createProfileHeader(profile, { isOwner = false } = {}) {
    const section = document.createElement("section");
    section.className = [
        "grid grid-cols-[1fr,auto] items-center",
        "gap-0",
        "px-4 pt-[14px] pb-[10px] bg-white border border-[var(--border)] rounded-xl shadow",
        "mt-4 mb-16"
    ].join(" ");
    section.setAttribute("aria-live", "polite");
    section.setAttribute("aria-busy", "false");

    // Avatar
    const img = document.createElement("img");
    img.className =
        "block w-[72px] h-[72px] rounded-full object-cover border border-[var(--border)] bg-[#f3f4f6] shrink-0";
    img.width = 72;
    img.height = 72;
    img.loading = "eager";

    const displayName = profile?.name || profile?.username || "Unknown user";
    const avatarUrl = profile?.avatar?.url || profile?.avatar || "/images/sky.jpg";

    img.src = avatarUrl;
    img.alt = `${displayName}'s avatar`;
    img.decoding = "async";

    // Main info 
    const main = document.createElement("div");
    main.className = "min-w-0 m-0 p-0";

    const h1 = document.createElement("h1");
    h1.className = "m-0 text-[1.25rem] text-[var(--text)] font-bold truncate";
    h1.textContent = displayName;

    const handle = document.createElement("p");
    handle.className = 
      "mt-[1px] mb-0 text-[var(--muted)] text-[0.95rem] whitespace-nowrap";
    handle.textContent = profile?.email ? profile.email : `@${displayName}`;

    // Stats
    const statsList = document.createElement("ul");
    statsList.className = 
      "flex gap-4 p-0 m-0 list-none whitespace-nowrap";
    statsList.setAttribute("aria-label", "Profile statistics");

    const nf = new Intl.NumberFormat();
    const postsCount = Array.isArray(profile?.posts) 
    ? profile.posts.length 
    : profile?._count?.posts ?? 0;

    let followersCount = Array.isArray(profile?.followers) 
    ? profile.followers.length 
    : profile?._count?.followers ?? 0;

    const followingCount = Array.isArray(profile?.following)
    ? profile.following.length
    : profile?._count?.following ?? 0;

    statsList.append(
        makeStatItem(nf.format(postsCount), "Posts"),
        makeStatItem(nf.format(followersCount), "Followers"),
        makeStatItem(nf.format(followingCount), "Following")
    );

    const meta = document.createElement("div");
    meta.className = "flex flex-col items-start gap-1 mt-1";
    meta.append(handle, statsList);
    main.append(h1, meta);

    //NEW 
    const left = document.createElement("div");
    left.className = "flex items-center gap-4";
    left.append(img,main);

    // Actions (right column)
    const actions = document.createElement("div");
    actions.className = "flex gap-2";
    left.style.gridColumn = "1";
    left.style.gridRow = "1";
    actions.style.gridColumn ="2";
    actions.style.gridRow = "1";
    actions.style.alignSelf = "center";
    actions.style.justifySelf = "end";

    if (isOwner) {
        const edit = document.createElement("a");
        edit.href = "/profile/edit.html";
        edit.className = "px-4 py-2 text-[0.95rem] rounded-lg border border-[var(--border)] bg-white text-[var(--text)] font-semibold no-underline";
        edit.textContent = "Edit profile";
        actions.append(edit);
    } else {
        const me = (getLocalProfileName() || "").toLowerCase();

        const alreadyFollowing = Array.isArray(profile?.followers)
          ? profile.followers.some(f => (f?.name || "").toLowerCase() === me)
          : false;

        const btn = document.createElement("button");
        btn.className = 
          "px-4 py-2 rounded-xl bg-[var(--primary)] text-white font-semibold transition hover:bg-[var(--primary-700)]";
        btn.textContent = alreadyFollowing ? "Unfollow" : "Follow";
        btn.setAttribute("aria-pressed", alreadyFollowing ? "true" : "false");

        btn.addEventListener("click", async () => {
            const prev = btn.textContent;
            btn.disabled = true;
            btn.textContent = prev === "Follow" ? "Following..." : "Unfollowing...";

            try {
                if (prev === "Follow") {
                    await followUser(profile.name);
                    btn.textContent = "Unfollow";
                    btn.setAttribute("aria-pressed", "true");
                    followersCount += 1;
                } else {
                    await unfollowUser(profile.name);
                    btn.textContent = "Follow";
                    btn.setAttribute("aria-pressed", "false");
                    followersCount = Math.max(0, followersCount - 1);
                }
            } catch (err) {
                alert(err?.message || "Could not update follow state");
                btn.textContent = prev;
            } finally {
                btn.disabled = false;
            }
        });

        actions.append(btn);
    }

    // Compose 
    section.append(left, actions);
    return section;
}

/**
 * Helper to build a single stat <li>
 * @param {string} num
 * @param {string} label
 * @returns {HTMLLIElement}
 */
function makeStatItem(num, label) {
    const li = document.createElement("li");
    li.className = "flex items-baseline gap-2";

    const numEl = document.createElement("span");
    numEl.className = "font-bold text-[var(--text)]";
    numEl.textContent = num;

    const labelEl = document.createElement("span");
    labelEl.className = "text-[var(--muted)] text-[0.9rem]";
    labelEl.textContent = label;
    li.append(numEl, labelEl);
    return li;
}

/**
 * Render profile header into a mount element, with loading + error handling.
 * @param {HTMLElement} mount
 * @param {string} profileName
 */
export async function renderProfileHeader(mount, profileName) {
    if (!mount) return;

    try {
        const hasToken = !!localStorage.getItem("accessToken");
        const hasApiKey = !!localStorage.getItem("apiKey");
        if (hasToken && !hasApiKey) {
            await ensureApiKey();
        }
    } catch (e) {
        console.warn("ensureApiKey failed in profile header", e);
    }

    // Loading block (styled by your grid card container)
    const loader = document.createElement("section");
    loader.className = [
        "grid items-center gap-4 p-4 bg-white border border-[var(--border)] rounded-xl shadow mt-4 mb-16",
        "grid-cols-[auto,1fr] md:grid-cols-[auto,1fr,auto]",
    ].join(" ");
    loader.setAttribute("aria-busy", "true");
    loader.innerHTML = `
      <div style="width:72px;height:72px;border-radius:9999px;background:#f3f4f6;border:1px solid var(--border)"></div>
      <div class="min-w-0">
        <h1 class="m-0 text-[var(--text)] font-bold truncate leading-snug">Loading...</h1>
        <p class="mt-[0.2rem] mb-[0.6rem] text-[var(--muted)] text-[0.95rem]">@loading</p>
        <ul class="flex gap-4 p-0 m-0 list-none">
          <li><span class="font-bold text-[var(--text)]">-</span><span class="text-[var(--muted)] text-[0.9rem]">Posts</span></li>
          <li><span class="font-bold text-[var(--text)]">-</span><span class="text-[var(--muted)] text-[0.9rem]">Followers</span></li>
          <li><span class="font-bold text-[var(--text)]">-</span><span class="text-[var(--muted)] text-[0.9rem]">Following</span></li>
        </ul>
      </div>
      <div></div>
      `;
      mount.replaceChildren(loader);

      try {
        const token = getToken();
        const profile = await fetchProfile({ name: profileName });
        const current = getLocalProfileName();
        const isOwner =
          current && (current.toLowerCase() === (profile?.name || "").toLowerCase());

        const header = createProfileHeader(profile, { isOwner });
        mount.replaceChildren(header);
      } catch (err) {
        const alert = document.createElement("p");
        alert.setAttribute("role", "alert");
        alert.style.margin = ".5rem 0 0";
        alert.textContent = err?.message || "Couldn't load profile.";
        mount.replaceChildren(alert);
      }
}

// Bootstrapping //
(function init() {
    const mount = document.getElementById("profileHeaderMount");
    try {
        const params = new URLSearchParams(window.location.search);
        const qpName = (params.get("name") || "").trim();
        const fallback = getLocalProfileName();
        const target = qpName || fallback;

        if (!target) {
            const msg = document.createElement("p");
            msg.textContent = "No profile selected.";
            mount?.replaceChildren(msg);
            return;
        }
        renderProfileHeader(mount, target);
    } catch {
        const fallback = getLocalProfileName();
        if (fallback && mount) {
            renderProfileHeader(mount, fallback);
        } else if (mount) {
            const msg = document.createElement("p");
            msg.textContent = "No profile selected";
            mount.replaceChildren(msg);
        }
    }
})();