import { useState, type JSX } from 'react';
import styles from '../SongForm.module.css';
import { type Song } from '../../types';

interface SongDetailsFormProps {
    initialValues?: Partial<Song>;
    onSubmit: (values: { title: string; artist: string; coverArtUrl: string }) => void;
    isSubmitting?: boolean;
    error?: string | null;
    showMp3Upload?: boolean;
    onMp3Upload?: (file: File) => void;
    mp3Uploaded?: boolean;
    mp3Uploading?: boolean;
    mp3Label?: string;
    coverArtUploading?: boolean;
    onCoverArtUpload?: (file: File) => void;
}

export const SongDetailsForm = ({
    initialValues = {},
    onSubmit,
    isSubmitting = false,
    error,
    showMp3Upload = false,
    onMp3Upload,
    mp3Uploaded = false,
    mp3Uploading = false,
    mp3Label = 'Select MP3',
    coverArtUploading = false,
    onCoverArtUpload,
}: SongDetailsFormProps): JSX.Element => {
    const [title, setTitle] = useState(initialValues.title || '');
    const [artist, setArtist] = useState(initialValues.artist || '');
    const [coverArtUrl, setCoverArtUrl] = useState(initialValues.cover_art_url || '');

    // For cover art upload
    const handleCoverArt = async (file: File) => {
        if (onCoverArtUpload) {
            onCoverArtUpload(file);
        }
    };

    // For MP3 upload
    const handleMp3 = async (file: File) => {
        if (onMp3Upload) {
            onMp3Upload(file);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit({
            title,
            artist,
            coverArtUrl,
        });
    };

    return (
        <form className={styles.container} onSubmit={handleSubmit}>
            <h3 className={styles.title}>Song Details</h3>
            <input 
                placeholder="Title" 
                value={title} 
                onChange={e => setTitle(e.target.value)} 
                className={styles.inputField}
            />
            <input 
                placeholder="Artist" 
                value={artist} 
                onChange={e => setArtist(e.target.value)} 
                className={styles.inputField}
            />
            {/* Cover Art Upload */}
            {onCoverArtUpload && (
                <input 
                    type="file" 
                    accept="image/*" 
                    onChange={e => e.target.files && handleCoverArt(e.target.files[0])}
                    disabled={coverArtUploading}
                />
            )}
            {/* MP3 Upload (only for upload) */}
            {showMp3Upload && onMp3Upload && (
                <input 
                    type="file" 
                    accept="audio/*" 
                    onChange={e => e.target.files && handleMp3(e.target.files[0])}
                    disabled={mp3Uploading}
                />
            )}
            {mp3Uploaded && <p className={styles.success}>✓ Audio file ready</p>}
            {error && <div className={styles.error}>{error}</div>}
            <button 
                type="submit" 
                disabled={isSubmitting || (showMp3Upload && !mp3Uploaded)}
                className={styles.submitButton}
            >
                {isSubmitting ? 'Saving...' : 'Save Song'}
            </button>
        </form>
    );
};
