// src/components/SongUploadForm.tsx (Update)
import { useState } from 'react';
import { useCloudinaryUpload } from '../hooks/useCloudinaryUpload';
import { api } from '../services/api';
import { FileSelect } from './common/FileSelect';

export const SongUploadForm = ({ onUploadSuccess }: { onUploadSuccess: () => void }) => {
    const { upload, isUploading, error: uploadError } = useCloudinaryUpload();
    const [title, setTitle] = useState('');
    const [artist, setArtist] = useState('');

    const handleFile = async (file: File) => {
        try {
            // Upload to Cloudinary
            const cloudData = await upload(file);
            
            // Save to Django Database
            await api.createSong({
                title: title || file.name,
                artist: artist || "Unknown Artist",
                file_url: cloudData.secure_url,
                duration: Math.round(cloudData.duration || 0),
            });

            // Reset and Notify
            setTitle('');
            setArtist('');
            alert('Song saved successfully!');
            // Tells parent component to refresh the list
            onUploadSuccess();

        } catch (err) {
            console.error("Failed:", err);
            alert("Upload failed. Check console.");
        }
    };

    return (
        <div className="upload-box">
            <h3>Add New Track</h3>
            <input 
                placeholder="Title" 
                value={title} 
                onChange={e => setTitle(e.target.value)} 
                className="input-field"
            />
             <input 
                placeholder="Artist" 
                value={artist} 
                onChange={e => setArtist(e.target.value)} 
                className="input-field"
            />

            <FileSelect 
                accept="audio/*" 
                label={isUploading ? "Uploading..." : "Select MP3"}
                onFileSelect={handleFile} 
            />
        </div>
    );
};