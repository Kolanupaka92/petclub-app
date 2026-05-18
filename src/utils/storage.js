const PETS_KEY = "petclub_pets";
const SESSION_KEY = "petclub_session";

export function loadSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (data && typeof data === "object" && (data.phone || data.email)) return data;
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
