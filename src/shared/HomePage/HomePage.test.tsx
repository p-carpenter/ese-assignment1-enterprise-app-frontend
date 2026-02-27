import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { HomePage } from "./HomePage";
import { AuthProvider } from "@/shared/context/AuthContext";
import "@testing-library/jest-dom/vitest";

// Stub heavy child components so this test focuses on page composition
vi.mock("@/features/player", () => ({
  MusicPlayer: ({ onSongPlay }: { onSongPlay: () => void }) => (
    <div data-testid="music-player">
      <button onClick={onSongPlay}>Trigger Song Play</button>
    </div>
  ),
  PlayHistory: ({ keyTrigger }: { keyTrigger: number }) => (
    <div data-testid="play-history">trigger:{keyTrigger}</div>
  ),
}));

vi.mock("@/shared/layout", () => ({
  Header: () => <div data-testid="header">Header</div>,
}));

vi.mock("@/features/songs", () => ({
  SongLibrary: () => <div data-testid="song-library">Song Library</div>,
}));

describe("HomePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the Header", () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <HomePage />
        </AuthProvider>
      </MemoryRouter>,
    );
    expect(screen.getByTestId("header")).toBeInTheDocument();
  });

  it("renders the MusicPlayer", () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <HomePage />
        </AuthProvider>
      </MemoryRouter>,
    );
    expect(screen.getByTestId("music-player")).toBeInTheDocument();
  });

  it("renders the PlayHistory panel", () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <HomePage />
        </AuthProvider>
      </MemoryRouter>,
    );
    expect(screen.getByTestId("play-history")).toBeInTheDocument();
  });

  it("initialises PlayHistory with keyTrigger=0", () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <HomePage />
        </AuthProvider>
      </MemoryRouter>,
    );
    expect(screen.getByTestId("play-history")).toHaveTextContent("trigger:0");
  });

  it("increments the PlayHistory keyTrigger when a song is played", async () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <HomePage />
        </AuthProvider>
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole("button", { name: /trigger song play/i }));

    await waitFor(() => {
      expect(screen.getByTestId("play-history")).toHaveTextContent("trigger:1");
    });

    fireEvent.click(screen.getByRole("button", { name: /trigger song play/i }));

    await waitFor(() => {
      expect(screen.getByTestId("play-history")).toHaveTextContent("trigger:2");
    });
  });
});
