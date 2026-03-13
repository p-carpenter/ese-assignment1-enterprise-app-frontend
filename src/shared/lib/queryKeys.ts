/**
 * Centralised React Query key factory.
 * Using typed tuples keeps keys consistent and makes `invalidateQueries` precise.
 */

export const queryKeys = {
  /** Current authenticated user */
  me: ["me"] as const,

  /** Paginated / filtered song list (used by useInfiniteQuery in SongLibrary) */
  allSongs: ["songs"] as const,

  songs: (params: { ordering: string; search: string }) =>
    [...queryKeys.allSongs, params] as const,

  /** All playlists for the current user */
  playlists: ["playlists"] as const,

  /** A single playlist by ID */
  playlist: (id: number) => ["playlist", id] as const,

  /** Play-history page */
  playHistory: (page: number) => ["playHistory", page] as const,

  /** A single song by ID */
  song: (id: number) => ["song", id] as const,

  /** Play history for a single song */
  songHistory: (id: number) => ["songHistory", id] as const,

  /** All songs by a given artist */
  artistSongs: (artist: string) => ["artistSongs", artist] as const,
};
