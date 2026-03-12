import {
  describe,
  it,
  expect,
  vi,
  beforeAll,
  beforeEach,
  afterEach,
} from "vitest";
import { getValidAccessToken, clearCachedToken } from "./auth";

const TOKEN_KEY = "spotify_access_token_cache";
const EXPIRY_KEY = "spotify_token_expiry_cache";

const jsonResponse = (data: unknown, status = 200) =>
  Promise.resolve(
    new Response(JSON.stringify(data), {
      status,
      headers: { "Content-Type": "application/json" },
    }),
  );

// ── Stable in-memory localStorage mock ───────────────────────────────────────
// jsdom's localStorage can behave inconsistently with vitest's forks pool;
// stub it with a plain Map-backed implementation to keep tests hermetic.
const makeStorageMock = () => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
    _reset: () => {
      store = {};
    },
  };
};

const storageMock = makeStorageMock();

beforeAll(() => {
  vi.stubGlobal("localStorage", storageMock);
});

describe("Spotify auth — getValidAccessToken", () => {
  beforeEach(() => {
    storageMock._reset();
    vi.spyOn(globalThis, "fetch");
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns the cached token without hitting the network when still valid", async () => {
    storageMock.setItem(TOKEN_KEY, "cached-token");
    storageMock.setItem(EXPIRY_KEY, String(Date.now() + 60_000));

    const token = await getValidAccessToken();

    expect(token).toBe("cached-token");
    expect(fetch).not.toHaveBeenCalled();
  });

  it("does NOT use the cached token when it is within the 30-second buffer window", async () => {
    storageMock.setItem(TOKEN_KEY, "almost-expired");
    // Expiry is 20 s from now — inside the 30 s buffer, so should refresh
    storageMock.setItem(EXPIRY_KEY, String(Date.now() + 20_000));

    vi.mocked(fetch).mockResolvedValueOnce(
      await jsonResponse({ access_token: "refreshed", expires_in: 3600 }),
    );

    const token = await getValidAccessToken();

    expect(token).toBe("refreshed");
  });

  it("fetches a new token when the cache is empty", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      await jsonResponse({ access_token: "brand-new", expires_in: 3600 }),
    );

    const token = await getValidAccessToken();

    expect(token).toBe("brand-new");
    expect(fetch).toHaveBeenCalledOnce();
  });

  it("fetches a new token when the cached token has expired", async () => {
    storageMock.setItem(TOKEN_KEY, "stale-token");
    storageMock.setItem(EXPIRY_KEY, String(Date.now() - 5_000));

    vi.mocked(fetch).mockResolvedValueOnce(
      await jsonResponse({ access_token: "fresh-token", expires_in: 3600 }),
    );

    const token = await getValidAccessToken();

    expect(token).toBe("fresh-token");
  });

  it("persists the fetched token and expiry in localStorage", async () => {
    const now = Date.now();
    vi.mocked(fetch).mockResolvedValueOnce(
      await jsonResponse({ access_token: "stored-token", expires_in: 3600 }),
    );

    await getValidAccessToken();

    expect(storageMock.getItem(TOKEN_KEY)).toBe("stored-token");
    // Expiry should be roughly now + 3600 s (within 2 s tolerance)
    const expiry = Number(storageMock.getItem(EXPIRY_KEY));
    expect(expiry).toBeGreaterThan(now + 3598_000);
    expect(expiry).toBeLessThan(now + 3602_000);
  });

  it("hits the backend endpoint from VITE_API_BASE_URL with credentials: include", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      await jsonResponse({ access_token: "t", expires_in: 3600 }),
    );

    await getValidAccessToken();

    const [url, init] = vi.mocked(fetch).mock.calls[0] as [
      string,
      RequestInit & { credentials?: string },
    ];
    expect(url).toContain("/spotify/token/");
    expect(init.credentials).toBe("include");
  });

  it("returns null when the backend responds with a non-OK status", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(new Response(null, { status: 401 }));

    const token = await getValidAccessToken();

    expect(token).toBeNull();
  });

  it("returns null when fetch throws a network error", async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new Error("Network error"));

    const token = await getValidAccessToken();

    expect(token).toBeNull();
  });
});

describe("Spotify auth — clearCachedToken", () => {
  beforeEach(() => {
    storageMock._reset();
  });

  it("removes token and expiry from localStorage", () => {
    storageMock.setItem(TOKEN_KEY, "some-token");
    storageMock.setItem(EXPIRY_KEY, "9999999999999");

    clearCachedToken();

    expect(storageMock.getItem(TOKEN_KEY)).toBeNull();
    expect(storageMock.getItem(EXPIRY_KEY)).toBeNull();
  });

  it("does not throw when localStorage is already empty", () => {
    expect(() => clearCachedToken()).not.toThrow();
  });
});
