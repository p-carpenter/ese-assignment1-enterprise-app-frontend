import { useState } from 'react';
import { MusicPlayer } from '../components/MusicPlayer';
import { PlayHistory } from '../components/PlayHistory';
import { Header } from '../components/Header';

interface HomePageProps {
    onLogout: () => void;
    userInitial?: string;
    avatarUrl?: string;
}

export const HomePage = ({ onLogout, userInitial, avatarUrl }: HomePageProps): JSX.Element => {
    const [historyTrigger, setHistoryTrigger] = useState(0);

    const refreshHistory = () => {
        setHistoryTrigger(prev => prev + 1);
    };

    return (
        <>
            <Header onLogout={onLogout} userInitial={userInitial} avatarUrl={avatarUrl} />
            <div className="app-grid">
                {/* LEFT COLUMN: Player */}
                <div>
                    <MusicPlayer 
                        keyTrigger={historyTrigger} 
                        onSongPlay={refreshHistory}
                    />
                </div>

                {/* RIGHT COLUMN: History */}
                <div>
                    <PlayHistory 
                        keyTrigger={historyTrigger}
                    />
                </div>
            </div>
        </>
    );
};
