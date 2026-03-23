import type { Song } from "@/features/songs/types";

let idCounter = 1;

export const createSong = (overrides: Partial<Song> = {}): Song => ({
  id: idCounter++,

  title: "Test Song",
  artist: "Test Artist",

  duration: 120,
  file_url: "https://example.com/test.mp3",

  cover_art_url: "https://placehold.co/220",
  uploaded_at: new Date().toISOString(),

  ...overrides,
});
