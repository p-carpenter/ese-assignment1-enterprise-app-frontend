import { describe, it, expect, vi, afterEach } from "vitest";
import {
  listPlaylists,
  createPlaylist,
  deletePlaylist,
  updatePlaylist,
  getPlaylistDetails,
  addSongToPlaylist,
  removeSongFromPlaylist,
} from "./index";
import * as apiClient from "@/shared/api/client";
import type { Playlist } from "../types";

vi.mock("@/shared/api/client", () => ({
  request: vi.fn(),
}));

const mockedRequest = vi.mocked(apiClient.request);

describe("playlist API", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should list playlists", async () => {
    const mockPlaylists: Playlist[] = [
      {
        id: 1,
        title: "My Playlist",
        description: "A cool playlist",
        is_public: false,
        owner: 1,
        songs: [],
      },
    ];
    mockedRequest.mockResolvedValue(mockPlaylists);

    const playlists = await listPlaylists();

    expect(mockedRequest).toHaveBeenCalledWith("/playlists/");
    expect(playlists).toEqual(mockPlaylists);
  });

  it("should create a playlist", async () => {
    const newPlaylistPayload = { title: "New Playlist" };
    const mockPlaylist: Playlist = {
      id: 2,
      title: "New Playlist",
      description: "",
      is_public: false,
      owner: 1,
      songs: [],
    };
    mockedRequest.mockResolvedValue(mockPlaylist);

    const playlist = await createPlaylist(newPlaylistPayload);

    expect(mockedRequest).toHaveBeenCalledWith("/playlists/", {
      method: "POST",
      body: JSON.stringify(newPlaylistPayload),
    });
    expect(playlist).toEqual(mockPlaylist);
  });

  it("should delete a playlist", async () => {
    mockedRequest.mockResolvedValue(undefined);

    await deletePlaylist(1);

    expect(mockedRequest).toHaveBeenCalledWith("/playlists/1/", {
      method: "DELETE",
    });
  });

  it("should update a playlist", async () => {
    const updatedPlaylistPayload = { title: "Updated Playlist" };
    const mockPlaylist: Playlist = {
      id: 1,
      title: "Updated Playlist",
      description: "A cool playlist",
      is_public: false,
      owner: 1,
      songs: [],
    };
    mockedRequest.mockResolvedValue(mockPlaylist);

    const playlist = await updatePlaylist(1, updatedPlaylistPayload);

    expect(mockedRequest).toHaveBeenCalledWith("/playlists/1/", {
      method: "PATCH",
      body: JSON.stringify(updatedPlaylistPayload),
    });
    expect(playlist).toEqual(mockPlaylist);
  });

  it("should get playlist details", async () => {
    const mockPlaylist: Playlist = {
      id: 1,
      title: "My Playlist",
      description: "A cool playlist",
      is_public: false,
      owner: 1,
      songs: [],
    };
    mockedRequest.mockResolvedValue(mockPlaylist);

    const playlist = await getPlaylistDetails(1);

    expect(mockedRequest).toHaveBeenCalledWith("/playlists/1/");
    expect(playlist).toEqual(mockPlaylist);
  });

  it("should add a song to a playlist", async () => {
    const mockPlaylist: Playlist = {
      id: 1,
      title: "My Playlist",
      description: "A cool playlist",
      is_public: false,
      owner: 1,
      songs: [],
    };
    mockedRequest.mockResolvedValue(mockPlaylist);

    const playlist = await addSongToPlaylist(1, 101);

    expect(mockedRequest).toHaveBeenCalledWith("/playlists/1/add_song/", {
      method: "POST",
      body: JSON.stringify({ song_id: 101 }),
    });
    expect(playlist).toEqual(mockPlaylist);
  });

  it("should remove a song from a playlist", async () => {
    const mockPlaylist: Playlist = {
      id: 1,
      title: "My Playlist",
      description: "A cool playlist",
      is_public: false,
      owner: 1,
      songs: [],
    };
    mockedRequest.mockResolvedValue(mockPlaylist);

    const playlist = await removeSongFromPlaylist(1, 101);

    expect(mockedRequest).toHaveBeenCalledWith("/playlists/1/delete_song/", {
      method: "DELETE",
      body: JSON.stringify({ song_id: 101 }),
    });
    expect(playlist).toEqual(mockPlaylist);
  });
});
