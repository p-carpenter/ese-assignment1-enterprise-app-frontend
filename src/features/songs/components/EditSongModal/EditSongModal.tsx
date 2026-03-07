import { useState, type JSX } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
  const queryClient = useQueryClient();
  const { upload, isUploading, error: uploadError } = useCloudinaryUpload();

  const [coverArtUrl, setCoverArtUrl] = useState<string>(
    song?.cover_art_url || "",
  );

  const updateMutation = useMutation({
    mutationFn: ({
      title,
      artist,
      url,
    }: {
      title: string;
      artist: string;
      url: string;
    }) =>
      updateSong(song!.id, {
        title,
        artist,
        file_url: song!.file_url,
        duration: song!.duration,
        cover_art_url: url,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["songs"] });
      void queryClient.invalidateQueries({ queryKey: ["playlist"] });
      onSongUpdated();
      onClose();
    },
  });

  if (!song) return null;

  const handleCoverArtUpload = async (file: File) => {
    try {
      const cloudData = await upload(file);
      if (cloudData) {
        setCoverArtUrl(cloudData.secure_url);
      }
    } catch (err) {
      console.error("Cover art upload failed:", err);
    }
  };

  const handleSubmit = ({
    title,
    artist,
  }: {
    title: string;
    artist: string;
  }) => {
    updateMutation.mutate({ title, artist, url: coverArtUrl });
  };

  const submitError = updateMutation.isError
    ? "Failed to update song. Please try again."
    : (uploadError as string | null);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Song">
      <SongDetailsForm
        key={song.id}
        initialValues={{
          title: song.title,
          artist: song.artist,
        }}
        onSubmit={handleSubmit}
        isSubmitting={updateMutation.isPending || isUploading}
        error={submitError}
        showMp3Upload={false}
        coverArtUploading={isUploading}
        onCoverArtUpload={handleCoverArtUpload}
      />
    </Modal>
  );
};
