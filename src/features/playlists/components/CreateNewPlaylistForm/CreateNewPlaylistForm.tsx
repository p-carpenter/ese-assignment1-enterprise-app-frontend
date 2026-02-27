import { useState } from "react";
import styles from "@/features/songs/components/SongUploadForm/SongUploadForm.module.css";

interface CreateNewPlaylistFormProps {
  onSubmit: (values: {
    title: string;
    description: string;
    is_public: boolean;
  }) => void;
  isSubmitting?: boolean;
  error?: string | null;
}

export const CreateNewPlaylistForm = ({
  onSubmit,
  isSubmitting = false,
  error,
}: CreateNewPlaylistFormProps) => {
  const [playlistName, setPlaylistName] = useState("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(true);

  const handleSubmit = (e: React.ChangeEvent<HTMLFormElement>) => {
    e.preventDefault();
    onSubmit({ title: playlistName, description, is_public: isPublic });
  };

  return (
    <form className={styles.container} onSubmit={handleSubmit}>
      <h3 className={styles.title}>Playlist Details</h3>

      <input
        aria-label="Title"
        placeholder="Playlist Name"
        value={playlistName}
        onChange={(e) => setPlaylistName(e.target.value)}
        className={styles.inputField}
      />

      <input
        aria-label="Description"
        placeholder="Playlist Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className={styles.inputField}
      />

      <div className={styles.checkboxContainer}>
        <input
          type="checkbox"
          id="is_public"
          checked={isPublic}
          onChange={(e) => setIsPublic(e.target.checked)}
          className={styles.checkbox}
        />
        <label htmlFor="is_public" className={styles.checkboxLabel}>
          Public
        </label>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      <button
        type="submit"
        disabled={isSubmitting}
        className={styles.submitButton}
      >
        {isSubmitting ? "Creating..." : "Create Playlist"}
      </button>
    </form>
  );
};
