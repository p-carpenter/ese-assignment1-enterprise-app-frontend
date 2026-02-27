import { type JSX } from "react";
import { usePlayer } from "../../../../shared/context/PlayerContext";
import { SongList } from "../SongList/SongList";
import styles from "./SongLibrary.module.css";

export const SongLibrary = (): JSX.Element => {
  const { songs } = usePlayer();

  return (
    <div className={styles.songList}>
      <h3 className={styles.libraryTitle}>Library ({songs.length} tracks)</h3>
      <SongList songs={songs} />
    </div>
  );
};
