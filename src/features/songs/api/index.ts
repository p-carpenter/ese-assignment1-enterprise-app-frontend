import { request } from "@/shared/api/client";
import type { PaginatedResponse, Song, SongUploadPayload } from "../types";

/**
 * GET all songs.
 *
 * @returns A promise that resolves to an array of all `Song` objects.
 */
export const listAllSongs = (): Promise<Song[]> =>
  request<PaginatedResponse<Song>>("/songs/?page_size=1000").then(
    (data) => data.results,
  );

/**
 * GET songs with pagination, sorting, and optional search.
 *
 * @param page - Page number to request (1-based).
 * @param ordering - Ordering string, e.g. `"-created"` or `"title"`.
 * @param search - Optional search query to filter results.
 * @returns A promise that resolves to a paginated response of `Song`.
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
 *
 * @param payload - The song upload payload (file URL, metadata, etc.).
 * @returns A promise that resolves to the created `Song` object.
 */
export const uploadSong = (payload: SongUploadPayload): Promise<Song> =>
  request<Song>("/songs/", {
    method: "POST",
    body: JSON.stringify(payload),
  });

/**
 * DELETE a song by ID.
 *
 * @param songId - ID of the song to delete.
 * @returns A promise that resolves when the deletion completes.
 */
export const deleteSong = (songId: number): Promise<void> =>
  request<void>(`/songs/${songId}/`, { method: "DELETE" });

/**
 * PUT (Update) a song.
 *
 * @param songId - ID of the song to update.
 * @param payload - Partial payload containing fields to update.
 * @returns A promise that resolves to the updated `Song`.
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
 *
 * @param songId - ID of the song to fetch.
 * @returns A promise that resolves to the `Song` details.
 */
export const getSongDetails = (songId: number): Promise<Song> =>
  request<Song>(`/songs/${songId}/`);

/**
 * GET search results for songs.
 *
 * @param query - Search query string.
 * @returns A promise that resolves to an array of matching `Song` objects.
 */
export const searchSongs = (query: string): Promise<Song[]> =>
  request<Song[]>(`/songs/search/?q=${encodeURIComponent(query)}`);
