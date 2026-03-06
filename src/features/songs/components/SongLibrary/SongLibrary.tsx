import { useEffect, useState, useRef, useCallback, type JSX } from "react";
import { useSearchParams } from "react-router-dom";
import { SongList } from "../SongList/SongList";
import styles from "./SongLibrary.module.css";
import { listSongsPaginated } from "../../api";
import type { Song } from "../..";

export const SongLibrary = (): JSX.Element => {
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get("q") ?? "";

  const [songs, setSongs] = useState<Song[]>([]);
  const [page, setPage] = useState(1);
  const [ordering, setOrdering] = useState("title");
  const [totalCount, setTotalCount] = useState(0);
  const [isFetching, setIsFetching] = useState(false);

  const containerRef = useRef<HTMLDivElement | null>(null);

  const fetchSongs = useCallback(
    async (pageNumber: number, query: string, order: string, reset = false) => {
      setIsFetching(true);
      try {
        const data = await listSongsPaginated(pageNumber, order, query);
        setTotalCount(data.count);
        setSongs((prev) => (reset ? data.results : [...prev, ...data.results]));
      } catch (err) {
        console.error("Failed to fetch library:", err);
      } finally {
        setIsFetching(false);
      }
    },
    [],
  );

  useEffect(() => {
    setPage(1);
    fetchSongs(1, searchQuery, ordering, true);
  }, [searchQuery, ordering, fetchSongs]);

  // Handle pagination (only runs when page > 1)
  useEffect(() => {
    if (page > 1) {
      fetchSongs(page, searchQuery, ordering, false);
    }
  }, [page, searchQuery, ordering, fetchSongs]);

  const handleScroll = () => {
    const container = containerRef.current;
    if (!container || isFetching) return;

    if (
      container.scrollTop + container.clientHeight >=
      container.scrollHeight - 50
    ) {
      if (songs.length < totalCount) {
        setPage((prev) => prev + 1);
      }
    }
  };

  const handleSongDeleted = (deletedSongId: number) => {
    setSongs((prev) => prev.filter((s) => s.id !== deletedSongId));
    setTotalCount((prev) => prev - 1);
  };

  const handleSongUpdated = (updatedSong: Song) => {
    setSongs((prev) =>
      prev.map((s) => (s.id === updatedSong.id ? updatedSong : s)),
    );
  };

  return (
    <div className={styles.songLibraryWrapper}>
      <h3>Library ({totalCount} tracks)</h3>

      <select value={ordering} onChange={(e) => setOrdering(e.target.value)}>
        <option value="title">Title (A-Z)</option>
        <option value="-title">Title (Z-A)</option>
        <option value="uploaded_at">Uploaded (Oldest)</option>
        <option value="-uploaded_at">Uploaded (Newest)</option>
        <option value="release_year">Release Year (Oldest)</option>
        <option value="-release_year">Release Year (Newest)</option>
        <option value="duration">Duration (Shortest)</option>
        <option value="-duration">Duration (Longest)</option>
      </select>

      <div
        ref={containerRef}
        onScroll={handleScroll}
        className={styles.scrollContainer}
      >
        <SongList
          songs={songs}
          onSongDeleted={handleSongDeleted}
          onSongUpdated={handleSongUpdated}
        />
        {isFetching && <p>Loading...</p>}
      </div>
    </div>
  );
};
