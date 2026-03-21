import { useState, useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { type Song } from "@/features/songs/types";
import { usePlayer } from "@/shared/context/PlayerContext";
import { deleteSong } from "../../api";
import { addSongToPlaylist } from "@/features/playlists/api";
import { EditSongModal } from "../EditSongModal/EditSongModal";
import { AddToPlaylistModal } from "@/features/playlists/components/AddToPlaylistModal/AddToPlaylistModal";
import { SongRow } from "../SongRow/SongRow";
import styles from "./SongList.module.css";
import { type DropdownItem } from "../SongManagementDropdown/SongManagementDropdown";
import { IoTimeOutline } from "react-icons/io5";
import { ApiError } from "@/shared/api/errors";
import { AlertMessage } from "@/shared/components/AlertMessage/AlertMessage";
import { queryKeys } from "@/shared/lib/queryKeys";

interface SongListProps {
  songs: Song[];
  getDropdownItems?: (song: Song) => DropdownItem[];
  getAvatarUser?: (
    song: Song,
  ) => import("@/features/auth/types").UserMini | undefined;
  isPlaylist?: boolean;
  onScroll?: (e: React.UIEvent<HTMLDivElement>) => void;
  loadMoreRef?: React.Ref<HTMLDivElement>;
  isFetchingNextPage?: boolean;
}

export const SongList = ({
  songs,
  getDropdownItems,
  getAvatarUser,
  onScroll,
  loadMoreRef,
  isFetchingNextPage,
}: SongListProps) => {
  const { currentSong, playSong } = usePlayer();
  const queryClient = useQueryClient();

  const [editSong, setEditSong] = useState<Song | null>(null);
  const [songToAddToPlaylist, setSongToAddToPlaylist] = useState<Song | null>(
    null,
  );

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteSong(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.allSongs });
      void queryClient.invalidateQueries({ queryKey: queryKeys.playlists });
    },
  });

  const addToPlaylistMutation = useMutation({
    mutationFn: ({
      playlistId,
      songId,
    }: {
      playlistId: number;
      songId: number;
    }) => addSongToPlaylist(playlistId, songId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.playlists });
      setSongToAddToPlaylist(null);
    },
  });

  const handlePlay = useCallback(
    (song: Song) => {
      void playSong(song, songs);
    },
    [playSong, songs],
  );

  const generateDropdownItems = useCallback(
    (song: Song): DropdownItem[] => [
      { label: "Edit", onSelect: () => setEditSong(song) },
      {
        label: "Delete",
        onSelect: () => deleteMutation.mutate(song.id),
        disabled: deleteMutation.isPending,
      },
      {
        label: "Add to Playlist",
        onSelect: () => setSongToAddToPlaylist(song),
      },
    ],
    [deleteMutation],
  );

  const activeError = deleteMutation.error || addToPlaylistMutation.error;

  const errorMessage =
    activeError instanceof ApiError
      ? activeError.getReadableMessage()
      : activeError?.message;

  const dismissError = () => {
    if (deleteMutation.error) deleteMutation.reset();
    if (addToPlaylistMutation.error) addToPlaylistMutation.reset();
  };

  if (!songs?.length) {
    return <p>No songs found.</p>;
  }

  return (
    <>
      {errorMessage && (
        <AlertMessage
          message={errorMessage}
          variant="error"
          onDismiss={dismissError}
        />
      )}

      <div className={styles.columnHeaders}>
        <span className={styles.headerSong}>Title</span>
        <span className={styles.headerDateAdded}>Date Added</span>
        <span className={styles.headerDuration}>
          <IoTimeOutline size={18} />
        </span>
        <div className={styles.headerDropdownSpacer} />
      </div>

      <div className={styles.scrollContainer} onScroll={onScroll}>
        <ul className={styles.list}>
          {songs.map((song) => (
            <SongRow
              key={song.id}
              song={song}
              isActive={currentSong?.id === song.id}
              onPlay={handlePlay}
              dropdownItems={
                getDropdownItems
                  ? getDropdownItems(song)
                  : generateDropdownItems(song)
              }
              avatarUser={
                getAvatarUser ? getAvatarUser(song) : song.uploaded_by
              }
            />
          ))}
        </ul>

        {loadMoreRef && (
          <div ref={loadMoreRef} className="h-10">
            {isFetchingNextPage && <p>Loading more...</p>}
          </div>
        )}
      </div>

      {editSong && (
        <EditSongModal
          song={editSong}
          isOpen={true}
          onClose={() => setEditSong(null)}
          onSongUpdated={() => setEditSong(null)}
        />
      )}

      {songToAddToPlaylist && (
        <AddToPlaylistModal
          song={songToAddToPlaylist}
          isOpen={true}
          onClose={() => setSongToAddToPlaylist(null)}
          onSongAdded={(playlistId) => {
            addToPlaylistMutation.mutate({
              playlistId,
              songId: songToAddToPlaylist.id,
            });
          }}
        />
      )}
    </>
  );
};
