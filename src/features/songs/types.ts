export interface Song {
  id: number;
  title: string;
  artist: string;
  album?: string;
  genre?: string;
  release_year?: string;
  file_url: string; // The MP3 URL from Cloudinary
  cover_art_url?: string;
  duration: number; // In seconds
}

export interface SongUploadPayload {
  title: string;
  artist: string;
  album?: string;
  genre?: string;
  release_year?: string;
  file_url: string;
  cover_art_url?: string;
  duration: number;
}
