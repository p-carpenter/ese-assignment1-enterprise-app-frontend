import { request } from "@/shared/api/client";
import { type PlayHistoryEntry } from "../types";

export const getPlayHistory = async (): Promise<PlayHistoryEntry[]> =>
  await request<PlayHistoryEntry[]>("/history/");

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
