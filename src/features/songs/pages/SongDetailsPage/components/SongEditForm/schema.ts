import { z } from "zod";

export const songEditSchema = z.object({
  title: z.string().min(1, "Title is required"),
  artist: z.string().min(1, "Artist is required"),
  album: z.string().optional(),
  release_year: z
    .preprocess(
      (val) => (val === "" || val == null ? undefined : Number(val)),
      z
        .number()
        .int("Release year must be an integer")
        .min(1200, "Release year must be 1200 or later")
        .max(new Date().getFullYear(), "Release year cannot be in the future"),
    )
    .optional(),
  cover_art_url: z.string().optional(),
});

export type SongEditFormValues = z.infer<typeof songEditSchema>;
