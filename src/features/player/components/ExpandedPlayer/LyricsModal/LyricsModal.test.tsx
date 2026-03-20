import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { LyricsModal } from "./LyricsModal";
import type { Song } from "@/features/songs/types";

vi.mock("@/features/songs/pages/SongDetailsPage/components", () => ({
  LyricsSection: vi.fn(() => <div data-testid="lyrics-section" />),
}));

const mockSong = { id: 1, title: "Test Song" } as Song;

describe("LyricsModal", () => {
  it("opens and closes the Lyrics modal via buttons", async () => {
    const user = userEvent.setup();
    render(<LyricsModal currentSong={mockSong} />);

    expect(screen.queryByRole("dialog", { name: "Lyrics" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Lyrics/i }));
    expect(screen.getByRole("dialog", { name: "Lyrics" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Close lyrics" }));
    expect(screen.queryByRole("dialog", { name: "Lyrics" })).not.toBeInTheDocument();
  });

  it("closes the modal when pressing the Escape key", async () => {
    const user = userEvent.setup();
    render(<LyricsModal currentSong={mockSong} />);

    await user.click(screen.getByRole("button", { name: /Lyrics/i }));
    expect(screen.getByRole("dialog", { name: "Lyrics" })).toBeInTheDocument();

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog", { name: "Lyrics" })).not.toBeInTheDocument();
  });

  it("closes the modal when clicking on the overlay backdrop", async () => {
    const user = userEvent.setup();
    render(<LyricsModal currentSong={mockSong} />);

    await user.click(screen.getByRole("button", { name: /Lyrics/i }));
    
    await user.click(document.body);
    
    expect(screen.queryByRole("dialog", { name: "Lyrics" })).not.toBeInTheDocument();
  });

  it("does not render LyricsSection inside the modal if there is no currentSong", async () => {
    const user = userEvent.setup();
    render(<LyricsModal currentSong={null} />);

    await user.click(screen.getByRole("button", { name: /Lyrics/i }));

    expect(screen.getByRole("dialog", { name: "Lyrics" })).toBeInTheDocument();
    expect(screen.queryByTestId("lyrics-section")).not.toBeInTheDocument();
  });
});