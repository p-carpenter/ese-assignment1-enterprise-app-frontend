import { type JSX, useState } from "react";
import { Outlet } from "react-router-dom";
import { MiniPlayer, usePlayer } from "@/features/player";
import { Header } from "@/shared/layout";
import { PlaylistList } from "@/features/playlists/components/PlaylistList";
import styles from "./AppLayout.module.css";

export const AppLayout = (): JSX.Element => {
  const { currentSong } = usePlayer();
  const coverUrl = currentSong?.cover_art_url;
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className={styles.pageLayout}>
      <div className={styles.bg}>
        {coverUrl && (
          <div
            className={styles.bgArt}
            style={{ backgroundImage: `url(${coverUrl})` }}
          />
        )}
        <div
          className={styles.bgFallback}
          style={{ opacity: coverUrl ? 0.35 : 1 }}
        />
      </div>

      <Header onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)} />

      <div className={styles.appGrid}>
        {/* Overlay to close the sidebar when tapping outside on mobile. */}
        {isSidebarOpen && (
          <div
            className={styles.sidebarOverlay}
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        <div
          className={`${styles.leftCol} ${isSidebarOpen ? styles.open : ""}`}
        >
          <PlaylistList />
        </div>

        <div className={styles.centerCol}>
          <Outlet />
        </div>
      </div>

      <MiniPlayer />
    </div>
  );
};
