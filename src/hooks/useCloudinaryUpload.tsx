import { useState } from 'react';

interface CloudinaryResponse {
    secure_url: string;
    duration?: number; // Only present for audio/video
    original_filename: string;
}

export const useCloudinaryUpload = () => {
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const upload = async (file: File) => {
        setIsUploading(true);
        setError(null);

        const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
        const uploadPreset = import.meta.env.VITE_CLOUDINARY_PRESET;

        // Auto-detect type: 'video' for audio files, 'image' for images
        const resourceType = file.type.startsWith('audio') ? 'video' : 'image';

        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', uploadPreset);
        formData.append('resource_type', resourceType);

        try {
            const response = await fetch(
                `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`,
                { method: 'POST', body: formData }
            );

            if (!response.ok) throw new Error('Upload failed');

            const data: CloudinaryResponse = await response.json();
            return data;

        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error');
            throw err;
        } finally {
            setIsUploading(false);
        }
    };

    return { upload, isUploading, error };
};