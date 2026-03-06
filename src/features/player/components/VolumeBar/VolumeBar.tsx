import { useState, type FC } from "react";
import { useAudioPlayer } from "react-use-audio-player";
import styles from "./VolumeBar.module.css";

export const VolumeBar: FC = () => {
  const { setVolume } = useAudioPlayer();
  const [volume, setVolumeState] = useState(1);

  const handleChange = (value: number) => {
    setVolumeState(value);
    setVolume(value);
  };

  return (
    <div className={styles.wrapper}>
      <input
        type="range"
        min={0}
        max={1}
        step={0.01}
        value={volume}
        onChange={(e) => handleChange(Number(e.target.value))}
        className={styles.volumeBar}
        aria-label="Volume"
        style={{ "--vol": volume } as React.CSSProperties}
      />
    </div>
  );
};
