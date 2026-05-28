const PETS_KEY    = "petclub_pets";
const SESSION_KEY = "petclub_session";
const TOKEN_KEY   = "petclub_token";

/* ── M-3: decode JWT exp claim client-side ─────────────────────────────────
 * Checks the token's expiry before making any API call, so a user with a
 * 7-day-old JWT sees the login screen immediately rather than a 401 splash.
 * Base64url decode handles the - → + and _ → / mapping required by atob(). */
const isTokenExpired = (token) => {
  try {
    const b64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const { exp } = JSON.parse(atob(b64));
    return exp ? exp * 1000 < Date.now() : false;
  } catch { return false; }
};

export function loadSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (data && typeof data === "object" && (data.phone || data.email)) {
      // M-3: pre-validate JWT expiry so we never render an authenticated route
      // with a known-dead token. The 401 handler in api.js is a fallback for
      // tokens that expire mid-session.
      const token = localStorage.getItem(TOKEN_KEY);
      if (token && isTokenExpired(token)) {
        localStorage.removeItem(SESSION_KEY);
        localStorage.removeItem(TOKEN_KEY);
        return null;
      }
      return data;
    }
    localStorage.removeItem(SESSION_KEY);
    return null;
  } catch {
    localStorage.removeItem(SESSION_KEY);
    return null;
  }
}

export function saveSession(data) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(data));
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

export function loadPets(fallback) {
  try {
    const raw = localStorage.getItem(PETS_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : fallback;
  } catch {
    return fallback;
  }
}

export function savePets(pets) {
  localStorage.setItem(PETS_KEY, JSON.stringify(pets));
}
