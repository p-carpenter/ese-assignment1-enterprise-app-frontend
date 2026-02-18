import { useEffect, useMemo, useState, type JSX } from 'react';
import { useAudioPlayer } from 'react-use-audio-player';
import { api } from '../services/api';
import { type Song } from '../types';
import styles from './MusicPlayer.module.css';
import { SongLibrary } from './SongLibrary';

interface MusicPlayerProps {
    keyTrigger: number;
    onSongPlay?: () => void;
}

export const MusicPlayer = ({ keyTrigger, onSongPlay }: MusicPlayerProps): JSX.Element => {
    const { play, pause, stop, isPlaying, load, getPosition, seek, duration } = useAudioPlayer();
    const [songs, setSongs] = useState<Song[]>([]);
    const [currentSong, setCurrentSong] = useState<Song | null>(null);
    const [position, setPosition] = useState(0);

    useEffect(() => {
        api.songs.list()
            .then(data => setSongs(data))
            .catch(err => console.error("Failed to load library", err));
    }, [keyTrigger]);

    const playSong = async (song: Song): Promise<void> => {
        if (currentSong?.id === song.id) {
            if (isPlaying) { pause(); } else { play(); }
            return;
        }

        stop(); 
        setCurrentSong(song);
        setPosition(0);
        
        load(song.file_url, {
            autoplay: true,
            format: 'mp3',
            html5: true,
            onend: () => console.log("Song finished!"),
        });

        try {
            await api.songs.logPlay(song.id);
            
            if (onSongPlay) {
                onSongPlay(); 
            }
        } catch (err) {
            console.error("Failed to log play:", err);
        }
    };

    const currentIndex = useMemo((): number => {
        if (!currentSong) return -1;
        return songs.findIndex(song => song.id === currentSong.id);
    }, [songs, currentSong]);

    const handlePrev = (): void => {
        if (songs.length === 0) return;
        const prevIndex = currentIndex > 0 ? currentIndex - 1 : songs.length - 1;
        void playSong(songs[prevIndex]);
    };

    const handleNext = (): void => {
        if (songs.length === 0) return;
        const nextIndex = currentIndex >= 0 && currentIndex < songs.length - 1 ? currentIndex + 1 : 0;
        void playSong(songs[nextIndex]);
    };

    useEffect(() => {
        if (!currentSong) return;
        const id = window.setInterval(() => setPosition(getPosition()), 500);
        return () => window.clearInterval(id);
    }, [currentSong, getPosition]);

    const maxDuration = Math.max(duration ?? 0, currentSong?.duration ?? 0);
    const handleSeek = (value: number): void => {
        seek(value);
        setPosition(value);
    };

    return (
        <div className={styles.container}>
             {/* Player Controls */}
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
                            <button onClick={handlePrev} className={styles.secondaryButton} disabled={songs.length === 0}>‹‹ PREV</button>
                            <button onClick={() => isPlaying ? pause() : play()} className={styles.primaryButton}>{isPlaying ? '❚❚ PAUSE' : '▸ PLAY'}</button>
                            <button onClick={handleNext} className={styles.secondaryButton} disabled={songs.length === 0}>NEXT ››</button>
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

            {/* Library List */}
            <SongLibrary 
                songs={songs}
                currentSongId={currentSong?.id}
                onSongClick={playSong}
            />
        </div>
    );
};

const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
};