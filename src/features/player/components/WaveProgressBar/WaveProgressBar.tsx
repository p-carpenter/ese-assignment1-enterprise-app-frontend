import { useEffect, useMemo, useRef, useState, type FC } from "react";
import { Slider, SliderTrack, SliderThumb } from "react-aria-components";
import styles from "./WaveProgressBar.module.css";

interface WaveProgressBarProps {
  currentSong?: { duration: number; id: number };
  duration?: number;
  seek: (position: number) => void;
  getPosition: () => number;
  isExpanded?: boolean;
}

export const WaveProgressBar: FC<WaveProgressBarProps> = ({
  currentSong,
  duration: audioDuration,
  seek,
  getPosition,
  isExpanded = false,
}) => {
  /**
   * Visual waveform-like progress bar implemented using a sequence of bars.
   * Supports dragging to seek and syncs with the audio position.
   * @param currentSong Optional current song metadata.
   * @param duration Current playback duration in seconds.
   * @param seek Callback to seek to a specific position.
   * @returns Wave progress slider element.
   */
  const frameRef = useRef<number>(0);
  const [position, setPosition] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const barCount = isExpanded ? 80 : 280;

  const PLACEHOLDER_BARS = useMemo(
    () =>
      Array.from({ length: barCount }, (_, i) =>
        Math.round(
          12 + Math.abs(Math.sin(i * 0.71) * 55 + Math.sin(i * 0.29) * 25),
        ),
      ),
    [barCount],
  );

  const duration = Math.max(audioDuration ?? 0, currentSong?.duration ?? 0);

  // Sync progress from the audio engine on every frame, unless the user is dragging.
  useEffect(() => {
    const animate = () => {
      if (!isDragging) {
        setPosition(getPosition());
      }
      frameRef.current = requestAnimationFrame(animate);
    };
    if (currentSong) {
      frameRef.current = requestAnimationFrame(animate);
    }
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [currentSong, getPosition, isDragging]);

  return (
    <Slider
      className={`${styles.container} ${isExpanded ? styles.expanded : ""}`}
      value={position}
      onChange={(v) => {
        setIsDragging(true);
        setPosition(v as number);
      }}
      onChangeEnd={(v) => {
        setIsDragging(false);
        seek(v as number);
      }}
      minValue={0}
      maxValue={duration > 0 ? duration : 100}
      isDisabled={!currentSong || duration === 0}
      aria-label="Seek time"
    >
      <SliderTrack className={styles.wrapper}>
        {({ state }) => {
          const displayProgress =
            duration > 0 ? state.getThumbValue(0) / duration : 0;

          return (
            <>
              <div data-testid="wave-layer" className={styles.waveLayer}>
                {PLACEHOLDER_BARS.map((h, i) => (
                  <div
                    key={i}
                    className={`${styles.bar} ${
                      i / barCount <= displayProgress
                        ? styles.barPlayed
                        : styles.barUnplayed
                    }`}
                    style={{ height: `${h}%` }}
                  />
                ))}
              </div>

              <SliderThumb className={styles.thumb} />
            </>
          );
        }}
      </SliderTrack>
    </Slider>
  );
};
