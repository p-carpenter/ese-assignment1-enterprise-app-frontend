import { useEffect, useState, type JSX } from "react";
import { type PlayHistoryEntry } from "../../types";
import styles from "./PlayHistory.module.css";
import { getPlayHistory } from "../../api";

const PAGE_SIZE = 10;

export const PlayHistory = ({
  keyTrigger,
}: {
  keyTrigger: number;
}): JSX.Element => {
  const [playHistory, setPlayHistory] = useState<PlayHistoryEntry[]>([]);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  useEffect(() => {
    getPlayHistory(page, PAGE_SIZE)
      .then((data) => {
        setPlayHistory(data.results);
        setTotalCount(data.count);
      })
      .catch((err) => console.error(err));
  }, [page, keyTrigger]);

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>Recently Played</h3>
      <div className={styles.grid}>
        {playHistory.length === 0 ? (
          <p className={styles.text}>No play history yet</p>
        ) : (
          playHistory.map((entry, index) => (
            <div key={index} className={styles.historyCard}>
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
