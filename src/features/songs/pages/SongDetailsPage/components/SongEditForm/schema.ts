import { z } from "zod";

export const songEditSchema = z.object({
  title: z.string().min(1, "Title is required"),
  artist: z.string().min(1, "Artist is required"),
  album: z.string().optional(),
  releaseYear: z
    .string()
    .regex(/^\d{4}$/, "Must be a 4-digit year")
    .or(z.literal(""))
    .optional(),
});

export type SongEditFormValues = z.infer<typeof songEditSchema>;
