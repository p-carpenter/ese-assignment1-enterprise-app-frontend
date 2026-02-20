import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  listSongs,
  uploadSong,
  deleteSong,
  updateSong,
  getSongDetails,
  searchSongs,
  logPlay,
} from "./index";

vi.mock("@/shared/api/client", () => ({
  request: vi.fn(),
}));

import { request } from "@/shared/api/client";
const mockRequest = vi.mocked(request);

const mockSong = {
  id: 1,
  title: "Song A",
  artist: "Artist 1",
  duration: 120,
  file_url: "http://example.com/song.mp3",
  cover_art_url: "http://example.com/cover.jpg",
};

describe("Songs API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("listSongs", () => {
    it("GETs /songs/ and returns an array of songs", async () => {
      mockRequest.mockResolvedValueOnce([mockSong]);

      const result = await listSongs();

      expect(mockRequest).toHaveBeenCalledWith("/songs/");
      expect(result).toEqual([mockSong]);
    });

    it("returns an empty array when there are no songs", async () => {
      mockRequest.mockResolvedValueOnce([]);

      expect(await listSongs()).toEqual([]);
    });
  });

  describe("uploadSong", () => {
    it("POSTs to /songs/ with the payload and returns the created song", async () => {
      mockRequest.mockResolvedValueOnce(mockSong);
      const payload = {
        title: "Song A",
        artist: "Artist 1",
        file_url: "http://example.com/song.mp3",
        duration: 120,
      };

      const result = await uploadSong(payload);

      expect(mockRequest).toHaveBeenCalledWith("/songs/", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      expect(result).toEqual(mockSong);
    });

    it("propagates errors on upload failure", async () => {
      mockRequest.mockRejectedValueOnce(new Error("Upload failed"));

      await expect(
        uploadSong({
          title: "X",
          artist: "Y",
          file_url: "url",
          duration: 0,
        }),
      ).rejects.toThrow("Upload failed");
    });
  });

  describe("deleteSong", () => {
    it("sends DELETE to /songs/:id/", async () => {
      mockRequest.mockResolvedValueOnce(undefined);

      await deleteSong(1);

      expect(mockRequest).toHaveBeenCalledWith("/songs/1/", {
        method: "DELETE",
      });
    });

    it("propagates errors when deletion fails", async () => {
      mockRequest.mockRejectedValueOnce(new Error("Not found"));

      await expect(deleteSong(99)).rejects.toThrow("Not found");
    });
  });

  describe("updateSong", () => {
    it("sends PUT to /songs/:id/ with a partial payload", async () => {
      mockRequest.mockResolvedValueOnce({ ...mockSong, title: "Updated" });

      const result = await updateSong(1, { title: "Updated" });

      expect(mockRequest).toHaveBeenCalledWith("/songs/1/", {
        method: "PUT",
        body: JSON.stringify({ title: "Updated" }),
      });
      expect(result.title).toBe("Updated");
    });
  });

  describe("getSongDetails", () => {
    it("GETs /songs/:id// and returns a single song", async () => {
      mockRequest.mockResolvedValueOnce(mockSong);

      const result = await getSongDetails(1);

      expect(mockRequest).toHaveBeenCalledWith("/songs/1//");
      expect(result).toEqual(mockSong);
    });
  });

  describe("searchSongs", () => {
    it("GETs /songs/search/?q=... with the URL-encoded query", async () => {
      mockRequest.mockResolvedValueOnce([mockSong]);

      const result = await searchSongs("Song A");

      expect(mockRequest).toHaveBeenCalledWith("/songs/search/?q=Song%20A");
      expect(result).toEqual([mockSong]);
    });

    it("encodes special characters in the query", async () => {
      mockRequest.mockResolvedValueOnce([]);

      await searchSongs("rock & roll");

      expect(mockRequest).toHaveBeenCalledWith(
        "/songs/search/?q=rock%20%26%20roll",
      );
    });
  });

  describe("logPlay", () => {
    it("POSTs to /history/ with the song id", async () => {
      mockRequest.mockResolvedValueOnce(undefined);

      await logPlay(1);

      expect(mockRequest).toHaveBeenCalledWith("/history/", {
        method: "POST",
        body: JSON.stringify({ song: 1 }),
      });
    });

    it("silently swallows errors and does not throw", async () => {
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});
      mockRequest.mockRejectedValueOnce(new Error("Network error"));

      await expect(logPlay(1)).resolves.toBeUndefined();
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });
});
