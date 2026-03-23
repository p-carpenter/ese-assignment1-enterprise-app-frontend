import type { JamendoTrack } from "../types";

interface JamendoTracksResponse {
  results: JamendoTrack[];
}

const JAMENDO_API_URL = "https://api.jamendo.com/v3.0/tracks/";

/**
 * Search Jamendo's track API for matching tracks.
 * @param query Search query string (title, artist, keywords).
 * @param limit Maximum number of tracks to return (default: 10).
 * @returns An array of `JamendoTrack` results.
 * @throws When the client id is missing or the network request fails.
 */
export const searchJamendoTracks = async (
  query: string,
  limit = 10,
): Promise<JamendoTrack[]> => {
  const clientId = import.meta.env.VITE_JAMENDO_CLIENT_ID;

  if (!clientId) {
    throw new Error("Missing VITE_JAMENDO_CLIENT_ID environment variable.");
  }

  const params = new URLSearchParams({
    client_id: clientId,
    format: "json",
    search: query,
    limit: String(limit),
    audioformat: "mp32",
  });

  const response = await fetch(`${JAMENDO_API_URL}?${params.toString()}`);

  if (!response.ok) {
    throw new Error("Failed to search Jamendo tracks.");
  }

  const data: JamendoTracksResponse = await response.json();
  return data.results ?? [];
};
