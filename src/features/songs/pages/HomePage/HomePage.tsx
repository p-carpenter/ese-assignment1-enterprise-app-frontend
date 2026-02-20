import { useState, type JSX } from "react";
import { MusicPlayer } from "@/features/player";
import { PlayHistory } from "@/features/player";
import { Header } from "@/shared/layout";

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
          <MusicPlayer onSongPlay={refreshHistory} />
        </div>

        {/* RIGHT COLUMN: History */}
        <div>
          <PlayHistory keyTrigger={historyTrigger} />
        </div>
      </div>
    </>
  );
};
