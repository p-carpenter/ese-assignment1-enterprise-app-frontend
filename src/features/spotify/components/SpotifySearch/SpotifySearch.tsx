import { useState, type KeyboardEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSpotify } from "../../context";
import { searchTracks } from "../../api";
import { uploadSong, listAllSongs } from "@/features/songs/api";
import type { SpotifyTrack } from "../../types";
import type { Song } from "@/features/songs";
import { SearchRow } from "../SearchRow/SearchRow";
import styles from "./SpotifySearch.module.css";
import { queryKeys } from "@/shared/lib/queryKeys";

const toSongPayload = (track: SpotifyTrack) => ({
  title: track.name,
  artist: track.artists.map((a) => a.name).join(", "),
  album: track.album.name,
  release_year: track.album.release_date.slice(0, 4),
  file_url: `https://open.spotify.com/track/${track.id}`,
  cover_art_url: track.album.images[0]?.url ?? "",
  duration: Math.round(track.duration_ms / 1000),
});

export const SpotifySearch = () => {
  const { isReady } = useSpotify();

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SpotifyTrack[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const { data: existingSongs } = useQuery<Song[]>({
    queryKey: queryKeys.allSongs,
    queryFn: listAllSongs,
    staleTime: 1000 * 60 * 5,
  });

  const handleSearch = async () => {
    if (!query.trim()) return;
    setIsSearching(true);
    setSearchError(null);
    try {
      const tracks = await searchTracks(query.trim());
      setResults(tracks);
    } catch (err) {
      setSearchError(
        err instanceof Error ? err.message : "Search failed. Try again.",
      );
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") void handleSearch();
  };

  const uploadTrackPayload = async (track: SpotifyTrack) => {
    await uploadSong(toSongPayload(track));
  };

  return (
    <div className={styles.container}>
      <div className={styles.statusBadge}>
        <span>
          {isReady ? "🟢 Spotify player ready" : "Connecting player…"}
        </span>
      </div>

      <div className={styles.searchRow}>
        <input
          className={styles.searchInput}
          type="text"
          placeholder="Search Spotify — artist, song, album…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button
          className={styles.searchBtn}
          onClick={() => void handleSearch()}
          disabled={isSearching || !query.trim()}
        >
          {isSearching ? "…" : "Search"}
        </button>
      </div>

      {searchError && <p className={styles.error}>{searchError}</p>}

      {results.length > 0 && (
        <div className={styles.results}>
          {results.map((track) => {
            const isAlreadyAdded =
              existingSongs?.some((song) => song.file_url.includes(track.id)) ??
              false;

            return (
              <SearchRow
                key={track.id}
                track={track}
                isAlreadyAdded={isAlreadyAdded}
                onUpload={uploadTrackPayload}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};
