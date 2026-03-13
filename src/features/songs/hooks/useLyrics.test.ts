import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useQuery } from "@tanstack/react-query";
import { useLyrics, parseSyncedLyrics, getActiveLyricIndex } from "./useLyrics";

vi.mock("@tanstack/react-query", () => ({
  useQuery: vi.fn(),
}));

type QueryOptionsShape = {
  queryKey: (string | undefined)[];
  enabled: boolean;
  staleTime: number;
  gcTime: number;
  retry: boolean;
  queryFn: () => Promise<unknown>;
};

const getLatestQueryOptions = (): QueryOptionsShape => {
  const calls = vi.mocked(useQuery).mock.calls;
  const latestArg = calls[calls.length - 1]?.[0];
  return latestArg as QueryOptionsShape;
};

describe("parseSyncedLyrics", () => {
  it("parses valid LRC lines into timestamped entries", () => {
    const parsed = parseSyncedLyrics("[00:01.50]First\n[01:05.25]Second");

    expect(parsed).toEqual([
      { time: 1.5, text: "First" },
      { time: 65.25, text: "Second" },
    ]);
  });

  it("filters out invalid and blank lyric lines", () => {
    const parsed = parseSyncedLyrics(
      "Not an lrc line\n[00:10.00]   \n[00:12.00]Valid",
    );

    expect(parsed).toEqual([{ time: 12, text: "Valid" }]);
  });
});

describe("getActiveLyricIndex", () => {
  const lines = [
    { time: 2, text: "A" },
    { time: 5, text: "B" },
    { time: 9, text: "C" },
  ];

  it("returns -1 when playback is before the first line", () => {
    expect(getActiveLyricIndex(lines, 1)).toBe(-1);
  });

  it("returns the latest matching index as playback advances", () => {
    expect(getActiveLyricIndex(lines, 2)).toBe(0);
    expect(getActiveLyricIndex(lines, 8)).toBe(1);
    expect(getActiveLyricIndex(lines, 20)).toBe(2);
  });
});

describe("useLyrics", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("fetch", vi.fn());

    vi.mocked(useQuery).mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: false,
    } as unknown as ReturnType<typeof useQuery>);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("configures useQuery with expected options", () => {
    renderHook(() => useLyrics("Artist", "Title", "Album"));

    const options = getLatestQueryOptions();
    expect(options.queryKey).toEqual(["lyrics", "Artist", "Title", "Album"]);
    expect(options.enabled).toBe(true);
    expect(options.staleTime).toBe(Infinity);
    expect(options.gcTime).toBe(Infinity);
    expect(options.retry).toBe(false);
  });

  it("disables query and returns idle state when artist or title is missing", () => {
    const { result } = renderHook(() => useLyrics(undefined, "Title"));

    const options = getLatestQueryOptions();
    expect(options.enabled).toBe(false);
    expect(result.current).toEqual({
      plainLyrics: null,
      syncedLines: null,
      isLoading: false,
      isError: false,
      notFound: false,
    });
  });

  it("returns loading state when query is loading", () => {
    vi.mocked(useQuery).mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
    } as unknown as ReturnType<typeof useQuery>);

    const { result } = renderHook(() => useLyrics("Artist", "Title"));

    expect(result.current).toEqual({
      plainLyrics: null,
      syncedLines: null,
      isLoading: true,
      isError: false,
      notFound: false,
    });
  });

  it("returns error state when query reports error", () => {
    vi.mocked(useQuery).mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
    } as unknown as ReturnType<typeof useQuery>);

    const { result } = renderHook(() => useLyrics("Artist", "Title"));

    expect(result.current).toEqual({
      plainLyrics: null,
      syncedLines: null,
      isLoading: false,
      isError: true,
      notFound: false,
    });
  });

  it("returns notFound=true when query succeeds with null data", () => {
    vi.mocked(useQuery).mockReturnValue({
      data: null,
      isLoading: false,
      isError: false,
    } as unknown as ReturnType<typeof useQuery>);

    const { result } = renderHook(() => useLyrics("Artist", "Title"));

    expect(result.current).toEqual({
      plainLyrics: null,
      syncedLines: null,
      isLoading: false,
      isError: false,
      notFound: true,
    });
  });

  it("returns plain lyrics and parsed synced lines when data is available", () => {
    vi.mocked(useQuery).mockReturnValue({
      data: {
        id: 1,
        trackName: "Title",
        artistName: "Artist",
        albumName: "Album",
        plainLyrics: "plain",
        syncedLyrics: "[00:01.00]Hello\n[00:03.00]World",
      },
      isLoading: false,
      isError: false,
    } as unknown as ReturnType<typeof useQuery>);

    const { result } = renderHook(() => useLyrics("Artist", "Title"));

    expect(result.current).toEqual({
      plainLyrics: "plain",
      syncedLines: [
        { time: 1, text: "Hello" },
        { time: 3, text: "World" },
      ],
      isLoading: false,
      isError: false,
      notFound: false,
    });
  });

  it("returns null syncedLines when syncedLyrics is null", () => {
    vi.mocked(useQuery).mockReturnValue({
      data: {
        id: 1,
        trackName: "Title",
        artistName: "Artist",
        albumName: "Album",
        plainLyrics: "plain",
        syncedLyrics: null,
      },
      isLoading: false,
      isError: false,
    } as unknown as ReturnType<typeof useQuery>);

    const { result } = renderHook(() => useLyrics("Artist", "Title"));

    expect(result.current.syncedLines).toBeNull();
  });

  it("queryFn returns null for a 404 response", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response("Not found", { status: 404 }),
    );

    renderHook(() => useLyrics("Artist", "Title"));
    const options = getLatestQueryOptions();

    await expect(options.queryFn()).resolves.toBeNull();
  });

  it("queryFn throws when response is not ok and not 404", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response("Server error", { status: 500 }),
    );

    renderHook(() => useLyrics("Artist", "Title"));
    const options = getLatestQueryOptions();

    await expect(options.queryFn()).rejects.toThrow("Lyrics fetch failed");
  });

  it("queryFn returns parsed JSON when response is ok and includes encoded params", async () => {
    const payload = {
      id: 1,
      trackName: "A Title",
      artistName: "A Name",
      albumName: "An Album",
      syncedLyrics: null,
      plainLyrics: "lyrics",
    };

    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify(payload), { status: 200 }),
    );

    renderHook(() => useLyrics("A Name", "A Title", "An Album"));
    const options = getLatestQueryOptions();

    await expect(options.queryFn()).resolves.toEqual(payload);
    expect(fetch).toHaveBeenCalledWith(
      "https://lrclib.net/api/get?artist_name=A+Name&track_name=A+Title",
    );
  });
});
