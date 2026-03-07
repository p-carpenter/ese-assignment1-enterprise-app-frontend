import { useState, useRef, useEffect, type JSX } from "react";
import { useSearchParams } from "react-router-dom";
import { useInfiniteQuery } from "@tanstack/react-query";
import { SongList } from "../SongList/SongList";
import styles from "./SongLibrary.module.css";
import { listSongsPaginated } from "../../api";
import { queryKeys } from "@/shared/lib/queryKeys";

export const SongLibrary = (): JSX.Element => {
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get("q") ?? "";
  const [ordering, setOrdering] = useState("title");
  const containerRef = useRef<HTMLDivElement | null>(null);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error,
  } = useInfiniteQuery({
    queryKey: queryKeys.songs({ ordering, search: searchQuery }),
    queryFn: ({ pageParam }) =>
      listSongsPaginated(pageParam as number, ordering, searchQuery),
    initialPageParam: 1,
    // Keep the previous results visible while new search/sort results load
    placeholderData: (prev) => prev,
    // Move to the next page number as long as there are more results
    getNextPageParam: (lastPage, allPages) => {
      const totalLoaded = allPages.reduce(
        (sum, p) => sum + p.results.length,
        0,
      );
      return totalLoaded < lastPage.count ? allPages.length + 1 : undefined;
    },
  });

  const songs = data?.pages.flatMap((p) => p.results) ?? [];
  // Total comes from the server count field on any page (it's consistent)
  const totalCount = data?.pages[0]?.count ?? 0;

  useEffect(() => {
    if (isError) {
      console.error("Failed to fetch songs:", error);
    }
  }, [isError, error]);

  const handleScroll = () => {
    const container = containerRef.current;
    if (!container || isFetchingNextPage || !hasNextPage) return;
    if (
      container.scrollTop + container.clientHeight >=
      container.scrollHeight - 50
    ) {
      void fetchNextPage();
    }
  };

  return (
    <div className={styles.songLibraryWrapper}>
      <div className={styles.header}>
        <h3>Library ({totalCount} tracks)</h3>

        <select
          className={styles.orderingSelect}
          value={ordering}
          onChange={(e) => setOrdering(e.target.value)}
        >
          <option value="title">Title (A-Z)</option>
          <option value="-title">Title (Z-A)</option>
          <option value="uploaded_at">Uploaded (Oldest)</option>
          <option value="-uploaded_at">Uploaded (Newest)</option>
          <option value="release_year">Release Year (Oldest)</option>
          <option value="-release_year">Release Year (Newest)</option>
          <option value="duration">Duration (Shortest)</option>
          <option value="-duration">Duration (Longest)</option>
        </select>
      </div>

      <div
        ref={containerRef}
        onScroll={handleScroll}
        className={styles.scrollContainer}
      >
        {isLoading && <p>Loading...</p>}
        <SongList songs={songs} />
        {isFetchingNextPage && <p>Loading...</p>}
      </div>
    </div>
  );
};
