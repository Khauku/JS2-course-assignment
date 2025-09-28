const BASE_URL = "https://v2.api.noroff.dev";

function getToken() {
    return localStorage.getItem("accessToken");
}
function getApiKey() {
    return localStorage.getItem("apiKey");
}

/** 
 * Make a request to the Noroff v2 API.
 * Adds Authorization and Noroff-API-key.
 * @param {string} path - API starting with "/"
 * @param {RequestInit & {body?: unknown, auth?: false | true | "token"}} [options]
 * @returns {Promise<any>}
 */
export async function request(
    path,
    { method = "GET", body, auth = false, headers = {} } = {}
)   {
    const finalHeaders = {
        "Content-Type": "application/json",
        ...headers,
    };

    const isAuthEndpoint = path.startsWith("/auth/");

    if (auth === "token" || auth === true) {
        const token = getToken();
        if (!token) throw new Error("You are not logged in");
        finalHeaders.Authorization = `Bearer ${token}`;
    }

    if (!isAuthEndpoint && (auth === "token" || auth === true)) {
        const apiKey = getApiKey();
        if (apiKey) {
            finalHeaders["X-Noroff-API-Key"] = apiKey;
        } else if (auth === true) {
            throw new Error("No api key found. call ensureApiKey() after log in.");
        }
    }

    const res = await fetch(`${BASE_URL}${path}`, {
        method,
        headers: finalHeaders,
        body: body ? JSON.stringify(body) : undefined,
    });

    // v2 
    let data = null;
    try { 
        data = await res.json(); 
    } catch (_) {}

    if (!res.ok) {
        const { errors, message } = data || {};
        const msg = errors?.[0]?.message || message || `${res.status} ${res.statusText}`;
        throw new Error(msg);
    }
    return data;
}