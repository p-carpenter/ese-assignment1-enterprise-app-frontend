import { z } from "zod";

export const playlistSchema = z
  .object({
    title: z.string().min(1, "Playlist name is required"),
    description: z.string().optional(),
    is_public: z.boolean(),
    is_collaborative: z.boolean(),
    cover_art_url: z.string().optional(),
  })
  .refine((data) => !(data.is_collaborative && !data.is_public), {
    message: "Private playlists cannot be collaborative",
    path: ["is_collaborative"],
  });

export type PlaylistFormValues = z.infer<typeof playlistSchema>;
