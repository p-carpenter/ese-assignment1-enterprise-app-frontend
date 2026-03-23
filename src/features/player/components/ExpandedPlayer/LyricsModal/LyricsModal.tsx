import {
  Button,
  DialogTrigger,
  ModalOverlay,
  Modal,
  Dialog,
} from "react-aria-components";
import { IoChevronUpOutline, IoChevronDownOutline } from "react-icons/io5";
import { LyricsSection } from "@/features/songs/pages/SongDetailsPage/components";
import styles from "./LyricsModal.module.css";
import { type Song } from "@/features/songs/types";

interface LyricsModalProps {
  currentSong: Song | null;
}

/**
 * Modal dialog that displays synced lyrics for the currently playing song.
 * Renders the `LyricsSection` inside an accessible dialog and exposes a toggle button.
 * @param currentSong The currently playing `Song` or `null`.
 * @returns A lyrics modal trigger and dialog.
 */
export const LyricsModal = ({ currentSong }: LyricsModalProps) => {
  return (
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
  );
};
