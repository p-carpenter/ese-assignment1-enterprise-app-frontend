import { request } from "@/shared/api/client";
import type { Playlist } from "../types";

/**
 * GET all playlists
 */
export const listPlaylists = (): Promise<Playlist[]> =>
  request<Playlist[]>("/playlists/");

/**
 * POST a new playlist.
 * Returns the created Playlist so the UI can add it to the list immediately.
 */
export const createPlaylist = (payload: Partial<Playlist>): Promise<Playlist> =>
  request<Playlist>("/playlists/", {
    method: "POST",
    body: JSON.stringify(payload),
  });

/**
 * DELETE a playlist by ID.
 */
export const deletePlaylist = (playlistId: number): Promise<void> =>
  request<void>(`/playlists/${playlistId}/`, { method: "DELETE" });

/**
 * PATCH (Update) a playlist.
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
export const getPlaylistDetails = (playlistId: number): Promise<Playlist> =>
  request<Playlist>(`/playlists/${playlistId}/`);

/**
 * POST a song to a playlist.
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
export const removeSongFromPlaylist = (
  playlistId: number,
  songId: number,
): Promise<Playlist> =>
  request<Playlist>(`/playlists/${playlistId}/delete_song/`, {
    method: "DELETE",
    body: JSON.stringify({ song_id: songId }),
  });
