import { request } from "./client.js";

/**
 * Get a profile by name.
 * @param {string} name - The profile username
 * @returns {Promise<any>}
 */
export function getProfile(name) {
    return request(`/social/profiles/${encodeURIComponent(name)}`, {
        method: "GET",
        auth: "token",
    });
}

/**
 * Follow a user.
 * @param {string} name - The profile username
 * @returns {Promise<any>}
 */
export function follow(name) {
    return request(`/social/profiles/${encodeURIComponent(name)}/follow`, {
        method: "PUT",
        auth: true,
        body: {},
    });
}

/**
 * Unfollow a user.
 * @param {string} name
 * @returns {Promise<any>}
 */
export function unfollow(name) {
    return request(`/social/profiles/${encodeURIComponent(name)}/unfollow`, {
        method: "PUT",
        auth: true,
        body: {},
    });
}