import { useEffect, useRef, useState } from "react";
import { usePlayer } from "@/features/player/components";
import { useLyrics } from "../../../../hooks/useLyrics";
import { SyncedLyrics } from "../SyncedLyrics/SyncedLyrics";
import styles from "./LyricsSection.module.css";

interface LyricsSectionProps {
  song: { id: number; artist: string; title: string; album?: string };
}

export const LyricsSection = ({ song }: LyricsSectionProps) => {
  const { currentSong, getPosition } = usePlayer();
  const { plainLyrics, syncedLines, isLoading, notFound } = useLyrics(
    song.artist,
    song.title,
    song.album,
  );

  const [lyricPos, setLyricPos] = useState(0);
  const lyricFrameRef = useRef<number>(0);
  const isThisSongActive = currentSong?.id === song.id;

  useEffect(() => {
    if (!isThisSongActive || !syncedLines) return;
    const tick = () => {
      setLyricPos(getPosition());
      lyricFrameRef.current = requestAnimationFrame(tick);
    };
    lyricFrameRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(lyricFrameRef.current);
  }, [isThisSongActive, syncedLines, getPosition]);

  if (isLoading) return <p className={styles.dim}>Searching for lyrics…</p>;
  if (notFound)
    return <p className={styles.dim}>No lyrics found for this song.</p>;

  return (
    <section className={styles.lyricsSection}>
      <h2 className={styles.sectionTitle}>Lyrics</h2>
      {isThisSongActive && syncedLines && syncedLines.length > 0 ? (
        <SyncedLyrics lines={syncedLines} position={lyricPos} />
      ) : plainLyrics ? (
        <pre className={styles.plainLyrics}>{plainLyrics}</pre>
      ) : null}
    </section>
  );
};
