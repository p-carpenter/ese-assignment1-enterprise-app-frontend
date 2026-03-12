import { useState, type KeyboardEvent } from "react";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { useSpotify } from "../SpotifyContext";
import { searchTracks } from "../api";
import { uploadSong } from "@/features/songs/api";
import type { SpotifyTrack } from "../types";
import styles from "./SpotifySearch.module.css";
import type { Song } from "@/features/songs";

/** Converts a Spotify track into the payload expected by the Django backend.
 * Stores the canonical open.spotify.com URL (a valid URLField value)
 * rather than the spotify: URI protocol, and convert back at playback time.
 */
const toSongPayload = (track: SpotifyTrack) => ({
  title: track.name,
  artist: track.artists.map((a) => a.name).join(", "),
  album: track.album.name,
  release_year: track.album.release_date.slice(0, 4),
  file_url: `http://googleusercontent.com/spotify.com/${track.id}`,
  cover_art_url: track.album.images[0]?.url ?? "",
  duration: Math.round(track.duration_ms / 1000),
});

export const SpotifySearch = () => {
  const queryClient = useQueryClient();
  const { isReady } = useSpotify();

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SpotifyTrack[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [addingId, setAddingId] = useState<string | null>(null);

  const { data: existingSongs } = useQuery<Song[]>({
    queryKey: ["songs"],
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

  const handleAddToLibrary = async (track: SpotifyTrack) => {
    setAddingId(track.id);
    try {
      await uploadSong(toSongPayload(track));
      await queryClient.invalidateQueries({ queryKey: ["songs"] });
    } catch (err) {
      console.error("Failed to add track:", err);
    } finally {
      setAddingId(null);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.statusBadge}>
        <span>
          {isReady ? "🟢 Spotify player ready" : "⏳ Connecting player…"}
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
            const cover =
              track.album.images.find((img) => img.width <= 64) ??
              track.album.images[track.album.images.length - 1];

            const added =
              existingSongs?.some((song) => song.file_url.includes(track.id)) ??
              false;
            const adding = addingId === track.id;

            return (
              <div key={track.id} className={styles.resultRow}>
                {cover && (
                  <img
                    className={styles.cover}
                    src={cover.url}
                    alt={track.album.name}
                  />
                )}
                <div className={styles.meta}>
                  <div className={styles.trackName}>{track.name}</div>
                  <div className={styles.trackSub}>
                    {track.artists.map((a) => a.name).join(", ")} ·{" "}
                    {track.album.name}
                  </div>
                </div>
                <button
                  className={styles.addBtn}
                  onClick={() => void handleAddToLibrary(track)}
                  disabled={adding || added}
                >
                  {added ? "Added ✓" : adding ? "Adding…" : "Add"}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
