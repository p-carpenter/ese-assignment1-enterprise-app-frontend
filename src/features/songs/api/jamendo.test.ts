import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { searchJamendoTracks } from "./jamendo";

describe("jamendo API", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe("searchJamendoTracks", () => {
    it("throws when VITE_JAMENDO_CLIENT_ID is missing", async () => {
      vi.stubEnv("VITE_JAMENDO_CLIENT_ID", "");

      await expect(searchJamendoTracks("rock")).rejects.toThrow(
        "Missing VITE_JAMENDO_CLIENT_ID environment variable.",
      );
    });

    it("calls Jamendo endpoint with default limit and returns results", async () => {
      vi.stubEnv("VITE_JAMENDO_CLIENT_ID", "client-123");

      const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          results: [{ id: "1", name: "Song", artist_name: "Artist" }],
        }),
      } as Response);

      const result = await searchJamendoTracks("lofi");

      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining("https://api.jamendo.com/v3.0/tracks/?"),
      );
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining("client_id=client-123"),
      );
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining("search=lofi"),
      );
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining("limit=10"),
      );
      expect(result).toEqual([{ id: "1", name: "Song", artist_name: "Artist" }]);
    });

    it("uses explicit limit argument in request", async () => {
      vi.stubEnv("VITE_JAMENDO_CLIENT_ID", "client-123");

      const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
        ok: true,
        json: async () => ({ results: [] }),
      } as Response);

      await searchJamendoTracks("jazz", 25);

      expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining("limit=25"));
    });

    it("throws when Jamendo response is not ok", async () => {
      vi.stubEnv("VITE_JAMENDO_CLIENT_ID", "client-123");
      vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: "Bad request" }),
      } as Response);

      await expect(searchJamendoTracks("bad")).rejects.toThrow(
        "Failed to search Jamendo tracks.",
      );
    });

    it("returns empty array when results are missing", async () => {
      vi.stubEnv("VITE_JAMENDO_CLIENT_ID", "client-123");
      vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [] }),
      } as Response);

      await expect(searchJamendoTracks("ambient")).resolves.toEqual([]);
    });
  });
});
