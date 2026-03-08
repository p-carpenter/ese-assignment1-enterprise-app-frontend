import { useState, type JSX } from "react";
import { useQuery } from "@tanstack/react-query";
import { type PlayHistoryEntry } from "../../types";
import styles from "./PlayHistory.module.css";
import { getPlayHistory, HISTORY_PAGE_SIZE } from "../../api";
import { queryKeys } from "@/shared/lib/queryKeys";

interface PlayHistoryProps {
  hideTitle?: boolean;
}

export const PlayHistory = ({
  hideTitle = false,
}: PlayHistoryProps): JSX.Element => {
  const [page, setPage] = useState(1);

  const { data } = useQuery({
    queryKey: queryKeys.playHistory(page),
    queryFn: () => getPlayHistory(page, HISTORY_PAGE_SIZE),
    // Keep previous page data visible while the next page loads
    placeholderData: (prev) => prev,
  });

  const playHistory: PlayHistoryEntry[] = data?.results ?? [];
  const totalCount = data?.count ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / HISTORY_PAGE_SIZE));
  return (
    <div className={styles.container}>
      {!hideTitle && <h3 className={styles.title}>Recently Played</h3>}
      <div className={styles.grid}>
        {playHistory.length === 0 ? (
          <p className={styles.text}>No play history yet</p>
        ) : (
          playHistory.map((entry) => (
            <div key={entry.id} className={styles.historyCard}>
              <div className={styles.songTitle}>
                {entry.song?.title || "Unknown Track"}
              </div>
              <div className={styles.songArtist}>
                {entry.song?.artist || "Unknown Artist"}
              </div>
              <div className={styles.songMeta}>
                {new Date(entry.played_at).toLocaleString()}
              </div>
            </div>
          ))
        )}
      </div>
      {totalPages > 1 && (
        <div className={styles.pagination}>
          <button
            className={styles.pageButton}
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
          >
            &lsaquo; Prev
          </button>
          <span className={styles.pageInfo}>
            {page} / {totalPages}
          </span>
          <button
            className={styles.pageButton}
            disabled={page === totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next &rsaquo;
          </button>
        </div>
      )}
    </div>
  );
};
