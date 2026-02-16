import { useState } from 'react';
import { useCloudinaryUpload } from '../hooks/useCloudinaryUpload';
import { FileSelect } from './common/FileSelect';

export const SongUploadForm = () => {
    const { upload, isUploading, error } = useCloudinaryUpload(); // <--- Logic reused
    const [title, setTitle] = useState('');

    const handleFile = async (file: File) => {
        try {
            // Upload the file
            const data = await upload(file);
            
            // Send metadata to Django
            const payload = {
                title: title || data.original_filename,
                file_url: data.secure_url,
                duration: data.duration,
                artist: "Me" // Replace with form input later
            };
            
            console.log("Saved to Django:", payload);
            
        } catch (err) {
            console.error("Failed:", err);
        }
    };

    return (
        <div>
            <h3>Upload New Song</h3>
            {error && <p style={{color: 'red'}}>{error}</p>}
            
            <input 
                type="text" 
                placeholder="Song Title" 
                value={title} 
                onChange={e => setTitle(e.target.value)} 
            />
            
            <FileSelect 
                accept="audio/*" 
                onFileSelect={handleFile} 
                label={isUploading ? "Uploading..." : "Select MP3"} 
            />
        </div>
    );
};