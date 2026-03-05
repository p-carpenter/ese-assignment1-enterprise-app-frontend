import { request } from "@/shared/api/client";
import type { PaginatedResponse, Song, SongUploadPayload } from "../types";

/**
 * GET all songs
 */
export const listAllSongs = (): Promise<Song[]> =>
  request<Song[]>("/songs/?page_size=1000"); // or create a dedicated endpoint

/**
 * GET songs with pagination, sorting, and optional search.
 */
export const listSongsPaginated = (
  page: number,
  ordering: string,
  search?: string,
): Promise<PaginatedResponse<Song>> => {
  const params = new URLSearchParams({
    page: page.toString(),
    ordering,
  });
  if (search) params.append("search", search);

  return request(`/songs/?${params.toString()}`);
};

/**
 * POST a new song.
 * Returns the created Song so the UI can add it to the list immediately.
 */
export const uploadSong = (payload: SongUploadPayload): Promise<Song> =>
  request<Song>("/songs/", {
    method: "POST",
    body: JSON.stringify(payload),
  });

/**
 * DELETE a song by ID.
 */
export const deleteSong = (songId: number): Promise<void> =>
  request<void>(`/songs/${songId}/`, { method: "DELETE" });

/**
 * PUT (Update) a song.
 */
export const updateSong = (
  songId: number,
  payload: Partial<SongUploadPayload>,
): Promise<Song> =>
  request<Song>(`/songs/${songId}/`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });

/**
 * GET details for a single song.
 */
export const getSongDetails = (songId: number): Promise<Song> =>
  request<Song>(`/songs/${songId}/`);

/**
 * GET search results.
 */
export const searchSongs = (query: string): Promise<Song[]> =>
  request<Song[]>(`/songs/search/?q=${encodeURIComponent(query)}`);

/**
 * POST a play event.
 */
export const logPlay = async (songId: number): Promise<void> => {
  try {
    await request("/history/", {
      method: "POST",
      body: JSON.stringify({ song: songId }),
    });
  } catch (err) {
    console.error("Audit log failed (silent failure):", err);
  }
};
