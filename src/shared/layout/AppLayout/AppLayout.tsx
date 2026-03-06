import { type JSX } from "react";
import { Outlet } from "react-router-dom";
import { MiniPlayer, usePlayer } from "@/features/player";
import { Header } from "@/shared/layout";
import { PlaylistList } from "@/features/playlists/components/PlaylistList";

export const AppLayout = (): JSX.Element => {
  const { playlistTick } = usePlayer();
  return (
    <div className="page-layout">
      {/* TOP ROW: Header */}
      <Header />

      {/* CONTENT ROW: Left column + Center (current route) */}
      <div className="app-grid">
        {/* LEFT COLUMN: remounts when playlistTick changes, re-fetching playlists */}
        <div className="col-scroll-auto">
          <PlaylistList key={playlistTick} />
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
