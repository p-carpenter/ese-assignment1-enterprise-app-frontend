import { type FC } from "react";
import { Slider, SliderTrack, SliderThumb } from "react-aria-components";
import { usePlayer } from "@/shared/context/PlayerContext";
import { IoVolumeMedium } from "react-icons/io5";
import styles from "./VolumeBar.module.css";

export const VolumeBar: FC = () => {
  /**
   * Volume control slider connected to the player context.
   * @returns Volume slider element.
   */
  const { volume, setVolume } = usePlayer();

  return (
    <div className={styles.wrapper}>
      <IoVolumeMedium className={styles.icon} aria-hidden="true" />

      <Slider
        value={volume}
        onChange={(v) => setVolume(v as number)}
        minValue={0}
        maxValue={1}
        step={0.01}
        aria-label="Volume"
        className={styles.slider}
      >
        <SliderTrack className={styles.track}>
          {({ state }) => (
            <>
              {/* This represents the filled portion of the bar. */}
              <div
                className={styles.fill}
                style={{ width: `${state.getThumbPercent(0) * 100}%` }}
                data-testid="volume-fill"
              />
              <SliderThumb className={styles.thumb} />
            </>
          )}
        </SliderTrack>
      </Slider>
    </div>
  );
};
