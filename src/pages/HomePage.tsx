import { useState, type JSX } from "react";
import { MusicPlayer } from "../components/features/player/MusicPlayer";
import { PlayHistory } from "../components/features/player/PlayHistory";
import { Header } from "../components/layout/Header";

interface HomePageProps {
  onLogout: () => void;
  avatarUrl?: string;
}

export const HomePage = ({
  onLogout,
  avatarUrl,
}: HomePageProps): JSX.Element => {
  const [historyTrigger, setHistoryTrigger] = useState(0);

  const refreshHistory = () => {
    setHistoryTrigger((prev) => prev + 1);
  };

  return (
    <>
      <Header onLogout={onLogout} avatarUrl={avatarUrl} />
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
          <PlayHistory keyTrigger={historyTrigger} />
        </div>
      </div>
    </>
  );
};
