import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "@/mocks/server";
import { searchTracks, getTrack, playOnDevice } from ".";

// ── Mock auth module ──────────────────────────────────────────────────────────
vi.mock("../auth", () => ({
  getValidAccessToken: vi.fn(),
}));
import { getValidAccessToken } from "../auth";
const mockGetToken = vi.mocked(getValidAccessToken);

// ── Fixtures ──────────────────────────────────────────────────────────────────
const mockTrack = {
  id: "track1",
  name: "Bohemian Rhapsody",
  uri: "spotify:track:track1",
  duration_ms: 354_000,
  artists: [{ id: "a1", name: "Queen" }],
  album: {
    id: "alb1",
    name: "A Night at the Opera",
    release_date: "1975-11-21",
    images: [
      { url: "https://img.example.com/cover.jpg", width: 64, height: 64 },
    ],
  },
  preview_url: null,
};

// ── Shared setup ──────────────────────────────────────────────────────────────
beforeEach(() => {
  vi.clearAllMocks();
  mockGetToken.mockResolvedValue("fake-access-token");
});

afterEach(() => {
  // vitest.setup.ts calls server.resetHandlers() after each test
});

// ── searchTracks ──────────────────────────────────────────────────────────────
describe("Spotify API — searchTracks", () => {
  it("calls the Spotify search endpoint with correct query params", async () => {
    let capturedUrl: URL | undefined;

    server.use(
      http.get("https://api.spotify.com/v1/search", ({ request }) => {
        capturedUrl = new URL(request.url);
        return HttpResponse.json({ tracks: { items: [mockTrack] } });
      }),
    );

    await searchTracks("bohemian rhapsody");

    expect(capturedUrl?.searchParams.get("q")).toBe("bohemian rhapsody");
    expect(capturedUrl?.searchParams.get("type")).toBe("track");
    expect(capturedUrl?.searchParams.get("limit")).toBe("10");
  });

  it("includes the Bearer token in the Authorization header", async () => {
    let capturedAuth: string | null = null;

    server.use(
      http.get("https://api.spotify.com/v1/search", ({ request }) => {
        capturedAuth = request.headers.get("Authorization");
        return HttpResponse.json({ tracks: { items: [] } });
      }),
    );

    await searchTracks("test");

    expect(capturedAuth).toBe("Bearer fake-access-token");
  });

  it("returns the tracks array from the response body", async () => {
    server.use(
      http.get("https://api.spotify.com/v1/search", () =>
        HttpResponse.json({ tracks: { items: [mockTrack] } }),
      ),
    );

    const tracks = await searchTracks("queen");

    expect(tracks).toHaveLength(1);
    expect(tracks[0].id).toBe("track1");
    expect(tracks[0].name).toBe("Bohemian Rhapsody");
  });

  it("respects a custom limit parameter", async () => {
    let capturedLimit: string | null = null;

    server.use(
      http.get("https://api.spotify.com/v1/search", ({ request }) => {
        capturedLimit = new URL(request.url).searchParams.get("limit");
        return HttpResponse.json({ tracks: { items: [] } });
      }),
    );

    await searchTracks("test", 5);

    expect(capturedLimit).toBe("5");
  });

  it("throws when the API responds with a non-OK status", async () => {
    server.use(
      http.get(
        "https://api.spotify.com/v1/search",
        () => new HttpResponse(null, { status: 400 }),
      ),
    );

    await expect(searchTracks("test")).rejects.toThrow(
      "Spotify search failed.",
    );
  });

  it("throws 'Not authenticated' when no token is available", async () => {
    mockGetToken.mockResolvedValueOnce(null);

    await expect(searchTracks("test")).rejects.toThrow(
      "Not authenticated with Spotify.",
    );
  });
});

// ── getTrack ──────────────────────────────────────────────────────────────────
describe("Spotify API — getTrack", () => {
  it("GETs /v1/tracks/{trackId} and returns a track object", async () => {
    let capturedPath: string | undefined;

    server.use(
      http.get("https://api.spotify.com/v1/tracks/:trackId", ({ request }) => {
        capturedPath = new URL(request.url).pathname;
        return HttpResponse.json(mockTrack);
      }),
    );

    const track = await getTrack("track1");

    expect(capturedPath).toBe("/v1/tracks/track1");
    expect(track.id).toBe("track1");
    expect(track.name).toBe("Bohemian Rhapsody");
  });

  it("includes the Bearer token in the Authorization header", async () => {
    let capturedAuth: string | null = null;

    server.use(
      http.get("https://api.spotify.com/v1/tracks/:trackId", ({ request }) => {
        capturedAuth = request.headers.get("Authorization");
        return HttpResponse.json(mockTrack);
      }),
    );

    await getTrack("track1");

    expect(capturedAuth).toBe("Bearer fake-access-token");
  });

  it("throws when the track is not found (404)", async () => {
    server.use(
      http.get(
        "https://api.spotify.com/v1/tracks/:trackId",
        () => new HttpResponse(null, { status: 404 }),
      ),
    );

    await expect(getTrack("missing")).rejects.toThrow(
      "Failed to fetch Spotify track.",
    );
  });

  it("throws 'Not authenticated' when no token is available", async () => {
    mockGetToken.mockResolvedValueOnce(null);

    await expect(getTrack("track1")).rejects.toThrow(
      "Not authenticated with Spotify.",
    );
  });
});

// ── playOnDevice ──────────────────────────────────────────────────────────────
describe("Spotify API — playOnDevice", () => {
  it("sends PUT /me/player/play?device_id={id} with the URI in the body", async () => {
    let capturedUrl: URL | undefined;
    let capturedBody: unknown;

    server.use(
      http.put(
        "https://api.spotify.com/v1/me/player/play",
        async ({ request }) => {
          capturedUrl = new URL(request.url);
          capturedBody = await request.json();
          return new HttpResponse(null, { status: 204 });
        },
      ),
    );

    await playOnDevice("spotify:track:abc123", "device-xyz");

    expect(capturedUrl?.searchParams.get("device_id")).toBe("device-xyz");
    expect(capturedBody).toEqual({ uris: ["spotify:track:abc123"] });
  });

  it("includes the Bearer token in the Authorization header", async () => {
    let capturedAuth: string | null = null;

    server.use(
      http.put("https://api.spotify.com/v1/me/player/play", ({ request }) => {
        capturedAuth = request.headers.get("Authorization");
        return new HttpResponse(null, { status: 204 });
      }),
    );

    await playOnDevice("spotify:track:abc", "dev-1");

    expect(capturedAuth).toBe("Bearer fake-access-token");
  });

  it("resolves successfully on 202 Accepted", async () => {
    server.use(
      http.put(
        "https://api.spotify.com/v1/me/player/play",
        () => new HttpResponse(null, { status: 202 }),
      ),
    );

    await expect(
      playOnDevice("spotify:track:abc", "dev-1"),
    ).resolves.toBeUndefined();
  });

  it("throws on non-success status codes", async () => {
    server.use(
      http.put(
        "https://api.spotify.com/v1/me/player/play",
        () => new HttpResponse("Premium required", { status: 403 }),
      ),
    );

    await expect(playOnDevice("spotify:track:abc", "dev-1")).rejects.toThrow(
      "Spotify play command failed:",
    );
  });

  it("throws 'Not authenticated' when no token is available", async () => {
    mockGetToken.mockResolvedValueOnce(null);

    await expect(playOnDevice("spotify:track:abc", "dev-1")).rejects.toThrow(
      "Not authenticated with Spotify.",
    );
  });
});
