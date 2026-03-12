/**
 * Spotify token management - backend proxy mode.
 *
 * The Django backend holds the Spotify refresh token and exposes:
 *   GET /api/spotify/token/  →  { access_token: string, expires_in: number }
 *
 * The frontend caches the result in localStorage so the SDK's getOAuthToken
 * callback doesn't hit the backend on every call.
 */

const API_BASE =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ??
  "http://127.0.0.1:8000/api";

const TOKEN_CACHE_KEY = "spotify_access_token_cache";
const EXPIRY_CACHE_KEY = "spotify_token_expiry_cache";

/** Returns a valid Spotify access token from the Django backend (cached). */
export const getValidAccessToken = async (): Promise<string | null> => {
  const expiry = Number(localStorage.getItem(EXPIRY_CACHE_KEY) ?? 0);
  const cached = localStorage.getItem(TOKEN_CACHE_KEY);

  // Return cached token if still valid with 30s buffer
  if (cached && Date.now() < expiry - 30_000) return cached;

  try {
    const res = await fetch(`${API_BASE}/spotify/token/`, {
      credentials: "include",
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      access_token: string;
      expires_in: number;
    };
    localStorage.setItem(TOKEN_CACHE_KEY, data.access_token);
    localStorage.setItem(
      EXPIRY_CACHE_KEY,
      String(Date.now() + data.expires_in * 1000),
    );
    return data.access_token;
  } catch {
    return null;
  }
};

/** Clears the cached token (called on auth errors from the SDK). */
export const clearCachedToken = (): void => {
  localStorage.removeItem(TOKEN_CACHE_KEY);
  localStorage.removeItem(EXPIRY_CACHE_KEY);
};
