import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SpotifySearch } from "./SpotifySearch";
import "@testing-library/jest-dom/vitest";

// ── Mock external dependencies ────────────────────────────────────────────────

vi.mock("../SpotifyContext", () => ({
  useSpotify: vi.fn(),
}));

vi.mock("../api", () => ({
  searchTracks: vi.fn(),
}));

vi.mock("@/features/songs/api", () => ({
  uploadSong: vi.fn(),
}));

import { useSpotify } from "../SpotifyContext";
import { searchTracks } from "../api";
import { uploadSong } from "@/features/songs/api";

const mockUseSpotify = vi.mocked(useSpotify);
const mockSearchTracks = vi.mocked(searchTracks);
const mockUploadSong = vi.mocked(uploadSong);

// ── Fixtures ──────────────────────────────────────────────────────────────────

const mockTracks = [
  {
    id: "track1",
    name: "Bohemian Rhapsody",
    uri: "spotify:track:track1",
    duration_ms: 354_000,
    artists: [{ id: "a1", name: "Queen" }],
    album: {
      id: "alb1",
      name: "A Night at the Opera",
      release_date: "1975-11-21",
      images: [
        { url: "https://img.example.com/cover64.jpg", width: 64, height: 64 },
      ],
    },
    preview_url: null,
  },
  {
    id: "track2",
    name: "We Will Rock You",
    uri: "spotify:track:track2",
    duration_ms: 122_000,
    artists: [{ id: "a1", name: "Queen" }],
    album: {
      id: "alb2",
      name: "News of the World",
      release_date: "1977-10-07",
      images: [
        { url: "https://img.example.com/cover2.jpg", width: 64, height: 64 },
      ],
    },
    preview_url: null,
  },
];

// ── Render helper ─────────────────────────────────────────────────────────────

const renderComponent = (isReady = true) => {
  mockUseSpotify.mockReturnValue({
    isReady,
    isLoading: false,
    isPlaying: false,
    duration: 0,
    getPosition: vi.fn().mockReturnValue(0),
    playTrack: vi.fn(),
    setOnTrackEnded: vi.fn(),
    pause: vi.fn(),
    resume: vi.fn(),
    seek: vi.fn(),
    setVolume: vi.fn(),
    nextTrack: vi.fn(),
    prevTrack: vi.fn(),
  });

  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

  const utils = render(
    <QueryClientProvider client={queryClient}>
      <SpotifySearch />
    </QueryClientProvider>,
  );

  return { ...utils, queryClient };
};

// ── Tests ─────────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
});

describe("SpotifySearch — status badge", () => {
  it("shows '🟢 Spotify player ready' when isReady is true", () => {
    renderComponent(true);
    expect(screen.getByText(/Spotify player ready/)).toBeInTheDocument();
  });

  it("shows '⏳ Connecting player…' when isReady is false", () => {
    renderComponent(false);
    expect(screen.getByText(/Connecting player/)).toBeInTheDocument();
  });
});

describe("SpotifySearch — search input", () => {
  it("renders the search input and Search button", () => {
    renderComponent();
    expect(screen.getByPlaceholderText(/Search Spotify/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Search" })).toBeInTheDocument();
  });

  it("disables Search button when the query is blank", () => {
    renderComponent();
    expect(screen.getByRole("button", { name: "Search" })).toBeDisabled();
  });

  it("enables Search button when the user types a query", () => {
    renderComponent();
    fireEvent.change(screen.getByPlaceholderText(/Search Spotify/i), {
      target: { value: "queen" },
    });
    expect(screen.getByRole("button", { name: "Search" })).toBeEnabled();
  });
});

describe("SpotifySearch — performing a search", () => {
  it("calls searchTracks with the trimmed query on button click", async () => {
    mockSearchTracks.mockResolvedValueOnce([]);
    renderComponent();

    fireEvent.change(screen.getByPlaceholderText(/Search Spotify/i), {
      target: { value: "  queen  " },
    });
    fireEvent.click(screen.getByRole("button", { name: "Search" }));

    await waitFor(() => expect(mockSearchTracks).toHaveBeenCalledWith("queen"));
  });

  it("calls searchTracks when the user presses Enter", async () => {
    mockSearchTracks.mockResolvedValueOnce([]);
    renderComponent();

    const input = screen.getByPlaceholderText(/Search Spotify/i);
    fireEvent.change(input, { target: { value: "david bowie" } });
    fireEvent.keyDown(input, { key: "Enter" });

    await waitFor(() =>
      expect(mockSearchTracks).toHaveBeenCalledWith("david bowie"),
    );
  });

  it("renders a result row for each returned track", async () => {
    mockSearchTracks.mockResolvedValueOnce(mockTracks);
    renderComponent();

    fireEvent.change(screen.getByPlaceholderText(/Search Spotify/i), {
      target: { value: "queen" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Search" }));

    expect(await screen.findByText("Bohemian Rhapsody")).toBeInTheDocument();
    expect(screen.getByText("We Will Rock You")).toBeInTheDocument();
  });

  it("shows the artist and album in the result row", async () => {
    mockSearchTracks.mockResolvedValueOnce([mockTracks[0]]);
    renderComponent();

    fireEvent.change(screen.getByPlaceholderText(/Search Spotify/i), {
      target: { value: "queen" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Search" }));

    expect(await screen.findByText(/Queen/)).toBeInTheDocument();
    expect(screen.getByText(/A Night at the Opera/)).toBeInTheDocument();
  });

  it("shows an error message when searchTracks rejects", async () => {
    mockSearchTracks.mockRejectedValueOnce(
      new Error("Search failed. Try again."),
    );
    renderComponent();

    fireEvent.change(screen.getByPlaceholderText(/Search Spotify/i), {
      target: { value: "queen" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Search" }));

    expect(
      await screen.findByText(/Search failed\. Try again\./),
    ).toBeInTheDocument();
  });

  it("shows '…' on the Search button while the search is in progress", async () => {
    mockSearchTracks.mockReturnValueOnce(new Promise(() => {}));
    renderComponent();

    fireEvent.change(screen.getByPlaceholderText(/Search Spotify/i), {
      target: { value: "queen" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Search" }));

    expect(await screen.findByRole("button", { name: "…" })).toBeDisabled();
  });

  it("replaces old results with new ones on a subsequent search", async () => {
    mockSearchTracks.mockResolvedValueOnce([mockTracks[0]]);
    renderComponent();

    fireEvent.change(screen.getByPlaceholderText(/Search Spotify/i), {
      target: { value: "queen" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Search" }));
    await screen.findByText("Bohemian Rhapsody");

    mockSearchTracks.mockResolvedValueOnce([mockTracks[1]]);
    fireEvent.change(screen.getByPlaceholderText(/Search Spotify/i), {
      target: { value: "bowie" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Search" }));

    expect(await screen.findByText("We Will Rock You")).toBeInTheDocument();
    expect(screen.queryByText("Bohemian Rhapsody")).not.toBeInTheDocument();
  });
});

describe("SpotifySearch — adding a track to the library", () => {
  it("calls uploadSong with a correctly-shaped payload on Add", async () => {
    mockUploadSong.mockResolvedValueOnce({} as never);
    mockSearchTracks.mockResolvedValueOnce([mockTracks[0]]);
    renderComponent();

    fireEvent.change(screen.getByPlaceholderText(/Search Spotify/i), {
      target: { value: "queen" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Search" }));
    await screen.findByText("Bohemian Rhapsody");

    fireEvent.click(screen.getByRole("button", { name: "Add" }));

    await waitFor(() =>
      expect(mockUploadSong).toHaveBeenCalledWith({
        title: "Bohemian Rhapsody",
        artist: "Queen",
        album: "A Night at the Opera",
        release_year: "1975",
        file_url: "http://googleusercontent.com/spotify.com/track1",
        cover_art_url: "https://img.example.com/cover64.jpg",
        duration: 354,
      }),
    );
  });

  it("shows 'Adding…' while the upload is in-flight", async () => {
    mockUploadSong.mockReturnValueOnce(new Promise(() => {}));
    mockSearchTracks.mockResolvedValueOnce([mockTracks[0]]);
    renderComponent();

    fireEvent.change(screen.getByPlaceholderText(/Search Spotify/i), {
      target: { value: "queen" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Search" }));
    await screen.findByText("Bohemian Rhapsody");

    fireEvent.click(screen.getByRole("button", { name: "Add" }));

    expect(
      await screen.findByRole("button", { name: "Adding…" }),
    ).toBeDisabled();
  });

  it("shows 'Added ✓' and disables the button after a successful add", async () => {
    mockUploadSong.mockResolvedValueOnce({} as never);
    mockSearchTracks.mockResolvedValueOnce([mockTracks[0]]);

    const { queryClient } = renderComponent();

    fireEvent.change(screen.getByPlaceholderText(/Search Spotify/i), {
      target: { value: "queen" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Search" }));
    await screen.findByText("Bohemian Rhapsody");

    fireEvent.click(screen.getByRole("button", { name: "Add" }));

    queryClient.setQueryData(
      ["songs"],
      [{ file_url: "http://googleusercontent.com/spotify.com/track1" }],
    );

    expect(
      await screen.findByRole("button", { name: "Added ✓" }),
    ).toBeDisabled();
  });

  it("does not call uploadSong again once the track is marked Added", async () => {
    mockUploadSong.mockResolvedValueOnce({} as never);
    mockSearchTracks.mockResolvedValueOnce([mockTracks[0]]);
    const { queryClient } = renderComponent();

    fireEvent.change(screen.getByPlaceholderText(/Search Spotify/i), {
      target: { value: "queen" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Search" }));
    await screen.findByText("Bohemian Rhapsody");

    fireEvent.click(screen.getByRole("button", { name: "Add" }));

    queryClient.setQueryData(
      ["songs"],
      [{ file_url: "http://googleusercontent.com/spotify.com/track1" }],
    );

    await screen.findByRole("button", { name: "Added ✓" });

    fireEvent.click(screen.getByRole("button", { name: "Added ✓" }));

    expect(mockUploadSong).toHaveBeenCalledOnce();
  });

  it("resets the Add button when the upload fails", async () => {
    mockUploadSong.mockRejectedValueOnce(new Error("Server error"));
    mockSearchTracks.mockResolvedValueOnce([mockTracks[0]]);
    renderComponent();

    fireEvent.change(screen.getByPlaceholderText(/Search Spotify/i), {
      target: { value: "queen" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Search" }));
    await screen.findByText("Bohemian Rhapsody");

    fireEvent.click(screen.getByRole("button", { name: "Add" }));

    expect(await screen.findByRole("button", { name: "Add" })).toBeEnabled();
  });
});
