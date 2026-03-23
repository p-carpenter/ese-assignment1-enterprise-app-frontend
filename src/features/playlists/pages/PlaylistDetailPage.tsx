import { PlaylistDetail } from "../components/PlaylistDetail/PlaylistDetail";

/**
 * Page wrapper that renders the `PlaylistDetail` component.
 * Kept separate for route composition and potential page-level concerns.
 * @returns Playlist detail page element.
 */
export const PlaylistDetailPage = () => {
  return (
    <>
      <PlaylistDetail />
    </>
  );
};
