import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { SongMeta } from "./SongMeta";
import { usePlayer } from "@/shared/context";
import styles from "./SongMeta.module.css";
import { createMockPlayer } from "@/test/factories/player";
import { createSong } from "@/test/factories/song";
import { axe, toHaveNoViolations } from "jest-axe";
expect.extend(toHaveNoViolations);

vi.mock("@/shared/context", () => ({
  usePlayer: vi.fn(),
}));

describe("SongMeta", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(usePlayer).mockReturnValue(
      createMockPlayer({ currentSong: null }),
    );
  });

  describe("Empty State", () => {
    it("renders fallback metadata when no song is selected", () => {
      render(
        <SongMeta
          titleRef={{ current: null }}
          artistRef={{ current: null }}
          isScrolling={false}
          isArtistScrolling={false}
        />,
      );

      expect(screen.getByRole("img", { name: "No track" })).toHaveAttribute(
        "src",
        "https://placehold.co/48",
      );
      expect(screen.getByText("No track selected")).toBeInTheDocument();
      expect(screen.getByText("—")).toBeInTheDocument();
    });

    it("renders fallback cover art and metadata when song object exists but has missing string fields", () => {
      vi.mocked(usePlayer).mockReturnValue(
        createMockPlayer({
          currentSong: createSong({ title: "", artist: "", cover_art_url: "" }),
        }),
      );

      render(
        <SongMeta
          titleRef={{ current: null }}
          artistRef={{ current: null }}
          isScrolling={false}
          isArtistScrolling={false}
        />,
      );

      expect(screen.getByRole("img", { name: "No track" })).toHaveAttribute(
        "src",
        "https://placehold.co/48",
      );
      expect(screen.getByText("No track selected")).toBeInTheDocument();
      expect(screen.getByText("—")).toBeInTheDocument();
    });
  });

  describe("Active Song Layout", () => {
    it("renders current song details and applies scrolling classes", () => {
      vi.mocked(usePlayer).mockReturnValue(
        createMockPlayer({
          currentSong: createSong({
            title: "Song A",
            artist: "Artist A",
            cover_art_url: "https://example.com/cover.jpg",
          }),
        }),
      );

      render(
        <SongMeta
          titleRef={{ current: null }}
          artistRef={{ current: null }}
          isScrolling={true}
          isArtistScrolling={true}
        />,
      );

      expect(screen.getByRole("img", { name: "Song A" })).toHaveAttribute(
        "src",
        "https://example.com/cover.jpg",
      );

      const title = screen.getByText("Song A");
      const artist = screen.getByText("Artist A");

      expect(title.className).toContain(styles.scrolling);
      expect(artist.className).toContain(styles.scrolling);
    });

    it("does not apply scrolling classes when scrolling props are false", () => {
      vi.mocked(usePlayer).mockReturnValue(
        createMockPlayer({
          currentSong: createSong({
            title: "Short Title",
            artist: "Short Artist",
          }),
        }),
      );

      render(
        <SongMeta
          titleRef={{ current: null }}
          artistRef={{ current: null }}
          isScrolling={false}
          isArtistScrolling={false}
        />,
      );

      const title = screen.getByText("Short Title");
      const artist = screen.getByText("Short Artist");

      expect(title.className).not.toContain(styles.scrolling);
      expect(artist.className).not.toContain(styles.scrolling);
    });
  });

  describe("Expanded Layout", () => {
    it("applies expanded classes when isExpanded is true", () => {
      vi.mocked(usePlayer).mockReturnValue(
        createMockPlayer({
          currentSong: createSong({
            title: "Expanded Song",
            artist: "Expanded Artist",
          }),
        }),
      );

      render(
        <SongMeta
          titleRef={{ current: null }}
          artistRef={{ current: null }}
          isScrolling={false}
          isArtistScrolling={false}
          isExpanded={true}
        />,
      );

      const img = screen.getByRole("img", { name: "Expanded Song" });
      const title = screen.getByText("Expanded Song");
      const artist = screen.getByText("Expanded Artist");
      const trackMeta = title.closest("div");

      expect(img.className).toContain(styles.expandedArt);
      expect(trackMeta?.className).toContain(styles.expandedMeta);
      expect(title.className).toContain(styles.expandedTitle);
      expect(artist.className).toContain(styles.expandedArtist);
    });

    it("does not apply expanded classes when isExpanded is false", () => {
      vi.mocked(usePlayer).mockReturnValue(
        createMockPlayer({
          currentSong: createSong({
            title: "Normal Song",
            artist: "Normal Artist",
          }),
        }),
      );

      render(
        <SongMeta
          titleRef={{ current: null }}
          artistRef={{ current: null }}
          isScrolling={false}
          isArtistScrolling={false}
          isExpanded={false}
        />,
      );

      const img = screen.getByRole("img", { name: "Normal Song" });
      const title = screen.getByText("Normal Song");
      const artist = screen.getByText("Normal Artist");
      const trackMeta = title.closest("div");

      expect(img.className).not.toContain(styles.expandedArt);
      expect(trackMeta?.className).not.toContain(styles.expandedMeta);
      expect(title.className).not.toContain(styles.expandedTitle);
      expect(artist.className).not.toContain(styles.expandedArtist);
    });
  });

  describe("Accessibility", () => {
    it("should have no accessibility violations", async () => {
      const { container } = render(
        <SongMeta
          titleRef={{ current: null }}
          artistRef={{ current: null }}
          isScrolling={true}
          isArtistScrolling={true}
        />,
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});
