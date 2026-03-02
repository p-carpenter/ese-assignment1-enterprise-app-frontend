import { useState, type JSX } from "react";
import { usePlayer } from "../../../../shared/context/PlayerContext";
import { SongList } from "../SongList/SongList";
import styles from "./SongLibrary.module.css";

const PAGE_SIZE = 10;

export const SongLibrary = (): JSX.Element => {
  const { songs } = usePlayer();
  const [page, setPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(songs.length / PAGE_SIZE));
  const start = (page - 1) * PAGE_SIZE;
  const pageSongs = songs.slice(start, start + PAGE_SIZE);

  return (
    <div className={styles.songList}>
      <h3 className={styles.libraryTitle}>Library ({songs.length} tracks)</h3>
      <SongList songs={pageSongs} />
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
