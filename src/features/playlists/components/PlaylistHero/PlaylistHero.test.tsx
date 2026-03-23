import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { PlaylistHero } from "./PlaylistHero";
import type { Playlist } from "../../types";
import type { UserMini } from "@/features/auth/types";
import { createPlaylist } from "@/test/factories/playlist";

vi.mock("../EditPlaylistForm/EditPlaylistForm", () => ({
  EditPlaylistForm: ({
    onClose,
    playlist,
  }: {
    onClose: () => void;
    playlist: Playlist;
  }) => (
    <div data-testid="edit-playlist-form">
      <span>Editing: {playlist.title}</span>
      <button onClick={onClose}>Close Form</button>
    </div>
  ),
}));

vi.mock("../DeletePlaylistButton/DeletePlaylistButton", () => ({
  DeletePlaylistButton: ({ playlistId }: { playlistId: number }) => (
    <button data-testid="delete-playlist-button">Delete {playlistId}</button>
  ),
}));

const contributors: UserMini[] = [
  { id: 2, username: "alice" },
  { id: 3, username: "bob", avatar_url: "https://example.com/bob.png" },
];

type PlaylistHeroProps = React.ComponentProps<typeof PlaylistHero>;

interface RenderHeroOptions extends Partial<
  Omit<PlaylistHeroProps, "playlist">
> {
  playlist?: Partial<Playlist>;
}

const renderHero = (overrides: RenderHeroOptions = {}) => {
  const { playlist: playlistOverride, ...restOverrides } = overrides;

  const props = {
    playlist: createPlaylist({
      title: "Test Playlist",
      cover_art_url: null,
      songs: [],
      ...playlistOverride,
    }),
    isOwner: false,
    canAddSongs: false,
    songsCount: 0,
    contributors: [] as UserMini[],
    onAddSongClick: restOverrides.onAddSongClick ?? vi.fn(),
    onPlayClick: undefined,
    ...restOverrides,
  };

  return render(<PlaylistHero {...props} />);
};

describe("PlaylistHero", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Hero content", () => {
    describe("Cover art", () => {
      it("shows a placeholder image when cover_art_url is null", () => {
        renderHero({ playlist: { cover_art_url: null } });
        const img = screen.getByRole("img", { name: "Test Playlist" });
        expect(img).toHaveAttribute("src", "https://placehold.co/220");
      });

      it("shows the actual cover art when cover_art_url is provided", () => {
        renderHero({
          playlist: { cover_art_url: "https://example.com/cover.png" },
        });
        const img = screen.getByRole("img", { name: "Test Playlist" });
        expect(img).toHaveAttribute("src", "https://example.com/cover.png");
      });
    });

    describe("Labels and title", () => {
      it("renders the 'Playlist' label", () => {
        renderHero();
        expect(screen.getByText("Playlist")).toBeInTheDocument();
      });

      it("renders the playlist title", () => {
        renderHero();
        expect(
          screen.getByRole("heading", { name: "Test Playlist" }),
        ).toBeInTheDocument();
      });

      it("renders the description when present", () => {
        renderHero({ playlist: { description: "My description" } });
        expect(screen.getByText("My description")).toBeInTheDocument();
      });

      it("does not render a description paragraph when description is empty", () => {
        renderHero({ playlist: { description: "" } });
        expect(screen.queryByText("My description")).not.toBeInTheDocument();
      });
    });

    describe("Badges", () => {
      describe("Visibility badge", () => {
        it("shows a 'Public' badge when is_public is true", () => {
          renderHero({ playlist: { is_public: true } });
          expect(screen.getByText("Public")).toBeInTheDocument();
          expect(screen.queryByText("Private")).not.toBeInTheDocument();
        });

        it("shows a 'Private' badge when is_public is false", () => {
          renderHero({ playlist: { is_public: false } });
          expect(screen.getByText("Private")).toBeInTheDocument();
          expect(screen.queryByText("Public")).not.toBeInTheDocument();
        });
      });

      describe("Collaborative badge", () => {
        it("shows 'Collaborative' badge when is_collaborative is true", () => {
          renderHero({ playlist: { is_collaborative: true } });
          expect(screen.getByText("Collaborative")).toBeInTheDocument();
        });

        it("does not show 'Collaborative' badge when is_collaborative is false", () => {
          renderHero({ playlist: { is_collaborative: false } });
          expect(screen.queryByText("Collaborative")).not.toBeInTheDocument();
        });
      });
    });

    describe("Owner section", () => {
      it("renders the owner username", () => {
        renderHero({ playlist: { owner: { id: 1, username: "owner" } } });
        expect(screen.getByText("owner")).toBeInTheDocument();
      });

      it("renders owner avatar image when avatar_url is set", () => {
        renderHero({
          playlist: {
            owner: {
              id: 1,
              username: "owner",
              avatar_url: "https://example.com/avatar.png",
            },
          },
        });
        const avatar = screen.getByRole("img", { name: "owner" });
        expect(avatar).toHaveAttribute("src", "https://example.com/avatar.png");
      });

      it("renders owner initial fallback when avatar_url is absent", () => {
        renderHero({ playlist: { owner: { id: 1, username: "zara" } } });
        expect(screen.getByText("Z")).toBeInTheDocument();
      });
    });

    describe("Song count", () => {
      it("shows '0 songs' when songsCount is 0", () => {
        renderHero({ songsCount: 0 });
        expect(screen.getByText(/0 songs/)).toBeInTheDocument();
      });

      it("shows '1 song' (singular) when songsCount is 1", () => {
        renderHero({ songsCount: 1 });
        expect(screen.getByText(/1 song/)).toBeInTheDocument();
        expect(screen.queryByText(/1 songs/)).not.toBeInTheDocument();
      });

      it("shows 'N songs' (plural) for counts greater than 1", () => {
        renderHero({ songsCount: 5 });
        expect(screen.getByText(/5 songs/)).toBeInTheDocument();
      });
    });

    describe("Contributors", () => {
      it("does not render the contributors section when contributors array is empty", () => {
        renderHero({ contributors: [] });
        expect(screen.queryByText("Contributors")).not.toBeInTheDocument();
      });

      it("renders contributor avatars with tooltip (title) matching username", () => {
        renderHero({ contributors });
        expect(screen.getByTitle("alice")).toBeInTheDocument();
        expect(screen.getByTitle("bob")).toBeInTheDocument();
      });

      it("shows initial letter for contributor without avatar_url", () => {
        renderHero({ contributors: [{ id: 2, username: "alice" }] });
        expect(screen.getByTitle("alice")).toHaveTextContent("A");
      });

      it("renders contributor image when avatar_url is provided", () => {
        renderHero({ contributors });
        const bobAvatar = screen
          .getByTitle("bob")
          .querySelector("img") as HTMLImageElement;
        expect(bobAvatar).toBeInTheDocument();
        expect(bobAvatar.src).toBe("https://example.com/bob.png");
      });

      it("shows at most 5 contributor avatars", () => {
        const manyContributors: UserMini[] = Array.from(
          { length: 7 },
          (_, i) => ({
            id: i + 10,
            username: `user${i}`,
          }),
        );
        renderHero({ contributors: manyContributors });
        expect(screen.getByTitle(`${7 - 5} more`)).toBeInTheDocument();
        expect(screen.getByText("+2")).toBeInTheDocument();
      });

      it("shows the '+N more' overflow only when contributors > 5", () => {
        const exactlyFive: UserMini[] = Array.from({ length: 5 }, (_, i) => ({
          id: i + 10,
          username: `user${i}`,
        }));
        renderHero({ contributors: exactlyFive });
        expect(screen.queryByText(/^\+/)).not.toBeInTheDocument();
      });

      it("renders the 'Contributors' label when there are contributors", () => {
        renderHero({ contributors });
        expect(screen.getByText("Contributors")).toBeInTheDocument();
      });
    });
  });

  describe("Actions", () => {
    describe("Add songs", () => {
      it("shows 'Add songs' button when canAddSongs is true", () => {
        renderHero({ canAddSongs: true });
        expect(
          screen.getByRole("button", { name: /add songs/i }),
        ).toBeInTheDocument();
      });

      it("hides 'Add songs' button when canAddSongs is false", () => {
        renderHero({ canAddSongs: false });
        expect(
          screen.queryByRole("button", { name: /add songs/i }),
        ).not.toBeInTheDocument();
      });

      it("calls onAddSongClick when the 'Add songs' button is clicked", () => {
        const onAddSongClick = vi.fn();
        renderHero({ canAddSongs: true, onAddSongClick });
        fireEvent.click(screen.getByRole("button", { name: /add songs/i }));
        expect(onAddSongClick).toHaveBeenCalledOnce();
      });
    });

    describe("Owner controls", () => {
      it("shows Edit and Delete buttons when isOwner is true", () => {
        renderHero({ isOwner: true });
        expect(
          screen.getByRole("button", { name: /edit playlist/i }),
        ).toBeInTheDocument();
        expect(
          screen.getByTestId("delete-playlist-button"),
        ).toBeInTheDocument();
      });

      it("hides Edit and Delete buttons when isOwner is false", () => {
        renderHero({ isOwner: false });
        expect(
          screen.queryByRole("button", { name: /edit playlist/i }),
        ).not.toBeInTheDocument();
        expect(
          screen.queryByTestId("delete-playlist-button"),
        ).not.toBeInTheDocument();
      });

      it("passes the playlist id to DeletePlaylistButton", () => {
        renderHero({ isOwner: true, playlist: { id: 42 } });
        expect(screen.getByTestId("delete-playlist-button")).toHaveTextContent(
          "Delete 42",
        );
      });
    });

    describe("Edit flow", () => {
      it("toggles to EditPlaylistForm when the Edit button is clicked", () => {
        renderHero({ isOwner: true, playlist: { title: "Test Playlist" } });
        expect(
          screen.queryByTestId("edit-playlist-form"),
        ).not.toBeInTheDocument();
        fireEvent.click(screen.getByRole("button", { name: /edit playlist/i }));
        expect(screen.getByTestId("edit-playlist-form")).toBeInTheDocument();
        expect(screen.getByText("Editing: Test Playlist")).toBeInTheDocument();
      });

      it("hides the hero info while the EditPlaylistForm is open", () => {
        renderHero({ isOwner: true, playlist: { title: "Test Playlist" } });
        fireEvent.click(screen.getByRole("button", { name: /edit playlist/i }));
        expect(
          screen.queryByRole("heading", { name: "Test Playlist" }),
        ).not.toBeInTheDocument();
      });

      it("closes EditPlaylistForm and returns to hero view when onClose is called", () => {
        renderHero({ isOwner: true, playlist: { title: "Test Playlist" } });
        fireEvent.click(screen.getByRole("button", { name: /edit playlist/i }));
        expect(screen.getByTestId("edit-playlist-form")).toBeInTheDocument();

        fireEvent.click(screen.getByRole("button", { name: "Close Form" }));
        expect(
          screen.queryByTestId("edit-playlist-form"),
        ).not.toBeInTheDocument();
        expect(
          screen.getByRole("heading", { name: "Test Playlist" }),
        ).toBeInTheDocument();
      });
    });

    describe("Play button", () => {
      it("shows 'Play' button when songsCount > 0 and onPlayClick is provided", () => {
        renderHero({ songsCount: 3, onPlayClick: vi.fn() });
        expect(
          screen.getByRole("button", { name: /play playlist/i }),
        ).toBeInTheDocument();
      });

      it("hides 'Play' button when songsCount is 0 even if onPlayClick is provided", () => {
        renderHero({ songsCount: 0, onPlayClick: vi.fn() });
        expect(
          screen.queryByRole("button", { name: /play playlist/i }),
        ).not.toBeInTheDocument();
      });

      it("hides 'Play' button when onPlayClick is not provided", () => {
        renderHero({ songsCount: 3, onPlayClick: undefined });
        expect(
          screen.queryByRole("button", { name: /play playlist/i }),
        ).not.toBeInTheDocument();
      });

      it("calls onPlayClick when the 'Play' button is clicked", () => {
        const onPlayClick = vi.fn();
        renderHero({ songsCount: 2, onPlayClick });
        fireEvent.click(screen.getByRole("button", { name: /play playlist/i }));
        expect(onPlayClick).toHaveBeenCalledOnce();
      });

      it("shows 'Play' button for non-owner users when playable", () => {
        renderHero({ isOwner: false, songsCount: 1, onPlayClick: vi.fn() });
        expect(
          screen.getByRole("button", { name: /play playlist/i }),
        ).toBeInTheDocument();
      });
    });
  });
});
