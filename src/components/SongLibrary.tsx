import { type JSX } from 'react';
import { type Song } from '../types';
import styles from './MusicPlayer.module.css';

interface SongLibraryProps {
    songs: Song[];
    currentSongId?: number;
    onSongClick: (song: Song) => void;
}

export const SongLibrary = ({ songs, currentSongId, onSongClick }: SongLibraryProps): JSX.Element => {
    return (
        <div className={styles.songList}>
            <h3 className={styles.libraryTitle}>Library ({songs.length} tracks)</h3>
            <ul className={styles.list}>
                {songs.map((song) => (
                    <li 
                        key={song.id} 
                        onClick={() => onSongClick(song)}
                        className={currentSongId === song.id ? styles.songItemActive : styles.songItem}
                    >
                        <div className={styles.songMeta}>
                            <strong className={styles.songTitle}>{song.title}</strong>
                            <br/>
                            <span className={styles.songArtist}>{song.artist}</span>
                        </div>
                        <span className={styles.duration}>{formatTime(song.duration)}</span>
                    </li>
                ))}
            </ul>
        </div>
    );
};

const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
};
