import { useEffect, useRef, type FC } from "react";
import {
  getActiveLyricIndex,
  type ParsedLine,
} from "../../../../hooks/useLyrics";
import styles from "./SyncedLyrics.module.css";

interface SyncedLyricsProps {
  lines: ParsedLine[];
  position: number;
}

export const SyncedLyrics: FC<SyncedLyricsProps> = ({ lines, position }) => {
  const activeIdx = getActiveLyricIndex(lines, position);
  const activeRef = useRef<HTMLParagraphElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!activeRef.current || !containerRef.current) return;

    const container = containerRef.current;
    const activeNode = activeRef.current;

    // Manually calculate the scroll position to center the active line.
    const scrollPosition =
      activeNode.offsetTop -
      container.clientHeight / 2 +
      activeNode.clientHeight / 2;

    container.scrollTo({
      top: scrollPosition,
      behavior: "smooth",
    });
  }, [activeIdx]);

  return (
    <div ref={containerRef} className={styles.container}>
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
