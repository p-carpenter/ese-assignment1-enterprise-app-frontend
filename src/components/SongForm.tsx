import { useState } from 'react';
import { useCloudinaryUpload } from '../hooks/useCloudinaryUpload';
import { api } from '../services/api';
import { FileSelect } from './common/FileSelect';
import styles from './SongForm.module.css';

interface SongUploadFormProps {
    onUploadSuccess: () => void;
}

export const SongUploadForm = ({ onUploadSuccess }: SongUploadFormProps): JSX.Element => {
    const { upload, isUploading, error: uploadError } = useCloudinaryUpload();
    const [title, setTitle] = useState<string>('');
    const [artist, setArtist] = useState<string>('');
    const [songUrl, setSongUrl] = useState<string>('');
    const [songDuration, setSongDuration] = useState<number>(0);
    const [coverArtUrl, setCoverArtUrl] = useState<string>('');
    const [songFileName, setSongFileName] = useState<string>('');

    const handleFile = async (file: File): Promise<void> => {
        try {
            const cloudData = await upload(file);
            
            // Determine if this is audio or image based on file type
            if (file.type.startsWith('audio')) {
                setSongUrl(cloudData.secure_url);
                setSongDuration(Math.round(cloudData.duration || 0));
                setSongFileName(file.name);
            } else if (file.type.startsWith('image')) {
                setCoverArtUrl(cloudData.secure_url);
            }
        } catch (err) {
            console.error("Upload failed:", err);
        }
    };

    const handleSubmit = async (e: React.FormEvent): Promise<void> => {
        e.preventDefault();
        
        if (!songUrl) {
            alert("Please select an MP3 file.");
            return;
        }

        try {
            await api.createSong({
                title: title || songFileName,
                artist: artist || "Unknown Artist",
                file_url: songUrl,
                cover_art_url: coverArtUrl,
                duration: songDuration,
            });

            // Reset form
            setTitle('');
            setArtist('');
            setSongUrl('');
            setSongDuration(0);
            setCoverArtUrl('');
            setSongFileName('');
            
            alert('Song saved successfully!');
            onUploadSuccess();

        } catch (err) {
            console.error("Failed to save song:", err);
            alert("Failed to save song. Check console.");
        }
    };

    return (
        <form className={styles.container} onSubmit={handleSubmit}>
            <h3 className={styles.title}>Add New Track</h3>
            <FileSelect 
                accept="image/*" 
                label={isUploading ? "Uploading..." : "Select Cover Art"}
                onFileSelect={handleFile} 
            />
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

            <FileSelect 
                accept="audio/*" 
                label={isUploading ? "Uploading..." : "Select MP3"}
                onFileSelect={handleFile} 
            />
            {uploadError && <div className={styles.error}>{uploadError}</div>}
            {songUrl && <p className={styles.success}>✓ Audio file ready</p>}
            <button 
                type="submit" 
                disabled={isUploading || !songUrl}
                className={styles.submitButton}
            >
                {isUploading ? 'Uploading...' : 'Save Song'}
            </button>
        </form>
    );
};