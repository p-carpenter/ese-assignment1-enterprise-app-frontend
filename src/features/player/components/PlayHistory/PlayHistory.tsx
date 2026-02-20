import { useEffect, useState, type JSX } from "react";
import { type Song } from "@/features/songs/types";
import styles from "./PlayHistory.module.css";
import { getPlayHistory } from "../../api";

interface PlayHistoryProps {
  keyTrigger: number;
}

interface PlayHistoryEntry {
  song: Song;
  played_at: string;
}

export const PlayHistory = ({ keyTrigger }: PlayHistoryProps): JSX.Element => {
  const [playHistory, setPlayHistory] = useState<PlayHistoryEntry[]>([]);

  useEffect(() => {
    getPlayHistory()
      .then((data) => setPlayHistory(data))
      .catch((err) => console.error(err));
  }, [keyTrigger]);

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
    </div>
  );
};
