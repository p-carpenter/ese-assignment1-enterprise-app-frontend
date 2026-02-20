import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { HomePage } from "./HomePage";
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
  Header: ({
    onLogout,
    avatarUrl,
  }: {
    onLogout: () => void;
    avatarUrl?: string;
  }) => (
    <div data-testid="header">
      {avatarUrl && <img src={avatarUrl} alt="avatar" />}
      <button onClick={onLogout}>Log Out</button>
    </div>
  ),
}));

describe("HomePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the Header", () => {
    render(
      <MemoryRouter>
        <HomePage onLogout={() => {}} />
      </MemoryRouter>,
    );
    expect(screen.getByTestId("header")).toBeInTheDocument();
  });

  it("renders the MusicPlayer", () => {
    render(
      <MemoryRouter>
        <HomePage onLogout={() => {}} />
      </MemoryRouter>,
    );
    expect(screen.getByTestId("music-player")).toBeInTheDocument();
  });

  it("renders the PlayHistory panel", () => {
    render(
      <MemoryRouter>
        <HomePage onLogout={() => {}} />
      </MemoryRouter>,
    );
    expect(screen.getByTestId("play-history")).toBeInTheDocument();
  });

  it("passes avatarUrl down to the Header", () => {
    render(
      <MemoryRouter>
        <HomePage
          onLogout={() => {}}
          avatarUrl="http://example.com/avatar.jpg"
        />
      </MemoryRouter>,
    );
    expect(screen.getByAltText("avatar")).toHaveAttribute(
      "src",
      "http://example.com/avatar.jpg",
    );
  });

  it("calls onLogout when the Log Out button is clicked", () => {
    const onLogout = vi.fn();
    render(
      <MemoryRouter>
        <HomePage onLogout={onLogout} />
      </MemoryRouter>,
    );
    fireEvent.click(screen.getByRole("button", { name: /log out/i }));
    expect(onLogout).toHaveBeenCalledTimes(1);
  });

  it("initialises PlayHistory with keyTrigger=0", () => {
    render(
      <MemoryRouter>
        <HomePage onLogout={() => {}} />
      </MemoryRouter>,
    );
    expect(screen.getByTestId("play-history")).toHaveTextContent("trigger:0");
  });

  it("increments the PlayHistory keyTrigger when a song is played", async () => {
    render(
      <MemoryRouter>
        <HomePage onLogout={() => {}} />
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
