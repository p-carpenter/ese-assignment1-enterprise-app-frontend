import { useState } from 'react';
import { SongUploadForm } from '../components/SongForm';
import { Header } from '../components/Header';

interface UploadPageProps {
    onLogout: () => void;
    userInitial?: string;
    avatarUrl?: string;
}

export const UploadPage = ({ onLogout, userInitial, avatarUrl }: UploadPageProps): JSX.Element => {
    const [refreshKey, setRefreshKey] = useState(0);

    return (
        <>
            <Header onLogout={onLogout} userInitial={userInitial} avatarUrl={avatarUrl} />
            <div style={{ maxWidth: '600px', margin: '0 auto' }}>
                <SongUploadForm onUploadSuccess={() => setRefreshKey(prev => prev + 1)} />
            </div>
        </>
    );
};
