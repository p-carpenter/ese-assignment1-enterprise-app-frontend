import { parseBlob } from "music-metadata";

export interface Id3Tags {
  title?: string;
  artist?: string;
  album?: string;
  year?: number;
}

/**
 * Reads ID3 metadata tags from an MP3 File object.
 * Returns whatever tags are present; missing tags are undefined.
 * Never throws — returns an empty object on any failure.
 */
export const readId3Tags = async (file: File): Promise<Id3Tags> => {
  try {
    const metadata = await parseBlob(file, {
      duration: false,
      skipCovers: true,
    });
    const { title, artist, album, year } = metadata.common;
    return {
      title: title || undefined,
      artist: artist || undefined,
      album: album || undefined,
      year: year || undefined,
    };
  } catch {
    return {};
  }
};
