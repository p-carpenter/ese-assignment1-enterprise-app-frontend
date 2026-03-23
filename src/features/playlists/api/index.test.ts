import { describe, it, expect, beforeEach } from "vitest";
import {
  listPlaylists,
  createPlaylist,
  deletePlaylist,
  updatePlaylist,
  getPlaylistDetails,
  addSongToPlaylist,
  removeSongFromPlaylist,
} from "./index";
import { resetHandlerState } from "@/mocks/handlers";

describe("playlist API", () => {
  beforeEach(() => {
    resetHandlerState();
  });

  it("should list playlists", async () => {
    const playlists = await listPlaylists();
    expect(playlists.length).toBeGreaterThan(0);
    expect(playlists[0].title).toBe("Initial Playlist");
  });

  it("should create a playlist", async () => {
    const playlist = await createPlaylist({ title: "My Custom Mix" });
    expect(playlist.title).toBe("My Custom Mix");
    expect(playlist.id).toBeDefined();
  });

  it("should delete a playlist", async () => {
    await deletePlaylist(1);
    const remaining = await listPlaylists();
    expect(remaining.find((p) => p.id === 1)).toBeUndefined();
  });

  it("should update a playlist", async () => {
    const playlist = await updatePlaylist(1, { title: "Renamed Title" });
    expect(playlist.title).toBe("Renamed Title");
  });

  it("should get playlist details", async () => {
    const playlist = await getPlaylistDetails(1);
    expect(playlist.id).toBe(1);
    expect(playlist.title).toBe("Initial Playlist");
  });

  it("should add a song to a playlist", async () => {
    const playlist = await addSongToPlaylist(1, 1);
    expect(playlist.songs.some((s) => s.song.id === 1)).toBe(true);
  });

  it("should remove a song from a playlist", async () => {
    await addSongToPlaylist(1, 1);
    const playlist = await removeSongFromPlaylist(1, 1);
    expect(playlist.songs.some((s) => s.song.id === 1)).toBe(false);
  });
});
