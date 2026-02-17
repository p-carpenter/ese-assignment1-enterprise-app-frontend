// src/services/api.ts
import { type Song, type SongUploadPayload } from '../types/index.ts';

const API_URL = 'http://127.0.0.1:8000/api';

export const api = {
    // Fetch all songs for the library
    getSongs: async (): Promise<Song[]> => {
        const response = await fetch(`${API_URL}/songs/`);
        if (!response.ok) throw new Error('Failed to fetch songs');
        return response.json();
    },

    // Save a new song to the database
    createSong: async (payload: SongUploadPayload): Promise<Song> => {
        const response = await fetch(`${API_URL}/songs/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(JSON.stringify(error));
        }
        return response.json();
    },

    // Log a play event for audit purposes
    logPlay: async (songId: number) => {
        fetch(`${API_URL}/history/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ song: songId })
        }).catch(err => console.error("Audit log failed:", err));
    }
};