import { useEffect, useMemo, useState } from 'react';
import { useAudioPlayer } from 'react-use-audio-player';
import { api } from '../services/api';
import { type Song } from '../types';
import styles from './MusicPlayer.module.css';

export const MusicPlayer = ({ keyTrigger }: { keyTrigger: number }) => {
    const { play, pause, stop, isPlaying, load, getPosition, seek, duration } = useAudioPlayer();
    const [songs, setSongs] = useState<Song[]>([]);
    const [currentSong, setCurrentSong] = useState<Song | null>(null);
    const [position, setPosition] = useState(0);

    // Fetch Songs on Load (or after upload)
    useEffect(() => {
        api.getSongs()
            .then(data => setSongs(data))
            .catch(err => console.error("Failed to load library", err));
    }, [keyTrigger]);

    const playSong = (song: Song) => {
        if (currentSong?.id === song.id) {
            if (isPlaying) {
                pause();
            } else {
                play();
            }
            return;
        }

        // New song selected
        stop(); // Stop previous
        setCurrentSong(song);
        setPosition(0);
        
        load(song.file_url, {
            autoplay: true,
            onend: () => console.log("Song finished!"),
            format: 'mp3',
            html5: true
        });

        // Play history (Audit log)
        api.logPlay(song.id);
    };

    const currentIndex = useMemo(() => {
        if (!currentSong) return -1;
        return songs.findIndex(song => song.id === currentSong.id);
    }, [songs, currentSong]);

    const handlePrev = () => {
        if (songs.length === 0) return;
        const prevIndex = currentIndex > 0 ? currentIndex - 1 : songs.length - 1;
        playSong(songs[prevIndex]);
    };

    const handleNext = () => {
        if (songs.length === 0) return;
        const nextIndex = currentIndex >= 0 && currentIndex < songs.length - 1 ? currentIndex + 1 : 0;
        playSong(songs[nextIndex]);
    };

    useEffect(() => {
        if (!currentSong) return;

        const id = window.setInterval(() => {
            setPosition(getPosition());
        }, 500);

        return () => window.clearInterval(id);
    }, [currentSong, getPosition]);

    const maxDuration = Math.max(duration || 0, currentSong?.duration || 0);
    const handleSeek = (value: number) => {
        seek(value);
        setPosition(value);
    };

    return (
        <div className={styles.container}>
            
            {/* The "Now Playing" Widget */}
            <div className={styles.playerControls}>
                {currentSong ? (
                    <>
                        <img 
                            src={currentSong.cover_art_url || "https://placehold.co/100"} 
                            alt="Album Art" 
                            className={styles.albumArt}
                        />
                        <h3 className={styles.title}>{currentSong.title}</h3>
                        <p className={styles.artist}>{currentSong.artist}</p>
                        
                        <div className={styles.buttons}>
                            <button 
                                onClick={handlePrev}
                                className={styles.secondaryButton}
                                disabled={songs.length === 0}
                            >
                                ⏮ PREV
                            </button>
                            <button 
                                onClick={() => isPlaying ? pause() : play()}
                                className={styles.primaryButton}
                                disabled={!currentSong}
                            >
                                {isPlaying ? '⏸ PAUSE' : '▶ PLAY'}
                            </button>
                            <button 
                                onClick={handleNext}
                                className={styles.secondaryButton}
                                disabled={songs.length === 0}
                            >
                                NEXT ⏭
                            </button>
                        </div>

                        <div className={styles.progressRow}>
                            <span className={styles.time}>{formatTime(position)}</span>
                            <input
                                type="range"
                                min={0}
                                max={maxDuration || 0}
                                value={Math.min(position, maxDuration || 0)}
                                onChange={event => handleSeek(Number(event.target.value))}
                                className={styles.progressBar}
                                disabled={!currentSong || maxDuration === 0}
                            />
                            <span className={styles.time}>{formatTime(maxDuration || 0)}</span>
                        </div>
                    </>
                ) : (
                    <p className={styles.emptyState}>Select a track from the library below</p>
                )}
            </div>

            {/* The Library */}
            <div className={styles.songList}>
                <h3 className={styles.libraryTitle}>Library ({songs.length} tracks)</h3>
                <ul className={styles.list}>
                    {songs.map((song) => (
                        <li 
                            key={song.id} 
                            onClick={() => playSong(song)}
                            className={currentSong?.id === song.id ? styles.songItemActive : styles.songItem}
                        >
                            <div className={styles.songMeta}>
                                <strong className={styles.songTitle}>{song.title}</strong>
                                <br/>
                                <span className={styles.songArtist}>{song.artist}</span>
                            </div>
                            <span className={styles.duration}>
                                {formatTime(song.duration)}
                            </span>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

// Helper format seconds duration into minutes
const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
};