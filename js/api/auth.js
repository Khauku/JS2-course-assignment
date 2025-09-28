import { request } from "./client.js";

const TOKEN_KEY = "accessToken";
const USER_KEY = "profileName";
const API_KEY = "apiKey";

/**
 * @typedef {{ accessToken: string, name: string }} AuthSession
 */

/**
 * Save session to localStorage.
 * @param {AuthSession} session
 */
export function saveSession(session) {
    localStorage.setItem(TOKEN_KEY, session.accessToken);
    localStorage.setItem(USER_KEY, session.name);
}

/** Clear session from localStorage */
export function clearSession() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(API_KEY);
}

/** @returns {boolean} */
export function isAuthed() {
    return !!localStorage.getItem(TOKEN_KEY);
}

/**
 * Register a new user.
 * @param {{name:string,email:string,password:string}} payload
 * @returns {Promise<any>}
 */
export function register(payload) {
    return request("/auth/register", { method: "POST", body: payload });
}

/**
 * Login and return session info.
 * @param {{email:string,password:string}} payload
 * @returns {Promise<AuthSession>}
 */
export async function login(payload) {
    const res = await request("/auth/login", {method: "POST", body: payload });
    const token = res?.data?.accessToken || res?.accessToken;
    const name = res?.data?.name || res?.name;
    if (!token || !name) throw new Error("Invalid login response");
    return { accessToken: token,name };
}

/** POST /auth/create-api-key */
export function createApiKey() {
    return request("/auth/create-api-key", {
        method: "POST",
        auth: "token",
        body: {},
    });
}

/** Ensure an API key exists in storage; create it if missing */
export async function ensureApiKey() {
    let key = localStorage.getItem(API_KEY);
    if (key) return key;

    const res = await createApiKey();
    key = res?.data?.key || res?.key;
    if (!key) throw new Error("Could not get API key");

    localStorage.setItem(API_KEY, key);
    return key;
}
