import { request } from "@/shared/api/client";
import { type PagedPlayHistory } from "../types";

const HISTORY_PAGE_SIZE = 10;

export const getPlayHistory = async (
  page = 1,
  pageSize = HISTORY_PAGE_SIZE,
): Promise<PagedPlayHistory> =>
  await request<PagedPlayHistory>(
    `/history/?page=${page}&page_size=${pageSize}`,
  );

export const logPlay = async (songId: number) => {
  try {
    await request("/history/", {
      method: "POST",
      body: JSON.stringify({ song: songId }),
    });
  } catch (err) {
    console.error("Audit log failed:", err);
  }
};
