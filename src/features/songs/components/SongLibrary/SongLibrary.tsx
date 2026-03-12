import { useState, useRef, useEffect, useCallback, type JSX } from "react";
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
    placeholderData: (prev) => prev,
    getNextPageParam: (lastPage, allPages) => {
      const totalLoaded = allPages.reduce(
        (sum, p) => sum + p.results.length,
        0,
      );
      return totalLoaded < lastPage.count ? allPages.length + 1 : undefined;
    },
  });

  const songs = data?.pages.flatMap((p) => p.results) ?? [];
  const totalCount = data?.pages[0]?.count ?? 0;

  useEffect(() => {
    if (isError) {
      console.error("Failed to fetch songs:", error);
    }
  }, [isError, error]);

  const observer = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (isLoading || isFetchingNextPage) return;
      if (observer.current) observer.current.disconnect();

      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasNextPage) {
          void fetchNextPage();
        }
      });

      if (node) observer.current.observe(node);
    },
    [isLoading, isFetchingNextPage, hasNextPage, fetchNextPage],
  );

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

      <div className={styles.scrollContainer}>
        {isLoading && <p>Loading...</p>}
        <SongList songs={songs} />
        
        <div ref={loadMoreRef} className="h-10">
          {isFetchingNextPage && <p>Loading more...</p>}
        </div>
      </div>
    </div>
  );
};