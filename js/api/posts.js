import { request } from "./client.js";

/**
 * Create a new post.
 * @param {{ title:string, body:string, tags?:string[], media?: { url:string, alt?:string } }} payload
 * @returns {Promise<{data:any, meta:any}>}
 */
export function createPost(payload) {
    return request("/social/posts", {
        method: "POST",
        auth: true,
        body: payload,
    });
}

/** Get a single post by id 
 * @param {string} id - The post ID
 * @param {{ includeAuthor?: boolean }} [opts]
 * @returns {Promise<{data:any, meta:any}>}
*/
export function getPost(id, {includeAuthor = true } = {}) {
    const qs = includeAuthor ? "?_author=true" : "";
    return request(`/social/posts/${encodeURIComponent(id)}${qs}`, {
        method: "GET",
        auth: "token",
    });
}

/**
 * Get all posts.
 * @param {{ limit?: number, page?: number, includeAuthor?: boolean }} [opts]
 * @returns {Promise<{data:any[], meta?:any}>}
 */
export function getAllPosts({ limit = 50, page = 1, includeAuthor = true } = {}) {
    const params = new URLSearchParams( {
        limit:String(limit),
        page: String(page),
    });
    if (includeAuthor) params.set("_author", "true");

    return request(`/social/posts?${params.toString()}`, {
        method: "GET",
        auth: "token",
    });
}

/** Get posts for a specific user/profile name.
 * @param {string} profileName - the profile username.
 * @param {{ limit?: number, page?: number, includeAuthor?: boolean }} [opts]
 * @returns {Promise<{data:any[], meta?:any}>}
 */
export function getUserPosts(
    profileName,
    { limit = 50, page = 1, includeAuthor = true } = {}
) {
    const params = new URLSearchParams ({
        limit: String(limit),
        page: String(page),
    });
    if (includeAuthor) params.set("_author", "true");

    return request(
        `/social/profiles/${encodeURIComponent(profileName)}/posts?${params.toString()}`,
        {
            method: "GET",
            auth: "token",
        }
    );
}

/**
 * Update a post (owner only).
 * @param {string} id - Post ID
 * @param {{ title?:string, body?:string, tags?:string[], media?:{ url:string, alt?:string }}} payload
 * @returns {Promise<{data:any, meta:any}>}
 */
export function updatePost(id, payload) {
    return request(`/social/posts/${encodeURIComponent(id)}`, {
        method: "PUT",
        auth: true,
        body: payload,
    });
}

/**
 * Delete a post (owner only).
 * @param {string} id - Post ID
 * @returns {Promise<{data:any, meta:any}>}
 */
export function deletePost(id) {
    return request(`/social/posts/${encodeURIComponent(id)}`, {
        method: "DELETE",
        auth: true,
    });
}

/**
 * Filter posts on client side by title/body
 * @param {Array<{title?:string, body?:string}>} posts
 * @param {string} query
 * @returns {Array} filtered
 */
export function filterPostsClientside(posts, query) {
    const q = String(query || "").trim().toLowerCase();
    if (!q) return posts;
    return posts.filter(
        (p) =>
            (p.title && p.title.toLowerCase().includes(q)) ||
            (p.body && p.body.toLowerCase().includes(q))
    );
}
   