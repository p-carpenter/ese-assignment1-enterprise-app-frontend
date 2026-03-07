import { type JSX } from "react";
import { Outlet } from "react-router-dom";
import { MiniPlayer, usePlayer } from "@/features/player";
import { Header } from "@/shared/layout";
import { PlaylistList } from "@/features/playlists/components/PlaylistList";
import styles from "./AppLayout.module.css";

export const AppLayout = (): JSX.Element => {
  const { currentSong } = usePlayer();
  const coverUrl = currentSong?.cover_art_url;

  return (
    <div className="page-layout">
      {/* TOP ROW: Header */}
      <Header />

      {/* CONTENT ROW: Left column + Center (current route) */}
      <div className="app-grid">
        {/* LEFT COLUMN: PlaylistList auto-refetches via React Query cache invalidation */}
        <div className={`col-scroll-auto ${styles.leftCol}`}>
          <PlaylistList />
        </div>

        {/* CENTER COLUMN: route content renders here */}
        <div className="col-scroll">
          <Outlet />
        </div>
      </div>

      {/* BOTTOM ROW: persistent player controls */}
      <MiniPlayer />
    </div>
  );
};
