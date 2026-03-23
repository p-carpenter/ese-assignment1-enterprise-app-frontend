import {
  IoWarningOutline,
  IoCheckmarkCircleOutline,
  IoCloseOutline,
} from "react-icons/io5";
import styles from "./AlertMessage.module.css";

/**
 * Props for `AlertMessage` component.
 */
interface AlertMessageProps {
  message: string | null | undefined;
  variant?: "error" | "success";
  onDismiss?: () => void;
}

export const AlertMessage = ({
  message,
  variant = "error",
  onDismiss,
}: AlertMessageProps) => {
  /**
   * Simple alert/status message UI.
   * @param message Message text to display.
   * @param variant Visual variant: error or success.
   * @param onDismiss Optional dismiss handler.
   * @returns A styled alert element or null when no message.
   */
  if (!message) return null;

  const isError = variant === "error";

  return (
    <div
      className={`${styles.alert} ${isError ? styles.error : styles.success}`}
      role={isError ? "alert" : "status"}
    >
      <span className={styles.icon}>
        {isError ? (
          <IoWarningOutline size={20} />
        ) : (
          <IoCheckmarkCircleOutline size={20} />
        )}
      </span>

      <p className={styles.message}>{message}</p>

      {onDismiss && (
        <button
          onClick={onDismiss}
          className={styles.dismissButton}
          aria-label="Dismiss message"
        >
          <IoCloseOutline size={20} />
        </button>
      )}
    </div>
  );
};
