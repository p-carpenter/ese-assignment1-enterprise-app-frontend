import { getValidAccessToken } from "./auth";
import type { SpotifySearchResult, SpotifyTrack } from "./types";

const BASE = "https://api.spotify.com/v1";

/** Fetch with a fresh Spotify access token. Throws if unauthenticated. */
const spotifyFetch = async (
  path: string,
  init?: RequestInit,
): Promise<Response> => {
  const token = await getValidAccessToken();
  if (!token) throw new Error("Not authenticated with Spotify.");

  return fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });
};

/** Search for tracks by query string. */
export const searchTracks = async (
  query: string,
  limit = 10,
): Promise<SpotifyTrack[]> => {
  const params = new URLSearchParams();
  params.append("q", query);
  params.append("type", "track");
  params.append("limit", limit.toFixed(0));
  const res = await spotifyFetch(`/search?${params.toString()}`);
  if (!res.ok) throw new Error("Spotify search failed.");
  const data = (await res.json()) as SpotifySearchResult;
  return data.tracks.items;
};

/** Get a single track by Spotify track ID. */
export const getTrack = async (trackId: string): Promise<SpotifyTrack> => {
  const res = await spotifyFetch(`/tracks/${trackId}`);
  if (!res.ok) throw new Error("Failed to fetch Spotify track.");
  return res.json() as Promise<SpotifyTrack>;
};

/**
 * Tell Spotify to play a URI on a specific device.
 * Called server-side (via Web API) so the SDK device receives the command.
 */
export const playOnDevice = async (
  uri: string,
  deviceId: string,
): Promise<void> => {
  const token = await getValidAccessToken();
  if (!token) throw new Error("Not authenticated with Spotify.");

  const res = await fetch(`${BASE}/me/player/play?device_id=${deviceId}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ uris: [uri] }),
  });

  // 204 = success, 202 = accepted
  if (!res.ok && res.status !== 204 && res.status !== 202) {
    const err = await res.text();
    throw new Error(`Spotify play command failed: ${err}`);
  }
};
