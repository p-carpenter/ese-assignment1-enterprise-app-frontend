import { type FC } from 'react';
import { usePlayer } from '../..';
import {
    ButtonNextSolid,
    ButtonPause2Solid,
    ButtonPlaySolid,
    ButtonPreviousSolid,
} from "@/shared/icons";
import styles from "./MiniPlayer.module.css";

const MiniPlayer = () => {
    const { currentSong, isPlaying, isLoading, play, pause, playPrev, playNext } = usePlayer();

    return (
        <div className={styles.miniPlayer}>
            <div className={styles.trackMeta}>
                <span className={styles.trackTitle}>
                    {currentSong?.title || "No track selected"}
                </span>
                <span className={styles.trackArtist}>{currentSong?.artist || "-"}</span>
            </div>

            <div className={styles.playerControls}>
                <button
                    type="button"
                    className={styles.playerButton}
                    onClick={() => void playPrev()}
                    disabled={!currentSong || isLoading}
                    aria-label="Previous track"
                >
                    <ButtonPreviousSolid />
                </button>

                <button
                    type="button"
                    className={styles.playerButtonPrimary}
                    onClick={() => (isPlaying ? pause() : play())}
                    disabled={!currentSong || isLoading}
                    aria-label={isPlaying ? "Pause" : "Play"}
                >
                    {isPlaying ? <ButtonPause2Solid /> : <ButtonPlaySolid />}
                </button>

                <button
                    type="button"
                    className={styles.playerButton}
                    onClick={() => void playNext()}
                    disabled={!currentSong || isLoading}
                    aria-label="Next track"
                >
                    <ButtonNextSolid />
                </button>
            </div>
        </div>
    );
};

export default MiniPlayer;