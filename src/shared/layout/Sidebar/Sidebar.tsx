import { PlaylistList } from "@/features/playlists/components/PlaylistList";
import { AuthFooter } from "./AuthFooter/AuthFooter";
import styles from "./Sidebar.module.css";

export const Sidebar = () => {
  return (
    <div className={styles.sidebar}>
      <PlaylistList />
      <AuthFooter />
    </div>
  );
};
