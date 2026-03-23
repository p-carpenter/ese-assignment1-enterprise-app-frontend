import type { JSX } from "react";
import { FileTrigger } from "react-aria-components";
import { Button } from "@/shared/components/Button/Button";
import styles from "./FileSelect.module.css";

/**
 * Props for `FileSelect` component.
 */
interface FileSelectProps {
  onFileSelect: (file: File) => void;
  accept: string; // e.g., "audio/*" or "image/*"
  label?: string;
}

/**
 * Small file picker wrapper that forwards the chosen File to a callback.
 * @param onFileSelect Callback invoked with the selected file.
 * @param accept Accepted mime types string (e.g. "audio/*").
 * @param label Optional button label text.
 * @returns A FileSelect control element.
 */
export const FileSelect = ({
  onFileSelect,
  accept,
  label = "Choose File",
}: FileSelectProps): JSX.Element => {
  /**
   * Internal file select handler called by the react-aria FileTrigger.
   * Picks the first selected file and forwards it to the caller.
   * @param e The selected FileList or null.
   */
  const handleSelect = (e: FileList | null) => {
    if (e && e.length > 0) {
      onFileSelect(e[0]);
    }
  };

  return (
    <div className={styles.wrapper}>
      <FileTrigger acceptedFileTypes={[accept]} onSelect={handleSelect}>
        <Button variant="outlined">{label}</Button>
      </FileTrigger>
    </div>
  );
};
