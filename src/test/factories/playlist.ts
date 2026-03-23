import type { Playlist } from "@/features/playlists/types";
import { createSong } from "./song";

let idCounter = 1;

export const createPlaylist = (
  overrides: Partial<Playlist> = {},
): Playlist => ({
  id: idCounter++,
  title: "Test Playlist",
  description: "A test playlist description",
  is_public: true,
  is_collaborative: false,
  cover_art_url: "https://placehold.co/220",
  owner: { id: 1, username: "testuser" },
  songs: [
    {
      id: 100,
      order: 1,
      added_at: new Date().toISOString(),
      song: createSong(),
    },
  ],
  ...overrides,
});
