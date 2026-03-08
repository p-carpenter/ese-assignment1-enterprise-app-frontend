import { type FC, type RefObject } from "react";
import { usePlayer } from "../..";
import styles from "./SongMeta.module.css";

interface SongMetaProps {
  titleRef: RefObject<HTMLSpanElement | null>;
  artistRef: RefObject<HTMLSpanElement | null>;
  isScrolling: boolean;
  isArtistScrolling: boolean;
}

export const SongMeta: FC<SongMetaProps> = ({
  titleRef,
  artistRef,
  isScrolling,
  isArtistScrolling,
}) => {
  const { currentSong } = usePlayer();

  return (
    <>
      <img
        src={currentSong?.cover_art_url || "https://placehold.co/48"}
        alt={currentSong?.title || "No track"}
        className={styles.albumArt}
      />
      <div className={styles.trackMeta}>
        <span
          ref={titleRef}
          className={`${styles.trackTitle} ${isScrolling ? styles.scrolling : ""}`}
        >
          {currentSong?.title || "No track selected"}
        </span>
        <span
          ref={artistRef}
          className={`${styles.trackArtist} ${isArtistScrolling ? styles.scrolling : ""}`}
        >
          {currentSong?.artist || "—"}
        </span>
      </div>
    </>
  );
};
