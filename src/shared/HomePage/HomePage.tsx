import { useState, type JSX } from "react";
import { MusicPlayer } from "@/features/player";
import { PlayHistory } from "@/features/player";
import { Header } from "@/shared/layout";
import { SongLibrary } from "@/features/songs";
import { PlaylistList } from "@/features/playlists/components/PlaylistList";

export const HomePage = (): JSX.Element => {
  const [historyTrigger, setHistoryTrigger] = useState(0);

  const refreshHistory = () => {
    setHistoryTrigger((prev) => prev + 1);
  };

  return (
    <>
      <Header />
      <div className="app-grid">
        {/* LEFT COLUMN: Player */}
        <div>
          <MusicPlayer onSongPlay={refreshHistory} />
          <SongLibrary />
        </div>

        {/* RIGHT COLUMN: History */}
        <div>
          <PlaylistList />
          <PlayHistory keyTrigger={historyTrigger} />
        </div>
      </div>
    </>
  );
};
