import { type FormEvent, useState } from "react";
import { AlertMessage, Button } from "@/shared/components";
import { ApiError } from "@/shared/api/errors";
import { uploadSong } from "../../api";
import { searchJamendoTracks } from "../../api/jamendo";
import type { JamendoTrack } from "../../types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/shared/lib/queryKeys";
import { JamendoSearchResult } from "./JamendoSearchResult";
import styles from "./JamendoSongSearch.module.css";

/**
 * Extracts the year from an ISO-like date string.
 * @param date Optional date string in YYYY-MM-DD or similar format.
 * @returns The numeric year if parseable, otherwise `undefined`.
 */
const getReleaseYear = (date?: string): number | undefined => {
  if (!date) return undefined;
  const yearStr = date.split("-")[0];
  const n = Number(yearStr);
  return Number.isFinite(n) ? n : undefined;
};

/**
 * UI for searching Jamendo tracks and importing a selected track into the app.
 * Handles searching, displays results and imports chosen tracks via `uploadSong`.
 * @param onImportSuccess Callback invoked after a successful import.
 * @returns A section element with search form and results.
 */
export const JamendoSongSearch = () => {
  const [query, setQuery] = useState("");
  const [tracks, setTracks] = useState<JamendoTrack[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isImportingTrackId, setIsImportingTrackId] = useState<string | null>(
    null,
  );
  const [importedTrackIds, setImportedTrackIds] = useState<string[]>([]);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);

  const hasResults = tracks.length > 0;
  const queryClient = useQueryClient();

  const handleSearch = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = query.trim();

    if (!trimmed) {
      setSearchError("Enter a title, artist, or keyword.");
      setTracks([]);
      return;
    }

    setIsSearching(true);
    setSearchError(null);
    setImportError(null);

    try {
      const foundTracks = await searchJamendoTracks(trimmed);
      setTracks(foundTracks);
    } catch (error) {
      setSearchError(
        error instanceof Error ? error.message : "Failed to search Jamendo.",
      );
      setTracks([]);
    } finally {
      setIsSearching(false);
    }
  };

  const uploadMutation = useMutation({
    mutationFn: uploadSong,
    onSuccess: () => {
      // Invalidate the songs query to refresh the list with the newly imported track.
      queryClient.invalidateQueries({ queryKey: queryKeys.allSongs });
    },
    onError: (error) => {
      setImportError(
        error instanceof ApiError
          ? error.getReadableMessage("Failed to import Jamendo track.")
          : error instanceof Error
            ? error.message
            : "Failed to import Jamendo track.",
      );
    },
    onSettled: () => {
      setIsImportingTrackId(null);
    },
  });

  const handleImport = async (track: JamendoTrack) => {
    const fileUrl = track.audiodownload || track.audio;

    if (!fileUrl) {
      setImportError("This track has no playable URL available for import.");
      return;
    }

    setIsImportingTrackId(track.id);
    setImportError(null);

    const release_year = getReleaseYear(track.releasedate);

    uploadMutation.mutate(
      {
        title: track.name,
        artist: track.artist_name || "Unknown Artist",
        album: track.album_name || "Unknown Album",
        release_year: release_year,
        file_url: fileUrl,
        cover_art_url: track.image || "",
        duration: Math.round(track.duration || 0),
      },
      {
        onSuccess: () => {
          setImportedTrackIds((prev) => [...prev, track.id]);
        },
      },
    );
  };

  return (
    <section className={styles.container}>
      <h2 className={styles.title}>Import from Jamendo</h2>

      <form className={styles.searchForm} onSubmit={handleSearch}>
        <input
          className={styles.input}
          type="text"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search Jamendo tracks"
          aria-label="Search Jamendo tracks"
        />
        <Button type="submit" size="large" isDisabled={isSearching}>
          {isSearching ? "Searching..." : "Search"}
        </Button>
      </form>

      <AlertMessage
        message={searchError}
        onDismiss={() => setSearchError(null)}
      />
      <AlertMessage
        message={importError}
        onDismiss={() => setImportError(null)}
      />

      {!isSearching && query.trim() && !hasResults && !searchError && (
        <p className={styles.emptyState}>No tracks found for this search.</p>
      )}

      {hasResults && (
        <ul className={styles.results}>
          {tracks.map((track) => (
            <JamendoSearchResult
              key={track.id}
              track={track}
              onImport={handleImport}
              isImporting={isImportingTrackId === track.id}
              isImported={importedTrackIds.includes(track.id)}
            />
          ))}
        </ul>
      )}
    </section>
  );
};
