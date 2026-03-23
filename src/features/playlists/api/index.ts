import { request } from "@/shared/api/client";
import type { Playlist } from "../types";

/**
 * GET all playlists
 */
/**
 * GET all playlists.
 *
 * @returns A promise that resolves to an array of `Playlist` objects.
 */
export const listPlaylists = (): Promise<Playlist[]> =>
  request<Playlist[]>("/playlists/");

/**
 * POST a new playlist.
 * Returns the created Playlist so the UI can add it to the list immediately.
 */
/**
 * POST a new playlist.
 *
 * @param payload - Partial playlist data to create.
 * @returns A promise that resolves to the created `Playlist`.
 */
export const createPlaylist = (payload: Partial<Playlist>): Promise<Playlist> =>
  request<Playlist>("/playlists/", {
    method: "POST",
    body: JSON.stringify(payload),
  });

/**
 * DELETE a playlist by ID.
 */
/**
 * DELETE a playlist by ID.
 *
 * @param playlistId - ID of the playlist to delete.
 * @returns A promise that resolves when deletion is complete.
 */
export const deletePlaylist = (playlistId: number): Promise<void> =>
  request<void>(`/playlists/${playlistId}/`, { method: "DELETE" });

/**
 * PATCH (Update) a playlist.
 */
/**
 * PATCH (update) a playlist.
 *
 * @param playlistId - ID of the playlist to update.
 * @param payload - Partial playlist fields to update.
 * @returns A promise that resolves to the updated `Playlist`.
 */
export const updatePlaylist = (
  playlistId: number,
  payload: Partial<Playlist>,
): Promise<Playlist> =>
  request<Playlist>(`/playlists/${playlistId}/`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });

/**
 * GET details for a single playlist.
 */
/**
 * GET details for a single playlist.
 *
 * @param playlistId - ID of the playlist to fetch.
 * @returns A promise that resolves to the `Playlist` details.
 */
export const getPlaylistDetails = (playlistId: number): Promise<Playlist> =>
  request<Playlist>(`/playlists/${playlistId}/`);

/**
 * POST a song to a playlist.
 */
/**
 * POST a song to a playlist.
 *
 * @param playlistId - ID of the playlist to add the song to.
 * @param songId - ID of the song to add.
 * @returns A promise that resolves to the updated `Playlist`.
 */
export const addSongToPlaylist = (
  playlistId: number,
  songId: number,
): Promise<Playlist> =>
  request<Playlist>(`/playlists/${playlistId}/add_song/`, {
    method: "POST",
    body: JSON.stringify({ song_id: songId }),
  });

/**
 * DELETE a song from a playlist.
 */
/**
 * DELETE a song from a playlist.
 *
 * @param playlistId - ID of the playlist to remove the song from.
 * @param songId - ID of the song to remove.
 * @returns A promise that resolves to the updated `Playlist`.
 */
export const removeSongFromPlaylist = (
  playlistId: number,
  songId: number,
): Promise<Playlist> =>
  request<Playlist>(`/playlists/${playlistId}/delete_song/`, {
    method: "DELETE",
    body: JSON.stringify({ song_id: songId }),
  });
