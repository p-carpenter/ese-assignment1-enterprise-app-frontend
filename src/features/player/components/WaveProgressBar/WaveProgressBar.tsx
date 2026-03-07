import { useEffect, useRef, type FC } from "react";
import WaveSurfer from "wavesurfer.js";
import styles from "./WaveProgressBar.module.css";

interface WaveProgressBarProps {
  currentSong?: { duration: number; file_url: string; id: number };
  seek: (position: number) => void;
}

export const WaveProgressBar: FC<WaveProgressBarProps> = ({
  currentSong,
  seek,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WaveSurfer | null>(null);

  useEffect(() => {
    if (!containerRef.current || !currentSong) return;

    wsRef.current?.destroy();
    wsRef.current = null;

    // Find the Howler <audio> element so wavesurfer's cursor syncs to actual playback
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const howls: any[] = (window as any).Howler?._howls ?? [];
    let audioEl: HTMLAudioElement | undefined;
    for (let i = howls.length - 1; i >= 0; i--) {
      const node = howls[i]?._sounds?.[0]?._node;
      if (node instanceof HTMLAudioElement) {
        audioEl = node;
        break;
      }
    }

    const ws = WaveSurfer.create({
      container: containerRef.current,
      waveColor: "#535353",
      progressColor: "#ffffff",
      cursorColor: "transparent",
      url: currentSong.file_url,
      media: audioEl,
      height: 40,
      barWidth: 2,
      barGap: 1,
      barRadius: 2,
      interact: true,
      normalize: true,
    });

    // Keep Howler context in sync when user clicks/drags on the waveform
    ws.on("interaction", (newTime: number) => {
      seek(newTime);
    });

    wsRef.current = ws;

    return () => {
      ws.destroy();
      wsRef.current = null;
    };
    // re-init only when the song changes, not on every seek callback reference change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSong?.id]);

  return <div ref={containerRef} className={styles.wrapper} />;
};
