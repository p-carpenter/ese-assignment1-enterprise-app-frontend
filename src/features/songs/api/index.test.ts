import { describe, it, expect, beforeEach } from "vitest";
import {
  listAllSongs,
  listSongsPaginated,
  uploadSong,
  deleteSong,
  updateSong,
  getSongDetails,
  searchSongs,
} from "./index";
import { resetHandlerState } from "@/mocks/handlers";

describe("Songs API", () => {
  beforeEach(() => {
    resetHandlerState();
  });

  describe("listSongs", () => {
    it("returns an array of all songs", async () => {
      const result = await listAllSongs();
      expect(result.length).toBeGreaterThan(0);
      expect(result[0].title).toBe("Skyline");
    });
  });

  describe("listSongsPaginated", () => {
    it("returns a paginated response with the default query", async () => {
      const result = await listSongsPaginated(1, "title");
      expect(result.count).toBeGreaterThan(0);
      expect(result.results[0].title).toBe("Skyline");
    });

    it("appends a search param when a query is provided", async () => {
      const result = await listSongsPaginated(1, "title", "Sunset");
      expect(result.results.length).toBe(1);
      expect(result.results[0].title).toBe("Sunset");
    });
  });

  describe("uploadSong", () => {
    it("POSTs to the server and returns the created song", async () => {
      const payload = {
        title: "New Hit",
        artist: "New Artist",
        file_url: "http://example.com/song.mp3",
        cover_art_url: "https://placehold.co/220",
        duration: 120,
      };

      const result = await uploadSong(payload);
      expect(result.title).toBe("New Hit");
      expect(result.id).toBeDefined();
    });
  });

  describe("deleteSong", () => {
    it("removes the song successfully", async () => {
      await deleteSong(1);
      const remaining = await listAllSongs();
      expect(remaining.find((s) => s.id === 1)).toBeUndefined();
    });
  });

  describe("updateSong", () => {
    it("updates the song details", async () => {
      const result = await updateSong(1, { title: "Skyline (Remix)" });
      expect(result.title).toBe("Skyline (Remix)");
    });
  });

  describe("getSongDetails", () => {
    it("returns a single song by ID", async () => {
      const result = await getSongDetails(1);
      expect(result.id).toBe(1);
      expect(result.title).toBe("Skyline");
    });
  });

  describe("searchSongs", () => {
    it("returns matching songs based on query", async () => {
      const result = await searchSongs("Sunset");
      expect(result.length).toBe(1);
      expect(result[0].title).toBe("Sunset");
    });
  });
});
