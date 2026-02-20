import { request } from "@/shared/api/client";

export const getPlayHistory = () => request("/history/");

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