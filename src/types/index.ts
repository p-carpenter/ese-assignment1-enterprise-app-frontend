export interface Song {
    id: number;
    title: string;
    artist: string;
    album?: string;
    file_url: string;      // The MP3 URL from Cloudinary
    cover_art_url?: string;
    duration: number;      // In seconds
}

export interface SongUploadPayload {
    title: string;
    artist: string;
    file_url: string;
    cover_art_url?: string;
    duration: number;
}

export interface Playlist {
    id: number;
    title: string;
    description: string;
    is_public: boolean;
    owner: string;
    songs: Array<Song>
}

export interface UserProfile {
    id: number;
    username: string;
    email: string;
    avatar_url?: string;
}
