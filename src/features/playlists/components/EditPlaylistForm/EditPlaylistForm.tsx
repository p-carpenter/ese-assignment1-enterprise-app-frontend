import { useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updatePlaylist } from "@/features/playlists/api";
import { useCloudinaryUpload } from "@/shared/hooks/useCloudinaryUpload";
import { queryKeys } from "@/shared/lib/queryKeys";
import {
  IoCheckmarkOutline,
  IoCloseOutline,
  IoImageOutline,
} from "react-icons/io5";
import styles from "./EditPlaylistForm.module.css"; // Eller lag en egen CSS-modul for skjemaet
import { type Playlist } from "@/features/playlists/types"; // Antatt type

interface EditPlaylistFormProps {
  playlist: Playlist;
  onClose: () => void;
}

export const EditPlaylistForm = ({
  playlist,
  onClose,
}: EditPlaylistFormProps) => {
  const queryClient = useQueryClient();
  const coverInputRef = useRef<HTMLInputElement>(null);

  const [editTitle, setEditTitle] = useState(playlist.title);
  const [editDescription, setEditDescription] = useState(
    playlist.description ?? "",
  );
  const [editIsPublic, setEditIsPublic] = useState(playlist.is_public);
  const [editCoverUrl, setEditCoverUrl] = useState(
    playlist.cover_art_url ?? "",
  );
  const [editIsCollaborative, setEditIsCollaborative] = useState(
    playlist.is_collaborative,
  );

  const { upload: uploadCover, isUploading: isCoverUploading } =
    useCloudinaryUpload();

  const handleCoverChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const res = await uploadCover(file);
    if (res) setEditCoverUrl(res.secure_url);
  };

  const { mutate: saveEdit, isPending: isSaving } = useMutation({
    mutationFn: () => {
      const payload = {
        title: editTitle,
        description: editDescription,
        is_public: editIsPublic,
        is_collaborative: editIsCollaborative,
        ...(editCoverUrl ? { cover_art_url: editCoverUrl } : {}),
      };
      return updatePlaylist(playlist.id, payload);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.playlist(playlist.id),
      });
      void queryClient.invalidateQueries({ queryKey: queryKeys.playlists });
      onClose();
    },
  });

  return (
    <>
      <div className={styles.coverWrap}>
        <img
          src={editCoverUrl || "https://placehold.co/220"}
          alt="Cover"
          className={styles.coverArt}
        />
        <button
          className={styles.coverEditBtn}
          onClick={() => coverInputRef.current?.click()}
          disabled={isCoverUploading}
        >
          <IoImageOutline size={18} />
          {isCoverUploading ? "Uploading…" : "Change cover"}
        </button>
        <input
          ref={coverInputRef}
          type="file"
          accept="image/*"
          style={{ display: "none" }}
          onChange={handleCoverChange}
        />
      </div>

      <div className={styles.editFields}>
        <input
          className={styles.editInput}
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          placeholder="Title"
        />
        <textarea
          className={styles.editTextarea}
          value={editDescription}
          onChange={(e) => setEditDescription(e.target.value)}
          placeholder="Description"
          rows={3}
        />

        <label className={styles.toggleRow}>
          <span>Public</span>
          <button
            type="button"
            className={`${styles.toggle} ${editIsPublic ? styles.toggleOn : ""}`}
            onClick={() => setEditIsPublic((v) => !v)}
          >
            <span className={styles.toggleThumb} />
          </button>
          <span>Collaborative</span>
          <button
            type="button"
            className={`${styles.toggle} ${editIsCollaborative ? styles.toggleOn : ""}`}
            onClick={() => setEditIsCollaborative((v) => !v)}
          >
            <span className={styles.toggleThumb} />
          </button>
        </label>

        <div className={styles.editActions}>
          <button
            className={styles.iconBtn}
            onClick={() => saveEdit()}
            disabled={isSaving || isCoverUploading}
          >
            <IoCheckmarkOutline size={18} />
            {isSaving ? "Saving…" : "Save"}
          </button>
          <button className={styles.iconBtn} onClick={onClose}>
            <IoCloseOutline size={18} />
            Cancel
          </button>
        </div>
      </div>
    </>
  );
};
