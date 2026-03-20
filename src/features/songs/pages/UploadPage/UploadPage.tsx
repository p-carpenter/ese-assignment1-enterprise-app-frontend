import { Tabs, TabList, Tab, TabPanel } from "react-aria-components";
import { SongUploadForm } from "@/features/songs";
import { JamendoSongSearch } from "@/features/songs/components/JamendoSongSearch/JamendoSongSearch";
import { Button } from "@/shared/components";
import { useNavigate } from "react-router-dom";
import styles from "./UploadPage.module.css";

export const UploadPage = () => {
  const navigate = useNavigate();

  return (
    <div className={styles.page}>
      <Tabs aria-label="Upload methods">
        <TabList className={styles.tabs}>
          <Tab id="upload">Upload MP3</Tab>
          <Tab id="jamendo">Search Jamendo</Tab>
        </TabList>

        <TabPanel id="upload">
          <SongUploadForm />
        </TabPanel>

        <TabPanel id="jamendo">
          <JamendoSongSearch onImportSuccess={() => navigate("/")} />
        </TabPanel>
      </Tabs>

      <Button variant="outlined" size="large" onClick={() => navigate("/")}>
        Go home
      </Button>
    </div>
  );
};
