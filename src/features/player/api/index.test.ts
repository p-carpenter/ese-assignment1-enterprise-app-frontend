import { describe, it, expect, vi, beforeEach } from "vitest";
import { getPlayHistory, logPlay } from "./index";

vi.mock("@/shared/api/client", () => ({
  request: vi.fn(),
}));

import { request } from "@/shared/api/client";
const mockRequest = vi.mocked(request);

const mockHistory = [
  {
    song: {
      id: 1,
      title: "Song A",
      artist: "Artist A",
      duration: 120,
      file_url: "http://example.com/a.mp3",
    },
    played_at: "2026-01-01T00:00:00Z",
  },
  {
    song: {
      id: 2,
      title: "Song B",
      artist: "Artist B",
      duration: 200,
      file_url: "http://example.com/b.mp3",
    },
    played_at: "2026-01-02T00:00:00Z",
  },
];

describe("Player API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getPlayHistory", () => {
    it("GETs /history/ and returns the play history array", async () => {
      mockRequest.mockResolvedValueOnce(mockHistory);

      const result = await getPlayHistory();

      expect(mockRequest).toHaveBeenCalledWith("/history/");
      expect(result).toEqual(mockHistory);
    });

    it("returns an empty array when there is no history", async () => {
      mockRequest.mockResolvedValueOnce([]);

      const result = await getPlayHistory();

      expect(result).toEqual([]);
    });

    it("propagates request errors to the caller", async () => {
      mockRequest.mockRejectedValueOnce(new Error("Network error"));

      await expect(getPlayHistory()).rejects.toThrow("Network error");
    });
  });

  describe("logPlay", () => {
    it("POSTs to /history/ with the song id", async () => {
      mockRequest.mockResolvedValueOnce(undefined);

      await logPlay(42);

      expect(mockRequest).toHaveBeenCalledWith("/history/", {
        method: "POST",
        body: JSON.stringify({ song: 42 }),
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
