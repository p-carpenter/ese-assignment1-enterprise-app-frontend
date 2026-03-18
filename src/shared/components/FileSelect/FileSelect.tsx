import type { JSX } from "react";
import { FileTrigger } from "react-aria-components";
import { Button } from "@/shared/components/Button/Button";
import styles from "./FileSelect.module.css";

interface FileSelectProps {
  onFileSelect: (file: File) => void;
  accept: string; // e.g., "audio/*" or "image/*"
  label?: string;
}

export const FileSelect = ({
  onFileSelect,
  accept,
  label = "Choose File",
}: FileSelectProps): JSX.Element => {
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
