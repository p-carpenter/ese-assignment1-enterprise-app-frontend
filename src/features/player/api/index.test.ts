import { describe, it, expect, beforeEach } from "vitest";
import { getPlayHistory, logPlay } from "./index";
import { server } from "@/mocks/server";
import { http, HttpResponse } from "msw";
import { resetHandlerState } from "@/mocks/handlers";

describe("Player API", () => {
  beforeEach(() => {
    resetHandlerState();
  });

  describe("getPlayHistory", () => {
    it("returns paginated play history", async () => {
      const result = await getPlayHistory();
      expect(result.count).toBeGreaterThan(0);
      expect(result.results[0].song.title).toBe("Skyline");
    });

    it("returns an empty results array when there is no history", async () => {
      server.use(
        http.get("http://localhost:8000/api/history/", () =>
          HttpResponse.json({ count: 0, results: [] }),
        ),
      );

      const result = await getPlayHistory();
      expect(result.results).toEqual([]);
    });

    it("propagates request errors to the caller", async () => {
      server.use(
        http.get("http://localhost:8000/api/history/", () =>
          HttpResponse.error(),
        ),
      );

      await expect(getPlayHistory()).rejects.toThrow();
    });
  });

  describe("logPlay", () => {
    it("logs a play successfully", async () => {
      await expect(logPlay(1)).resolves.toBeUndefined();
    });

    it("silently swallows errors and does not throw", async () => {
      server.use(
        http.post("http://localhost:8000/api/history/", () =>
          HttpResponse.error(),
        ),
      );

      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      await expect(logPlay(1)).resolves.toBeUndefined();
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });
});
