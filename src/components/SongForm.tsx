import { useState, type JSX } from 'react';
import { useCloudinaryUpload } from '../hooks/useCloudinaryUpload';
import { api } from '../services/api';
import { SongDetailsForm } from './common/SongDetailsForm';
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

    // Handlers for SongDetailsForm
    const handleCoverArtUpload = async (file: File) => {
        try {
            const cloudData = await upload(file);
            setCoverArtUrl(cloudData.secure_url);
        } catch (err) {
            console.error('Cover art upload failed:', err);
        }
    };

    const handleMp3Upload = async (file: File) => {
        try {
            const cloudData = await upload(file);
            setSongUrl(cloudData.secure_url);
            setSongDuration(Math.round(cloudData.duration || 0));
            setSongFileName(file.name);
        } catch (err) {
            console.error('MP3 upload failed:', err);
        }
    };

    const handleSubmit = async ({ title: t, artist: a, coverArtUrl: c }: { title: string; artist: string; coverArtUrl: string }) => {
        if (!songUrl) {
            alert('Please select an MP3 file.');
            return;
        }
        try {
            await api.songs.upload({
                title: t || songFileName,
                artist: a || 'Unknown Artist',
                file_url: songUrl,
                cover_art_url: coverArtUrl || c,
                duration: songDuration,
            });
            setTitle('');
            setArtist('');
            setSongUrl('');
            setSongDuration(0);
            setCoverArtUrl('');
            setSongFileName('');
            alert('Song saved successfully!');
            onUploadSuccess();
        } catch (err) {
            console.error('Failed to save song:', err);
            alert('Failed to save song. Check console.');
        }
    };

    return (
        <SongDetailsForm
            initialValues={{ title, artist, cover_art_url: coverArtUrl }}
            onSubmit={handleSubmit}
            isSubmitting={isUploading}
            error={uploadError as string}
            showMp3Upload={true}
            onMp3Upload={handleMp3Upload}
            mp3Uploaded={!!songUrl}
            mp3Uploading={isUploading}
            mp3Label={isUploading ? 'Uploading...' : 'Select MP3'}
            coverArtUploading={isUploading}
            onCoverArtUpload={handleCoverArtUpload}
        />
    );
};