import { useRef } from "react";
import { useNavigate } from "react-router-dom";
import { PlaybackControls, usePlayer, PlayHistory, WaveProgressBar } from "..";
import {
  IoTimeOutline,
  IoCloseOutline,
  IoRepeatOutline,
} from "react-icons/io5";
import styles from "./MiniPlayer.module.css";
import { SongMeta, PlaybackTimeDisplay, VolumeBar } from "../";
import { useIsOverflowing } from "../../hooks/useOverflow";
import { useMediaQuery } from "@/shared/hooks";
import { DialogTrigger, Button, Popover, Dialog } from "react-aria-components";
interface Props {
  onExpand: () => void;
}

export const MiniPlayer = ({ onExpand }: Props) => {
  const {
    currentSong,
    isPlaying,
    isLoading,
    isLooping,
    duration,
    play,
    pause,
    playPrev,
    playNext,
    seek,
    getPosition,
    toggleLoop,
  } = usePlayer();

  const navigate = useNavigate();
  const isMobile = useMediaQuery("(max-width: 920px)");

  const titleRef = useRef<HTMLSpanElement>(null);
  const artistRef = useRef<HTMLSpanElement>(null);

  const isScrolling = useIsOverflowing(titleRef, [currentSong]);
  const isArtistScrolling = useIsOverflowing(artistRef, [currentSong]);

  const maxDuration = Math.max(duration ?? 0, currentSong?.duration ?? 0);
  const disableControls = maxDuration <= 0 || isLoading;

  const handleMetaClick = () => {
    if (!currentSong) return;
    if (isMobile) {
      onExpand();
    } else {
      navigate(`/songs/${currentSong.id}`);
    }
  };

  return (
    <div className={styles.miniPlayer}>
      <Button
        className={styles.metaWrapper}
        onPress={handleMetaClick}
        isDisabled={!currentSong}
        aria-label="View song details"
      >
        <SongMeta
          titleRef={titleRef}
          artistRef={artistRef}
          isScrolling={isScrolling}
          isArtistScrolling={isArtistScrolling}
          isExpanded={false}
        />
      </Button>

      <div className={styles.mainControls}>
        <PlaybackControls
          isPlaying={isPlaying}
          isLoading={isLoading}
          onPlay={play}
          onPause={pause}
          onPrev={playPrev}
          onNext={playNext}
          disablePrev={disableControls}
          disableNext={disableControls}
        />
      </div>

      <div className={styles.progressWrapper}>
        <WaveProgressBar
          currentSong={currentSong ?? undefined}
          duration={duration}
          getPosition={getPosition}
          seek={seek}
          isExpanded={false}
        />
      </div>

      <div className={styles.desktopControls}>
        <PlaybackTimeDisplay
          getPosition={getPosition}
          maxDuration={maxDuration}
          isPlaying={isPlaying}
        />
        <VolumeBar />
        <button
          className={`${styles.iconButton} ${isLooping ? styles.iconButtonActive : ""}`}
          onClick={toggleLoop}
          aria-label={isLooping ? "Disable loop" : "Enable loop"}
        >
          <IoRepeatOutline size={20} />
        </button>
        <div className={styles.historyAnchor}>
          <DialogTrigger>
            <Button
              className={styles.iconButton}
              aria-label="Toggle play history"
            >
              <IoTimeOutline size={20} />
            </Button>

            <Popover placement="top right" className={styles.historyPanel}>
              <Dialog className={styles.dialogOutline}>
                {({ close }) => (
                  <>
                    <div className={styles.historyPanelHeader}>
                      <span className={styles.historyPanelTitle}>
                        Recently Played
                      </span>
                      <Button
                        onPress={close}
                        className={styles.historyPanelClose}
                        aria-label="Close history"
                      >
                        <IoCloseOutline size={18} />
                      </Button>
                    </div>
                    <PlayHistory hideTitle />
                  </>
                )}
              </Dialog>
            </Popover>
          </DialogTrigger>
        </div>
      </div>
    </div>
  );
};
