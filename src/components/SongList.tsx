import { useEffect, useState } from 'react';
import { type Song } from '../types';

// Props: pass the refresh trigger so it reloads when upload happens
export const SongList = ({ keyTrigger }: { keyTrigger: number }) => {
    const [songs, setSongs] = useState<Song[]>([]);

    useEffect(() => {
        fetch('http://127.0.0.1:5432/api/songs/')
            .then(res => res.json())
            .then(data => setSongs(data))
            .catch(err => console.error(err));
    }, [keyTrigger]); // Re-fetch when this number changes

    return (
        <div>
            <h3>Library</h3>
            <div style={{ display: 'grid', gap: '10px' }}>
                {songs.map(song => (
                    <div key={song.id} style={{ padding: '10px', background: '#f0f0f0', borderRadius: '4px' }}>
                        <strong>{song.title}</strong> by {song.artist}
                        <br />
                        <small>Duration: {song.duration}s</small>
                    </div>
                ))}
            </div>
        </div>
    );
};