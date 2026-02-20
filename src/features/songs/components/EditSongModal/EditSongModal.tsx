import { useState, type JSX } from "react";
import { Modal } from "@/shared/components/Modal/Modal";
import { SongDetailsForm } from "../SongDetailsForm/SongDetailsForm";
import { useCloudinaryUpload } from "@/shared/hooks/useCloudinaryUpload";
import { type Song } from "../../types";
import { updateSong } from "../../api";

interface EditSongModalProps {
  song: Song | null;
  isOpen: boolean;
  onClose: () => void;
  onSongUpdated: () => void;
}

export const EditSongModal = ({
  song,
  isOpen,
  onClose,
  onSongUpdated,
}: EditSongModalProps): JSX.Element | null => {
  const { upload, isUploading, error } = useCloudinaryUpload();

  const [coverArtUrl, setCoverArtUrl] = useState<string>(
    song?.cover_art_url || "",
  );

  if (!song) return null;

  const handleCoverArtUpload = async (file: File) => {
    try {
      const cloudData = await upload(file);
      setCoverArtUrl(cloudData.secure_url);
    } catch (err) {
      console.error("Cover art upload failed:", err);
    }
  };

  const handleSubmit = async ({
    title,
    artist,
  }: {
    title: string;
    artist: string;
    coverArtUrl: string;
  }) => {
    try {
      await updateSong(song.id, {
        title,
        artist,
        file_url: song.file_url, // Keep existing file URL
        duration: song.duration, // Keep existing duration
        cover_art_url: coverArtUrl,
      });
      onSongUpdated();
      onClose();
    } catch (err) {
      console.error("Failed to update song:", err);
      alert("Failed to update song. Check console.");
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Song">
      <SongDetailsForm
        initialValues={{
          title: song.title,
          artist: song.artist,
          cover_art_url: coverArtUrl,
        }}
        onSubmit={handleSubmit}
        isSubmitting={isUploading}
        error={error as string}
        showMp3Upload={false}
        coverArtUploading={isUploading}
        onCoverArtUpload={handleCoverArtUpload}
      />
    </Modal>
  );
};
