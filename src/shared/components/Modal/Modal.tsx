import { type ReactNode } from "react";
import { ModalOverlay, Modal as AriaModal, Dialog, Heading, Button } from "react-aria-components";
import styles from "./Modal.module.css";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
}

export const Modal = ({ isOpen, onClose, children, title }: ModalProps) => {
  return (
    <ModalOverlay
      isOpen={isOpen}
      onOpenChange={(isOpen) => !isOpen && onClose()}
      className={styles.overlay}
      isDismissable
    >
      <AriaModal className={styles.modal}>
        <Dialog
          className={styles.dialog}
          {...(!title ? { 'aria-label': 'Dialog' } : {})}
        >
          {({ close }) => (
            <>
              <Button onPress={close} className={styles.closeButton} aria-label="Close">
                ×
              </Button>
              {title && <Heading slot="title" className={styles.title}>{title}</Heading>}
              <div className={styles.content}>{children}</div>
            </>
          )}
        </Dialog>
      </AriaModal>
    </ModalOverlay>
  );
};