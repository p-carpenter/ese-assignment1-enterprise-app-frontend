import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { EditSongModal } from "./components/EditSongModal/EditSongModal";
import { useCloudinaryUpload } from "@/shared/hooks";
import { SongUploadForm } from "@/features/songs";
import { SongLibrary } from "@/features/songs";
import { useNavigate } from "react-router-dom";
import {
  usePlayer,
  type PlayerContextType,
} from "@/shared/context/PlayerContext";
import { server } from "@/mocks/server";
import { http, HttpResponse, delay } from "msw";
import { resetHandlerState } from "@/mocks/handlers";
import { type Song } from "@/features/songs/types";
import { createMockPlayer } from "@/test/factories/player";
import { AuthProvider, useAuth } from "@/shared/context";

vi.mock("@/shared/hooks", () => ({
  useCloudinaryUpload: vi.fn(),
}));

vi.mock("react-router-dom", async () => {
  const actual =
    await vi.importActual<typeof import("react-router-dom")>(
      "react-router-dom",
    );
  return { ...actual, useNavigate: vi.fn() };
});

vi.mock("@/shared/context/PlayerContext", () => ({
  usePlayer: vi.fn(),
}));

vi.mock("@/shared/context/AuthContext", () => ({
  useAuth: vi.fn(),
  AuthProvider: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
}));

const mockedUseCloudinary = vi.mocked(useCloudinaryUpload);
const mockedUsePlayer = vi.mocked(usePlayer);
const mockedUseAuth = vi.mocked(useAuth);

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

const renderLibrary = (searchQuery = "") => {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <MemoryRouter
          initialEntries={[
            searchQuery ? `/?q=${encodeURIComponent(searchQuery)}` : "/",
          ]}
        >
          <SongLibrary />
        </MemoryRouter>
      </AuthProvider>
    </QueryClientProvider>,
  );
};

describe("Song management", () => {
  let mockPlaySong: PlayerContextType["playSong"];
  let navigateMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.resetAllMocks();
    resetHandlerState();

    mockedUseAuth.mockReturnValue({
      user: { id: 1, username: "testuser", email: "test@test.com" },
    } as ReturnType<typeof useAuth>);

    navigateMock = vi.fn();
    (useNavigate as unknown as ReturnType<typeof vi.fn>).mockReturnValue(
      navigateMock,
    );

    mockPlaySong = vi
      .fn()
      .mockResolvedValue(undefined) as unknown as PlayerContextType["playSong"];
    mockedUsePlayer.mockReturnValue(
      createMockPlayer({ playSong: mockPlaySong }),
    );

    mockedUseCloudinary.mockReturnValue({
      upload: vi.fn().mockResolvedValue({
        secure_url: "http://audio.url/song.mp3",
        duration: 123,
      }),
      isUploading: false,
      error: null,
    });
  });

  describe("read", () => {
    it("renders the list of songs fetched from the API", async () => {
      renderLibrary();
      expect(await screen.findByText("Skyline")).toBeInTheDocument();
      expect(screen.getByText("Sunset")).toBeInTheDocument();
      expect(screen.getByText("Nova")).toBeInTheDocument();
      expect(screen.getByText("Wave")).toBeInTheDocument();
    });
  });

  describe("create", () => {
    it("uploads a song and navigates home", async () => {
      render(
        <QueryClientProvider client={createTestQueryClient()}>
          <MemoryRouter>
            <SongUploadForm />
          </MemoryRouter>
        </QueryClientProvider>,
      );

      fireEvent.change(screen.getByPlaceholderText("Title"), {
        target: { value: "Test Song" },
      });
      fireEvent.change(screen.getByPlaceholderText("Artist"), {
        target: { value: "Test Artist" },
      });

      const file = new File(["dummy"], "test.mp3", { type: "audio/mp3" });
      const audioInput = document.querySelector(
        'input[accept="audio/*"]',
      ) as HTMLInputElement;
      fireEvent.change(audioInput, { target: { files: [file] } });

      expect(await screen.findByText("✓ test.mp3")).toBeInTheDocument();

      fireEvent.click(screen.getByRole("button", { name: /save song/i }));

      await waitFor(() => {
        expect(navigateMock).toHaveBeenCalledWith("/");
      });
    });
  });

  describe("update", () => {
    it("updates a song and triggers callbacks", async () => {
      const onSongUpdated = vi.fn();
      const onClose = vi.fn();

      render(
        <QueryClientProvider client={createTestQueryClient()}>
          <EditSongModal
            song={{
              id: 1,
              title: "Skyline",
              artist: "Nova",
              file_url: "url",
              cover_art_url: "url",
              duration: 160,
              uploaded_at: "2024-01-01",
            }}
            isOpen={true}
            onClose={onClose}
            onSongUpdated={onSongUpdated}
          />
        </QueryClientProvider>,
      );

      fireEvent.change(screen.getByPlaceholderText("Title"), {
        target: { value: "New Title" },
      });
      fireEvent.change(screen.getByPlaceholderText("Artist"), {
        target: { value: "New Artist" },
      });

      fireEvent.click(screen.getByRole("button", { name: /save song/i }));

      await waitFor(() => {
        expect(onSongUpdated).toHaveBeenCalled();
        expect(onClose).toHaveBeenCalled();
      });
    });
  });

  describe("delete", () => {
    it("calls delete endpoint and removes the song from the rendered list", async () => {
      renderLibrary();
      await screen.findByText("Skyline");

      const moreButtons = screen.getAllByRole("button");
      fireEvent.click(moreButtons[0]);

      const deleteOption = await screen.findByText("Delete");
      fireEvent.click(deleteOption);

      await waitFor(() => {
        expect(screen.queryByText("Skyline")).not.toBeInTheDocument();
      });
      expect(screen.getByText("Sunset")).toBeInTheDocument();
    });

    it("keeps the song list intact when delete fails", async () => {
      server.use(
        http.delete(
          "http://localhost:8000/api/songs/1/",
          () => new HttpResponse(null, { status: 500 }),
        ),
      );

      renderLibrary();
      await screen.findByText("Skyline");

      fireEvent.click(screen.getAllByRole("button")[0]);
      fireEvent.click(await screen.findByText("Delete"));

      await waitFor(() => {
        expect(screen.getByRole("alert")).toBeInTheDocument();
      });
      expect(screen.getByText("Skyline")).toBeInTheDocument();
    });
  });

  describe("SongLibrary – display", () => {
    it("shows the correct track count from the API response", async () => {
      renderLibrary();
      expect(
        await screen.findByText(/library \(2 tracks\)/i),
      ).toBeInTheDocument();
    });

    it("renders an empty library with 0 tracks", async () => {
      server.use(
        http.get("http://localhost:8000/api/songs/", () =>
          HttpResponse.json({ count: 0, results: [] }),
        ),
      );
      renderLibrary();
      expect(
        await screen.findByText(/library \(0 tracks\)/i),
      ).toBeInTheDocument();
    });

    it("highlights the currently-playing song", async () => {
      mockedUsePlayer.mockReturnValue(
        createMockPlayer({
          playSong: mockPlaySong,
          currentSong: { id: 1, title: "Skyline" } as Song,
        }),
      );
      const { container } = renderLibrary();
      await screen.findByText("Skyline");
      const firstItem = container.querySelector("li");
      expect(firstItem?.className).toMatch(/songItemActive/);
    });
  });

  describe("SongLibrary – pagination", () => {
    it("shows a loading indicator while a fetch is in progress", async () => {
      server.use(
        http.get("http://localhost:8000/api/songs/", async () => {
          await delay("infinite");
          return HttpResponse.json({});
        }),
      );

      renderLibrary();
      expect(screen.getByText("Loading...")).toBeInTheDocument();
    });

    it("handles an API error on initial load gracefully", async () => {
      server.use(
        http.get(
          "http://localhost:8000/api/songs/",
          () => new HttpResponse(null, { status: 500 }),
        ),
      );
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      renderLibrary();

      await waitFor(() => expect(consoleSpy).toHaveBeenCalled());
      consoleSpy.mockRestore();
    });
  });
});
