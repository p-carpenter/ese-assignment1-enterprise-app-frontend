import { useState } from "react";
import { SongUploadForm } from "@/features/songs";
import { SpotifySearch } from "@/features/spotify/components";
import { Button } from "@/shared/components";
import { useNavigate } from "react-router-dom";

type Tab = "upload" | "spotify";

const tabStyle = (active: boolean): React.CSSProperties => ({
  padding: "8px 20px",
  border: "none",
  borderRadius: "20px",
  cursor: "pointer",
  fontWeight: 600,
  fontSize: "0.9rem",
  background: active ? "#1db954" : "rgba(255,255,255,0.08)",
  color: active ? "#000" : "inherit",
  transition: "background 0.15s",
});

export const UploadPage = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("upload");

  return (
    <div style={{ maxWidth: "600px", margin: "0 auto" }}>
      {/* Tab switcher */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "24px" }}>
        <button
          style={tabStyle(tab === "upload")}
          onClick={() => setTab("upload")}
        >
          Upload MP3
        </button>
        <button
          style={tabStyle(tab === "spotify")}
          onClick={() => setTab("spotify")}
        >
          Search Spotify
        </button>
      </div>

      {tab === "upload" ? (
        <>
          <SongUploadForm />
          <Button variant="outlined" size="large" onClick={() => navigate("/")}>
            Cancel Upload
          </Button>
        </>
      ) : (
        <SpotifySearch />
      )}
    </div>
  );
};
