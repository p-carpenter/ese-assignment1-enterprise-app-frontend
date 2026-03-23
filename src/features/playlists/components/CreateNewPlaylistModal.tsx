import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Modal } from "@/shared/components/Modal/Modal";
import { createPlaylist } from "../api";
import { CreateNewPlaylistForm } from "./CreateNewPlaylistForm/CreateNewPlaylistForm";
import { queryKeys } from "@/shared/lib/queryKeys";
import { type Playlist } from "../types";
import { ApiError } from "@/shared/api/errors";

interface CreateNewPlaylistModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (playlist: Playlist) => void;
}

export const CreateNewPlaylistModal = ({
  isOpen,
  onClose,
  onSuccess,
}: CreateNewPlaylistModalProps) => {
  /**
   * Modal to create a new playlist. Handles the create mutation and navigation.
   * @param isOpen Whether the modal is visible.
   * @param onClose Close callback.
   * @param onSuccess Optional success callback with the created playlist.
   * @returns Modal element or null.
   */
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [formError, setFormError] = useState<string | null>(null);

  const createMutation = useMutation({
    mutationFn: (values: {
      title: string;
      description?: string;
      cover_art_url: string;
      is_collaborative: boolean;
      is_public: boolean;
    }) => createPlaylist(values),
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.playlists });
      onClose();
      if (onSuccess) {
        onSuccess(data);
      } else {
        navigate(`/playlists/${data.id}`);
      }
    },
    onError: (err) => {
      if (err instanceof ApiError) {
        setFormError(err.getReadableMessage());
      } else {
        setFormError("Failed to create playlist. Please try again.");
      }
    },
  });

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create a New Playlist">
      <CreateNewPlaylistForm
        onSubmit={(values) => {
          setFormError(null);
          createMutation.mutate({
            ...values,
            cover_art_url: values.cover_art_url ?? "",
          });
        }}
        isSubmitting={createMutation.isPending}
        error={formError}
      />
    </Modal>
  );
};
