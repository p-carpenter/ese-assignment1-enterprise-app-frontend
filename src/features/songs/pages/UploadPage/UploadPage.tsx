import { useState } from "react";
import { SongUploadForm } from "@/features/songs";
import { JamendoSongSearch } from "@/features/songs/components/JamendoSongSearch/JamendoSongSearch";
import { Button } from "@/shared/components";
import { useNavigate } from "react-router-dom";
import styles from "./UploadPage.module.css";

export const UploadPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"upload" | "jamendo">("upload");

  return (
    <div className={styles.page}>
      <div className={styles.tabs}>
        <Button
          size="large"
          variant={activeTab === "upload" ? "primary" : "outlined"}
          onClick={() => setActiveTab("upload")}
        >
          Upload File
        </Button>
        <Button
          size="large"
          variant={activeTab === "jamendo" ? "primary" : "outlined"}
          onClick={() => setActiveTab("jamendo")}
        >
          Import Jamendo
        </Button>
      </div>

      {activeTab === "upload" ? <SongUploadForm /> : <JamendoSongSearch />}

      <Button variant="outlined" size="large" onClick={() => navigate("/")}>
        Cancel Upload
      </Button>
    </div>
  );
};
