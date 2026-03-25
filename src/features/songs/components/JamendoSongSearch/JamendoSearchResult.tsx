import { Button } from "@/shared/components";
import type { JamendoTrack } from "../../types";
import styles from "./JamendoSongSearch.module.css";

interface JamendoSearchResultProps {
  track: JamendoTrack;
  onImport: (track: JamendoTrack) => void;
  isImporting: boolean;
  isImported: boolean;
}

/**
 * Formats a duration in seconds as M:SS.
 * @param seconds Duration in seconds.
 * @returns A human-readable string like "3:05".
 */
const formatDuration = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

export const JamendoSearchResult = ({
  track,
  onImport,
  isImporting,
  isImported,
}: JamendoSearchResultProps) => {
  return (
    <li className={styles.resultItem}>
      <div className={styles.meta}>
        <img
          src={track.image || "https://placehold.co/220"}
          alt={`${track.name} cover art`}
          className={styles.coverArt}
        />
        <div className={styles.textWrapper}>
          <p className={styles.trackTitle}>{track.name}</p>
          <p className={styles.trackDetails}>
            {track.artist_name || "Unknown Artist"} •{" "}
            {formatDuration(Math.round(track.duration || 0))}
          </p>
        </div>
      </div>

      <Button
        size="small"
        onClick={() => void onImport(track)}
        isDisabled={isImporting || isImported}
      >
        {isImporting ? "Importing..." : isImported ? "Added" : "Import"}
      </Button>
    </li>
  );
};
