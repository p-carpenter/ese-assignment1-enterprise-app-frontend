import { useCallback, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/shared/context/AuthContext";
import {
  deletePlaylist,
  getPlaylistDetails,
  removeSongFromPlaylist,
  updatePlaylist,
} from "@/features/playlists/api";
import { useCloudinaryUpload } from "@/shared/hooks/useCloudinaryUpload";
import { AlertMessage } from "@/shared/components";
import styles from "./PlaylistDetail.module.css";
import { SongList } from "@/features/songs/components/SongList/SongList";
import { type DropdownItem } from "@/features/songs/components/SongManagementDropdown/SongManagementDropdown";
import { type Song } from "@/features/songs/types";
import { queryKeys } from "@/shared/lib/queryKeys";
import { AddSongToPlaylistModal } from "../AddSongToPlaylistModal/AddSongToPlaylistModal";
import {
  IoPencilOutline,
  IoCheckmarkOutline,
  IoCloseOutline,
  IoTrashOutline,
  IoImageOutline,
  IoAddOutline,
} from "react-icons/io5";

export const PlaylistDetail = () => {
  const { playlistId } = useParams<{ playlistId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const parsedId = parseInt(playlistId ?? "0", 10);

  const {
    data: playlist,
    isLoading,
    isError,
  } = useQuery({
    queryKey: queryKeys.playlist(parsedId),
    queryFn: () => getPlaylistDetails(parsedId),
    enabled: !!parsedId,
  });

  // ── Inline editing ────────────────────────────────────────────────────────
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editIsPublic, setEditIsPublic] = useState(false);
  const [editCoverUrl, setEditCoverUrl] = useState("");
  const [editIsCollaborative, setEditIsCollaborative] = useState(false);

  const coverInputRef = useRef<HTMLInputElement>(null);

  const { upload: uploadCover, isUploading: isCoverUploading } =
    useCloudinaryUpload();

  const startEdit = () => {
    if (!playlist) return;
    setEditTitle(playlist.title);
    setEditDescription(playlist.description ?? "");
    setEditIsPublic(playlist.is_public);
    setEditCoverUrl(playlist.cover_art_url ?? "");
    setIsEditing(true);
  };

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

      return updatePlaylist(parsedId, payload);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.playlist(parsedId),
      });
      void queryClient.invalidateQueries({ queryKey: queryKeys.playlists });
      setIsEditing(false);
    },
  });

  // ── Add song modal ────────────────────────────────────────────────────────
  const [isAddSongOpen, setIsAddSongOpen] = useState(false);

  // ── Delete ────────────────────────────────────────────────────────────────
  const [confirmDelete, setConfirmDelete] = useState(false);

  const deleteMutation = useMutation({
    mutationFn: () => deletePlaylist(parsedId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.playlists });
      navigate("/");
    },
  });

  // ── Remove song ───────────────────────────────────────────────────────────
  const removeSongMutation = useMutation({
    mutationFn: (songId: number) => removeSongFromPlaylist(parsedId, songId),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.playlist(parsedId),
      });
    },
  });

  const getPlaylistSongDropdownItems = useCallback(
    (song: Song): DropdownItem[] => [
      {
        label: "Remove from Playlist",
        onSelect: () => removeSongMutation.mutate(song.id),
      },
    ],
    [removeSongMutation],
  );

  if (isLoading)
    return <div className={styles.statusPage}>Loading playlist…</div>;
  if (isError)
    return (
      <div className={styles.statusPage}>
        <AlertMessage message="Playlist not found or you don't have permission to view it." />
      </div>
    );
  if (!playlist)
    return <div className={styles.statusPage}>Playlist not found.</div>;

  const isOwner = user?.id === playlist.owner.id;
  const canAddSongs = isOwner || playlist.is_collaborative;
  const songs = playlist.songs.map((item) => item.song);
  const existingSongIds = new Set(songs.map((s) => s.id));
  const addedByMap = new Map(
    playlist.songs.map((item) => [item.song.id, item.added_by]),
  );

  // Unique contributors (users who added at least one song, including the owner)
  const contributors = playlist.is_collaborative
    ? Array.from(
        new Map(
          [...addedByMap.values()]
            .filter((u): u is NonNullable<typeof u> => !!u)
            .map((u) => [u.id, u]),
        ).values(),
      )
    : [];

  const coverUrl =
    (isEditing ? editCoverUrl : playlist.cover_art_url) ||
    "https://placehold.co/220";

  return (
    <div className={styles.page}>
      <div className={styles.content}>
        {/* ── Hero ──────────────────────────────────────────────────────── */}
        <div className={styles.hero}>
          {/* Cover art */}
          <div className={styles.coverWrap}>
            <img
              src={coverUrl}
              alt={playlist.title}
              className={styles.coverArt}
            />
            {isEditing && (
              <>
                <button
                  className={styles.coverEditBtn}
                  onClick={() => coverInputRef.current?.click()}
                  disabled={isCoverUploading}
                  aria-label="Change cover art"
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
              </>
            )}
          </div>

          <div className={styles.heroInfo}>
            {isOwner && isEditing ? (
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
                    aria-label="Toggle visibility"
                  >
                    <span className={styles.toggleThumb} />
                  </button>
                  <span>Collaborative</span>
                  <button
                    type="button"
                    className={`${styles.toggle} ${editIsCollaborative ? styles.toggleOn : ""}`}
                    onClick={() => setEditIsCollaborative((v) => !v)}
                    aria-label="Toggle collaborative"
                  >
                    <span className={styles.toggleThumb} />
                  </button>
                </label>
                <div className={styles.editActions}>
                  <button
                    className={styles.iconBtn}
                    onClick={() => saveEdit()}
                    disabled={isSaving || isCoverUploading}
                    aria-label="Save"
                  >
                    <IoCheckmarkOutline size={18} />
                    {isSaving ? "Saving…" : "Save"}
                  </button>
                  <button
                    className={styles.iconBtn}
                    onClick={() => setIsEditing(false)}
                    aria-label="Cancel"
                  >
                    <IoCloseOutline size={18} />
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <p className={styles.heroLabel}>Playlist</p>
                <div className={styles.titleRow}>
                  <h1 className={styles.heroTitle}>{playlist.title}</h1>
                  <span
                    className={`${styles.badge} ${playlist.is_public ? styles.badgePublic : styles.badgePrivate}`}
                  >
                    {playlist.is_public ? "Public" : "Private"}
                  </span>

                  {playlist.is_collaborative && (
                    <span
                      className={`${styles.badge} ${styles.badgeCollaborative}`}
                    >
                      Collaborative
                    </span>
                  )}
                </div>
                {playlist.description && (
                  <p className={styles.heroDescription}>
                    {playlist.description}
                  </p>
                )}
                <div className={styles.heroMeta}>
                  <span className={styles.heroMetaOwner}>
                    {playlist.owner.avatar_url ? (
                      <img
                        src={playlist.owner.avatar_url}
                        alt={playlist.owner.username}
                        className={styles.ownerAvatar}
                      />
                    ) : (
                      <span className={styles.ownerAvatarFallback}>
                        {playlist.owner.username[0].toUpperCase()}
                      </span>
                    )}
                    <span>{playlist.owner.username}</span>
                  </span>
                  <span className={styles.heroMetaDot}>·</span>
                  {songs.length} {songs.length === 1 ? "song" : "songs"}
                  {contributors.length > 0 && (
                    <>
                      <span className={styles.heroMetaDot}>·</span>
                      <div className={styles.contributorAvatars}>
                        {contributors.slice(0, 5).map((u) => (
                          <span
                            key={u.id}
                            className={styles.contributorAvatar}
                            title={u.username}
                          >
                            {u.avatar_url ? (
                              <img src={u.avatar_url} alt={u.username} />
                            ) : (
                              u.username[0].toUpperCase()
                            )}
                          </span>
                        ))}
                        {contributors.length > 5 && (
                          <span
                            className={styles.contributorAvatar}
                            title={`${contributors.length - 5} more`}
                          >
                            +{contributors.length - 5}
                          </span>
                        )}
                      </div>
                      <span className={styles.contributorsLabel}>
                        Contributors
                      </span>
                    </>
                  )}
                </div>
                <div className={styles.heroActions}>
                  {canAddSongs && (
                    <button
                      className={styles.editBtn}
                      onClick={() => setIsAddSongOpen(true)}
                      aria-label="Add songs"
                    >
                      <IoAddOutline size={14} /> Add songs
                    </button>
                  )}
                  {isOwner && (
                    <button
                      className={styles.editBtn}
                      onClick={startEdit}
                      aria-label="Edit playlist"
                    >
                      <IoPencilOutline size={14} /> Edit
                    </button>
                  )}
                  {isOwner &&
                    (confirmDelete ? (
                      <>
                        <span className={styles.confirmText}>
                          Are you sure?
                        </span>
                        <button
                          className={`${styles.iconBtn} ${styles.deleteBtn}`}
                          onClick={() => deleteMutation.mutate()}
                          disabled={deleteMutation.isPending}
                        >
                          {deleteMutation.isPending
                            ? "Deleting…"
                            : "Yes, delete"}
                        </button>
                        <button
                          className={styles.iconBtn}
                          onClick={() => setConfirmDelete(false)}
                        >
                          <IoCloseOutline size={16} /> Cancel
                        </button>
                      </>
                    ) : (
                      <button
                        className={`${styles.iconBtn} ${styles.deleteBtn}`}
                        onClick={() => setConfirmDelete(true)}
                        aria-label="Delete playlist"
                      >
                        <IoTrashOutline size={16} /> Delete
                      </button>
                    ))}
                </div>
              </>
            )}
          </div>
        </div>

        <AddSongToPlaylistModal
          playlistId={parsedId}
          existingSongIds={existingSongIds}
          isOpen={isAddSongOpen}
          onClose={() => setIsAddSongOpen(false)}
        />

        {/* ── Song list ─────────────────────────────────────────────────── */}
        <section className={styles.songSection}>
          <h2 className={styles.sectionTitle}>Songs</h2>
          {songs.length === 0 ? (
            <p className={styles.dim}>No songs in this playlist yet.</p>
          ) : (
            <SongList
              songs={songs}
              getDropdownItems={getPlaylistSongDropdownItems}
              getAvatarUser={(song) => addedByMap.get(song.id)}
            />
          )}
        </section>
      </div>
    </div>
  );
};
