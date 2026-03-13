import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "@testing-library/jest-dom/vitest";
import { SearchRow } from "./SearchRow";
import type { SpotifyTrack } from "../../types";
import { queryKeys } from "@/shared/lib/queryKeys";

// ── Fixtures ──────────────────────────────────────────────────────────────────

const mockTrack: SpotifyTrack = {
  id: "track1",
  name: "Bohemian Rhapsody",
  uri: "spotify:track:track1",
  duration_ms: 354_000,
  artists: [{ name: "Queen" }],
  album: {
    name: "A Night at the Opera",
    release_date: "1975-11-21",
    images: [
      { url: "https://img.example.com/cover300.jpg", width: 300, height: 300 },
      { url: "https://img.example.com/cover64.jpg", width: 64, height: 64 },
    ],
  },
  preview_url: null,
};

const mockTrackNoSmallCover: SpotifyTrack = {
  ...mockTrack,
  album: {
    ...mockTrack.album,
    images: [
      { url: "https://img.example.com/cover640.jpg", width: 640, height: 640 },
      { url: "https://img.example.com/cover300.jpg", width: 300, height: 300 },
    ],
  },
};

const mockTrackMultiArtist: SpotifyTrack = {
  ...mockTrack,
  artists: [{ name: "David Bowie" }, { name: "Freddie Mercury" }],
};

// ── Render helper ─────────────────────────────────────────────────────────────

const renderRow = (
  overrides: Partial<{
    track: SpotifyTrack;
    isAlreadyAdded: boolean;
    onUpload: (track: SpotifyTrack) => Promise<void>;
  }> = {},
) => {
  const onUpload = overrides.onUpload ?? vi.fn().mockResolvedValue(undefined);
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

  const utils = render(
    <QueryClientProvider client={queryClient}>
      <SearchRow
        track={overrides.track ?? mockTrack}
        isAlreadyAdded={overrides.isAlreadyAdded ?? false}
        onUpload={onUpload}
      />
    </QueryClientProvider>,
  );

  return { ...utils, queryClient, onUpload };
};

// ── Tests ─────────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
});

describe("SearchRow — rendering", () => {
  it("renders the track name", () => {
    renderRow();
    expect(screen.getByText("Bohemian Rhapsody")).toBeInTheDocument();
  });

  it("renders the artist name", () => {
    renderRow();
    expect(screen.getByText(/Queen/)).toBeInTheDocument();
  });

  it("renders multiple artists joined by a comma", () => {
    renderRow({ track: mockTrackMultiArtist });
    expect(
      screen.getByText(/David Bowie.*Freddie Mercury/),
    ).toBeInTheDocument();
  });

  it("renders the album name", () => {
    renderRow();
    expect(screen.getByText(/A Night at the Opera/)).toBeInTheDocument();
  });

  it("renders a cover image using the smallest image (width ≤ 64)", () => {
    renderRow();
    const img = screen.getByRole("img");
    expect(img).toHaveAttribute("src", "https://img.example.com/cover64.jpg");
  });

  it("falls back to the last image when none has width ≤ 64", () => {
    renderRow({ track: mockTrackNoSmallCover });
    const img = screen.getByRole("img");
    expect(img).toHaveAttribute("src", "https://img.example.com/cover300.jpg");
  });

  it("does not render an img element when the images array is empty", () => {
    const noImages: SpotifyTrack = {
      ...mockTrack,
      album: { ...mockTrack.album, images: [] },
    };
    renderRow({ track: noImages });
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });

  it("renders the 'Add' button in the default state", () => {
    renderRow();
    expect(screen.getByRole("button", { name: "Add" })).toBeInTheDocument();
  });

  it("'Add' button is enabled when isAlreadyAdded is false", () => {
    renderRow({ isAlreadyAdded: false });
    expect(screen.getByRole("button", { name: "Add" })).toBeEnabled();
  });
});

describe("SearchRow — isAlreadyAdded prop", () => {
  it("shows 'Added ✓' when isAlreadyAdded is true", () => {
    renderRow({ isAlreadyAdded: true });
    expect(screen.getByRole("button", { name: "Added ✓" })).toBeInTheDocument();
  });

  it("disables the button when isAlreadyAdded is true", () => {
    renderRow({ isAlreadyAdded: true });
    expect(screen.getByRole("button", { name: "Added ✓" })).toBeDisabled();
  });

  it("does not call onUpload when clicking a disabled 'Added ✓' button", () => {
    const onUpload = vi.fn();
    renderRow({ isAlreadyAdded: true, onUpload });
    fireEvent.click(screen.getByRole("button", { name: "Added ✓" }));
    expect(onUpload).not.toHaveBeenCalled();
  });
});

describe("SearchRow — add interaction", () => {
  it("calls onUpload with the track when Add is clicked", async () => {
    const onUpload = vi.fn().mockResolvedValue(undefined);
    renderRow({ onUpload });

    fireEvent.click(screen.getByRole("button", { name: "Add" }));

    await waitFor(() => expect(onUpload).toHaveBeenCalledWith(mockTrack));
  });

  it("shows 'Adding…' and disables the button while upload is in-flight", async () => {
    const onUpload = vi.fn().mockReturnValue(new Promise(() => {}));
    renderRow({ onUpload });

    fireEvent.click(screen.getByRole("button", { name: "Add" }));

    expect(
      await screen.findByRole("button", { name: "Adding…" }),
    ).toBeDisabled();
  });

  it("reverts to an enabled 'Add' button after a failed upload", async () => {
    const onUpload = vi.fn().mockRejectedValue(new Error("Server error"));
    renderRow({ onUpload });

    fireEvent.click(screen.getByRole("button", { name: "Add" }));

    expect(await screen.findByRole("button", { name: "Add" })).toBeEnabled();
  });

  it("logs the error to the console when the upload fails", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const error = new Error("Server error");
    const onUpload = vi.fn().mockRejectedValue(error);
    renderRow({ onUpload });

    fireEvent.click(screen.getByRole("button", { name: "Add" }));

    await waitFor(() =>
      expect(consoleSpy).toHaveBeenCalledWith("Failed to add track:", error),
    );
    consoleSpy.mockRestore();
  });

  it("invalidates the ['songs'] query on successful upload", async () => {
    const onUpload = vi.fn().mockResolvedValue(undefined);
    const { queryClient } = renderRow({ onUpload });
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    fireEvent.click(screen.getByRole("button", { name: "Add" }));

    await waitFor(() =>
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: queryKeys.allSongs,
      }),
    );
  });

  it("does not call onUpload a second time once 'Adding…' is shown", async () => {
    const onUpload = vi.fn().mockReturnValue(new Promise(() => {}));
    renderRow({ onUpload });

    fireEvent.click(screen.getByRole("button", { name: "Add" }));
    await screen.findByRole("button", { name: "Adding…" });

    // Button is disabled — a second click should be a no-op
    fireEvent.click(screen.getByRole("button", { name: "Adding…" }));

    expect(onUpload).toHaveBeenCalledOnce();
  });
});
