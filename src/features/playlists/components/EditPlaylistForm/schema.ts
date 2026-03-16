import { z } from "zod";

export const editPlaylistSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  is_public: z.boolean(),
  is_collaborative: z.boolean(),
});

export type EditPlaylistFormValues = z.infer<typeof editPlaylistSchema>;