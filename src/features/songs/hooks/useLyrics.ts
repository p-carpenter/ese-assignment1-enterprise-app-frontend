import { useQuery } from "@tanstack/react-query";

interface LrclibResponse {
  id: number;
  trackName: string;
  artistName: string;
  albumName: string;
  syncedLyrics: string | null;
  plainLyrics: string | null;
}

export interface ParsedLine {
  time: number; // seconds
  text: string;
}

const LRC_RE = /^\[(\d{2}):(\d{2}\.\d+)\]\s*(.*)/;

/** Parses an LRC-format string into timestamped lines (seconds). */
/**
 * Parse an LRC formatted lyrics string into timestamped lines (seconds).
 * @param lrc LRC formatted lyrics text.
 * @returns Array of parsed lines with `time` and `text`.
 */
export const parseSyncedLyrics = (lrc: string): ParsedLine[] =>
  lrc
    .split("\n")
    .map((line) => {
      const m = line.match(LRC_RE);
      if (!m) return null;
      const time = Number(m[1]) * 60 + Number(m[2]);
      return { time, text: m[3] };
    })
    .filter((l): l is ParsedLine => l !== null && l.text.trim() !== "");

/** Returns the index of the lyric line that should currently be highlighted. */
/**
 * Return the active lyric line index for a given playback position.
 * @param lines Parsed lyric lines.
 * @param position Current playback position in seconds.
 */
export const getActiveLyricIndex = (
  lines: ParsedLine[],
  position: number,
): number => {
  let idx = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].time <= position) idx = i;
    else break;
  }
  return idx;
};

interface UseLyricsResult {
  plainLyrics: string | null;
  syncedLines: ParsedLine[] | null;
  isLoading: boolean;
  isError: boolean;
  notFound: boolean;
}

/**
 * Fetches lyrics for a song from lrclib.net.
 * Returns both plain and synced (LRC) lyrics where available.
 */
/**
 * Hook that fetches lyrics (plain and synced) for an artist/title pair.
 * @param artist Artist name.
 * @param title Track title.
 * @param album Optional album name.
 * @returns An object with `plainLyrics`, `syncedLines` and status flags.
 */
export const useLyrics = (
  artist: string | undefined,
  title: string | undefined,
  album?: string,
): UseLyricsResult => {
  const enabled = !!(artist && title);

  const { data, isLoading, isError } = useQuery<LrclibResponse | null>({
    queryKey: ["lyrics", artist, title, album],
    queryFn: async () => {
      const params = new URLSearchParams({
        artist_name: artist!,
        track_name: title!,
      });
      const res = await fetch(
        `https://lrclib.net/api/get?${params.toString()}`,
      );
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Lyrics fetch failed");
      return res.json() as Promise<LrclibResponse>;
    },
    enabled,
    staleTime: Infinity, // lyrics don't change – never consider stale
    gcTime: Infinity, // keep in cache permanently so navigating away & back doesn't re-fetch
    retry: false,
  });

  if (!enabled || isLoading)
    return {
      plainLyrics: null,
      syncedLines: null,
      isLoading,
      isError: false,
      notFound: false,
    };
  if (isError)
    return {
      plainLyrics: null,
      syncedLines: null,
      isLoading: false,
      isError: true,
      notFound: false,
    };
  if (!data)
    return {
      plainLyrics: null,
      syncedLines: null,
      isLoading: false,
      isError: false,
      notFound: true,
    };

  return {
    plainLyrics: data.plainLyrics,
    syncedLines: data.syncedLyrics
      ? parseSyncedLyrics(data.syncedLyrics)
      : null,
    isLoading: false,
    isError: false,
    notFound: false,
  };
};
