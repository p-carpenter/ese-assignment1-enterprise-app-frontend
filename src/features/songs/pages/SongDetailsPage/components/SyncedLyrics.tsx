import { useEffect, useRef, type FC } from "react";
import { getActiveLyricIndex, type ParsedLine } from "../../../hooks/useLyrics";
import styles from "./SyncedLyrics.module.css";

interface SyncedLyricsProps {
  lines: ParsedLine[];
  position: number; // current playback position in seconds
}

export const SyncedLyrics: FC<SyncedLyricsProps> = ({ lines, position }) => {
  const activeIdx = getActiveLyricIndex(lines, position);
  const activeRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    activeRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [activeIdx]);

  return (
    <div className={styles.container}>
      {lines.map((line, i) => (
        <p
          key={i}
          ref={i === activeIdx ? activeRef : null}
          className={`${styles.line} ${i === activeIdx ? styles.active : ""} ${
            i < activeIdx ? styles.past : ""
          }`}
        >
          {line.text}
        </p>
      ))}
    </div>
  );
};
