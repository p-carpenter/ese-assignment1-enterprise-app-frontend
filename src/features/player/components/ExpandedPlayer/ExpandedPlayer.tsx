import { useRef } from "react";
import {
  Button,
  DialogTrigger,
  Popover,
  Dialog,
  ModalOverlay,
  Modal,
  ToggleButton,
} from "react-aria-components";
import {
  PlaybackControls,
  usePlayer,
  PlayHistory,
  WaveProgressBar,
  PlaybackTimeDisplay,
  SongMeta,
} from "..";
import {
  IoTimeOutline,
  IoCloseOutline,
  IoRepeatOutline,
  IoChevronDownOutline,
  IoChevronUpOutline,
} from "react-icons/io5";
import { useIsOverflowing } from "@/features/player/hooks";
import { LyricsSection } from "@/features/songs/pages/SongDetailsPage/components";
import styles from "./ExpandedPlayer.module.css";

interface Props {
  onCollapse: () => void;
}

export const ExpandedPlayer = ({ onCollapse }: Props) => {
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

  const titleRef = useRef<HTMLSpanElement>(null);
  const artistRef = useRef<HTMLSpanElement>(null);

  const isScrolling = useIsOverflowing(titleRef, [currentSong]);
  const isArtistScrolling = useIsOverflowing(artistRef, [currentSong]);

  const maxDuration = Math.max(duration ?? 0, currentSong?.duration ?? 0);
  const disableControls = maxDuration <= 0 || isLoading;

  return (
    <div className={styles.expandedPlayer}>
      <div className={styles.expandedHeader}>
        <Button
          className={styles.collapseButton}
          onPress={onCollapse}
          aria-label="Collapse player"
        >
          <IoChevronDownOutline size={28} />
        </Button>
        <span className={styles.headerTitle}>Now Playing</span>
        <div className={styles.headerSpacer} />
      </div>

      <div className={styles.expandedMetaWrapper}>
        <SongMeta
          titleRef={titleRef}
          artistRef={artistRef}
          isScrolling={isScrolling}
          isArtistScrolling={isArtistScrolling}
          isExpanded={true}
        />
      </div>

      <div className={styles.expandedProgress}>
        <WaveProgressBar
          currentSong={currentSong ?? undefined}
          duration={duration}
          getPosition={getPosition}
          seek={seek}
          isExpanded={true}
        />
        <div className={styles.expandedTimeInfo}>
          <PlaybackTimeDisplay
            getPosition={getPosition}
            maxDuration={maxDuration}
            isPlaying={isPlaying}
          />
        </div>
      </div>

      <div className={styles.expandedPlaybackRow}>
        <ToggleButton
          className={styles.iconButton}
          isSelected={isLooping}
          onChange={toggleLoop}
          aria-label="Loop playback"
        >
          <IoRepeatOutline size={24} />
        </ToggleButton>

        <PlaybackControls
          isPlaying={isPlaying}
          isLoading={isLoading}
          onPlay={play}
          onPause={pause}
          onPrev={playPrev}
          onNext={playNext}
          disablePrev={disableControls}
          disableNext={disableControls}
          isExpanded={true}
        />

        <div className={styles.historyAnchor}>
          <DialogTrigger>
            <Button
              className={styles.iconButton}
              aria-label="Toggle play history"
            >
              <IoTimeOutline size={24} />
            </Button>

            <Popover placement="top right" className={styles.historyPanel}>
              <Dialog
                className={styles.dialogOutline}
                aria-label="Play History"
              >
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

      <div className={styles.expandedBottomAction}>
        <DialogTrigger>
          <Button className={styles.lyricsToggleBtn}>
            Lyrics <IoChevronUpOutline size={18} />
          </Button>

          <ModalOverlay isDismissable className={styles.modalOverlayBackground}>
            <Modal className={styles.lyricsOverlay}>
              <Dialog className={styles.lyricsDialog} aria-label="Lyrics">
                {({ close }) => (
                  <>
                    <div className={styles.lyricsHeader}>
                      <span className={styles.lyricsTitle}>Lyrics</span>
                      <Button
                        className={styles.collapseButton}
                        onPress={close}
                        aria-label="Close lyrics"
                      >
                        <IoChevronDownOutline size={28} />
                      </Button>
                    </div>
                    <div className={styles.lyricsContent}>
                      {currentSong && <LyricsSection song={currentSong} />}
                    </div>
                  </>
                )}
              </Dialog>
            </Modal>
          </ModalOverlay>
        </DialogTrigger>
      </div>
    </div>
  );
};
