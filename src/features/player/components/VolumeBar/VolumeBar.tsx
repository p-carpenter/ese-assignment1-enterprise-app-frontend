import { type FC } from "react";
import { usePlayer } from "@/shared/context/PlayerContext";
import styles from "./VolumeBar.module.css";
import { IoVolumeMedium } from "react-icons/io5";

export const VolumeBar: FC = () => {
  const { volume, setVolume } = usePlayer();

  return (
    <div className={styles.wrapper}>
      <IoVolumeMedium className={styles.icon} />

      <input
        type="range"
        min={0}
        max={1}
        step={0.01}
        value={volume}
        onChange={(e) => setVolume(Number(e.target.value))}
        className={styles.volumeBar}
        aria-label="Volume"
        style={{ "--vol": volume } as React.CSSProperties}
      />
    </div>
  );
};
