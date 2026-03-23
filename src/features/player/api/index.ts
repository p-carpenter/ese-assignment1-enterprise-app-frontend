import { request } from "@/shared/api/client";
import { type PagedPlayHistory } from "../types";

/**
 * Number of history entries per page for play history requests.
 */
export const HISTORY_PAGE_SIZE = 5;

/**
 * Fetch the full play history for a single song.
 * @param songId Song identifier.
 * @returns Paginated play history for the song.
 */
export const getSongHistory = async (
  songId: number,
): Promise<PagedPlayHistory> =>
  await request<PagedPlayHistory>(`/history/?song=${songId}&page_size=1000`);

/**
 * Fetch paginated play history.
 * @param page Page number (1-based).
 * @param pageSize Number of items per page.
 * @returns A page of play history entries.
 */
export const getPlayHistory = async (
  page = 1,
  pageSize = HISTORY_PAGE_SIZE,
): Promise<PagedPlayHistory> =>
  await request<PagedPlayHistory>(
    `/history/?page=${page}&page_size=${pageSize}`,
  );

/**
 * Record a play for the given song id. Errors are caught and logged.
 * @param songId The id of the song that was played.
 */
export const logPlay = async (songId: number) => {
  try {
    await request("/history/", {
      method: "POST",
      body: JSON.stringify({ song_id: songId }),
    });
  } catch (err) {
    console.error("Audit log failed:", err);
  }
};
