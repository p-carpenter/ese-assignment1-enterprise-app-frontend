import { useState, type JSX } from "react";
import { SongUploadForm } from "../components/features/songs/SongForm";
import Header from "../components/layout/Header";

interface UploadPageProps {
  onLogout: () => void;
  userInitial?: string;
  avatarUrl?: string;
}

export const UploadPage = ({
  onLogout,
  userInitial,
  avatarUrl,
}: UploadPageProps): JSX.Element => {
  const [, setRefreshKey] = useState(0);

  return (
    <>
      <Header
        onLogout={onLogout}
        userInitial={userInitial}
        avatarUrl={avatarUrl}
      />
      <div style={{ maxWidth: "600px", margin: "0 auto" }}>
        <SongUploadForm
          onUploadSuccess={() => setRefreshKey((prev) => prev + 1)}
        />
      </div>
    </>
  );
};
