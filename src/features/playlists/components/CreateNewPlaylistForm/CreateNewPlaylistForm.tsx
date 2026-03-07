import { useState } from "react";
import styles from "@/features/songs/components/SongUploadForm/SongUploadForm.module.css";
import { useCloudinaryUpload } from "@/shared/hooks/useCloudinaryUpload";

interface CreateNewPlaylistFormProps {
  onSubmit: (values: {
    title: string;
    description: string;
    is_public: boolean;
    cover_art_url: string;
    is_collaborative: boolean;
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
  const [isCollaborative, setIsCollaborative] = useState(false);
  const [coverArtUrl, setCoverArtUrl] = useState<string>("");

  const {
    upload: uploadCover,
    // isUploading: isCoverUploading,
    error: coverError,
  } = useCloudinaryUpload();

  const handleSubmit = (e: React.ChangeEvent<HTMLFormElement>) => {
    e.preventDefault();
    onSubmit({
      title: playlistName,
      description,
      cover_art_url: coverArtUrl,
      is_public: isPublic,
      is_collaborative: isCollaborative,
    });
  };

  const handleCoverArtUpload = async (file: File | null) => {
    if (!file) return;
    try {
      const cloudData = await uploadCover(file);
      if (cloudData) {
        setCoverArtUrl(cloudData.secure_url);
      }
    } catch (err) {
      console.error("Cover art upload failed:", err);
    }
  };

  return (
    <form className={styles.container} onSubmit={handleSubmit}>
      <h3 className={styles.title}>Playlist Details</h3>
      <div className={styles.errorContainer}>
        {error && <div className={styles.error}>{error}</div>}
        {coverError && (
          <div className={styles.error}>
            {coverError && <div>Cover Art Error: {coverError}</div>}
          </div>
        )}
      </div>
      <input
        aria-label="Upload Cover Art"
        type="file"
        accept="image/*"
        className={styles.fileInput}
        onChange={(e) => handleCoverArtUpload(e.target.files?.[0] || null)}
      />

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

      <div className={styles.checkboxContainer}>
        <input
          type="checkbox"
          id="is_collaborative"
          checked={isCollaborative}
          onChange={(e) => setIsCollaborative(e.target.checked)}
          className={styles.checkbox}
        />
        <label htmlFor="is_collaborative" className={styles.checkboxLabel}>
          Collaborative
        </label>
      </div>

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
