import { PlaylistList } from "@/features/playlists/components/PlaylistList/PlaylistList";
import { AuthFooter } from "./AuthFooter/AuthFooter";
import styles from "./Sidebar.module.css";

/**
 * Sidebar showing playlists and authentication footer actions.
 * @returns Sidebar element.
 */
export const Sidebar = () => {
  return (
    <div className={styles.sidebar}>
      <PlaylistList />
      <AuthFooter />
    </div>
  );
};
