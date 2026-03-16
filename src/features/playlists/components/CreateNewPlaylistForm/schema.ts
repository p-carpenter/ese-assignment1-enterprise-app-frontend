import { z } from "zod";

export const playlistSchema = z.object({
  title: z.string().min(1, "Playlist name is required"),
  description: z.string().optional(),
  is_public: z.boolean(),
  is_collaborative: z.boolean(),
});

export type PlaylistFormValues = z.infer<typeof playlistSchema>;
