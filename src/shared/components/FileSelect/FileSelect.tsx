import type { JSX } from "react";
import styles from "./FileSelect.module.css";

interface FileSelectProps {
  onFileSelect: (file: File) => void;
  accept: string; // "audio/*" or "image/*"
  label?: string;
}

export const FileSelect = ({
  onFileSelect,
  accept,
  label = "Choose File",
}: FileSelectProps): JSX.Element => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    if (e.target.files?.[0]) {
      onFileSelect(e.target.files[0]);
    }
  };

  return (
    <div className={styles.wrapper}>
      <label className={styles.label}>
        {label}
        <input
          type="file"
          accept={accept}
          className={styles.input}
          onChange={handleChange}
        />
      </label>
    </div>
  );
};
