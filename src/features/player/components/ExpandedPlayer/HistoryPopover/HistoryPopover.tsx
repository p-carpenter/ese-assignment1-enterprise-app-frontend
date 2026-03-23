import { Button, DialogTrigger, Popover, Dialog } from "react-aria-components";
import { IoTimeOutline, IoCloseOutline } from "react-icons/io5";
import { PlayHistory } from "@/features/player/components";
import styles from "./HistoryPopover.module.css";

/**
 * A small popover control that shows recently played tracks.
 * Uses an accessible dialog inside a `Popover` and composes `PlayHistory`.
 * @returns A history popover element with trigger button.
 */
export const HistoryPopover = () => {
  return (
    <div className={styles.historyAnchor}>
      <DialogTrigger>
        <Button className={styles.iconButton} aria-label="Toggle play history">
          <IoTimeOutline size={24} />
        </Button>

        <Popover placement="top right" className={styles.historyPanel}>
          <Dialog className={styles.dialogOutline} aria-label="Play History">
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
  );
};
