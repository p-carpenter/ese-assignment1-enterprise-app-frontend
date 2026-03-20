import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { EditSongModal } from "./EditSongModal";
import type { Song } from "../../types";
import { ApiError } from "@/shared/api/errors";
import * as api from "../../api";
import { useCloudinaryUpload } from "@/shared/hooks";
import type { ComponentProps, ReactNode } from "react";
import { SongDetailsForm } from "../SongDetailsForm/SongDetailsForm";

vi.mock("../../api", () => ({
  updateSong: vi.fn(),
}));

vi.mock("@/shared/hooks", () => ({
  useCloudinaryUpload: vi.fn(),
}));

vi.mock("@/shared/components/Modal/Modal", () => ({
  Modal: ({ isOpen, children }: { isOpen: boolean; children: ReactNode }) =>
    isOpen ? <div data-testid="modal">{children}</div> : null,
}));

vi.mock("../SongDetailsForm/SongDetailsForm", () => ({
  SongDetailsForm: (props: ComponentProps<typeof SongDetailsForm>) => (
    <div>
      <div data-testid="title">{props.initialValues?.title}</div>
      <div data-testid="artist">{props.initialValues?.artist}</div>
      <div data-testid="error">{props.error}</div>
      <div data-testid="submitting">{String(props.isSubmitting)}</div>
      <button
        onClick={() =>
          props.onSubmit({
            title: "Updated title",
            artist: "Updated artist",
            album: "Updated album",
            release_year: 2023,
            cover_art_url: props.initialValues?.cover_art_url || "",
          })
        }
      >
        Submit
      </button>
      <button
        onClick={() =>
          props.onCoverArtUpload?.(
            new File(["cover"], "cover.jpg", { type: "image/jpeg" }),
          )
        }
      >
        Upload Cover
      </button>
      <button onClick={props.onErrorDismiss}>Dismiss Error</button>
    </div>
  ),
}));

const baseSong: Song = {
  id: 7,
  title: "Original",
  artist: "Artist",
  file_url: "https://example.com/song.mp3",
  cover_art_url: "https://example.com/old-cover.jpg",
  duration: 210,
  uploaded_at: "2024-02-01T00:00:00Z",
};

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

describe("EditSongModal", () => {
  let queryClient: QueryClient;
  const mockUpload = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = createTestQueryClient();
    vi.spyOn(queryClient, "invalidateQueries");

    vi.mocked(useCloudinaryUpload).mockReturnValue({
      upload: mockUpload,
      isUploading: false,
      error: null,
    });
  });

  const renderComponent = (
    props: Partial<ComponentProps<typeof EditSongModal>> = {},
  ) =>
    render(
      <QueryClientProvider client={queryClient}>
        <EditSongModal
          song={baseSong}
          isOpen={true}
          onClose={vi.fn()}
          onSongUpdated={vi.fn()}
          {...props}
        />
      </QueryClientProvider>,
    );

  it("returns null when song is null", () => {
    const { container } = renderComponent({ song: null });
    expect(container).toBeEmptyDOMElement();
  });

  it("renders SongDetailsForm with song initial values", () => {
    renderComponent();
    expect(screen.getByTestId("title")).toHaveTextContent("Original");
    expect(screen.getByTestId("artist")).toHaveTextContent("Artist");
  });

  it("submits updated title and artist with existing cover URL", async () => {
    vi.mocked(api.updateSong).mockResolvedValue(baseSong);

    renderComponent();
    fireEvent.click(screen.getByRole("button", { name: "Submit" }));

    await waitFor(() => {
      expect(api.updateSong).toHaveBeenCalledWith(7, {
        title: "Updated title",
        artist: "Updated artist",
        album: "Updated album",
        release_year: 2023,
        file_url: baseSong.file_url,
        duration: baseSong.duration,
        cover_art_url: "https://example.com/old-cover.jpg",
      });
    });
  });

  it("uses newly uploaded cover art URL for submit", async () => {
    mockUpload.mockResolvedValue({
      secure_url: "https://example.com/new-cover.jpg",
    });
    vi.mocked(api.updateSong).mockResolvedValue(baseSong);

    renderComponent();

    fireEvent.click(screen.getByRole("button", { name: "Upload Cover" }));

    await waitFor(() => {
      expect(mockUpload).toHaveBeenCalled();
    });

    fireEvent.click(screen.getByRole("button", { name: "Submit" }));

    await waitFor(() => {
      expect(api.updateSong).toHaveBeenCalledWith(
        7,
        expect.objectContaining({
          cover_art_url: "https://example.com/new-cover.jpg",
        }),
      );
    });
  });

  it("runs post-success side effects (invalidate + callbacks)", async () => {
    vi.mocked(api.updateSong).mockResolvedValue(baseSong);
    const onClose = vi.fn();
    const onSongUpdated = vi.fn();

    renderComponent({ onClose, onSongUpdated });

    fireEvent.click(screen.getByRole("button", { name: "Submit" }));

    await waitFor(() => {
      expect(queryClient.invalidateQueries).toHaveBeenCalledWith({
        queryKey: ["songs"],
      });
      expect(queryClient.invalidateQueries).toHaveBeenCalledWith({
        queryKey: ["song", 7],
      });
      expect(queryClient.invalidateQueries).toHaveBeenCalledWith({
        queryKey: ["playlists"],
      });
      expect(onSongUpdated).toHaveBeenCalledOnce();
      expect(onClose).toHaveBeenCalledOnce();
    });
  });

  it("prefers ApiError readable message for form error", async () => {
    vi.mocked(api.updateSong).mockRejectedValue(
      new ApiError(400, { detail: "Validation failed" }),
    );

    renderComponent();
    fireEvent.click(screen.getByRole("button", { name: "Submit" }));

    expect(await screen.findByTestId("error")).toHaveTextContent(
      "Validation failed",
    );
  });

  it("shows upload error when mutation has no error", () => {
    vi.mocked(useCloudinaryUpload).mockReturnValue({
      upload: mockUpload,
      isUploading: false,
      error: "Upload failed",
    });

    renderComponent();
    expect(screen.getByTestId("error")).toHaveTextContent("Upload failed");
  });

  it("dismisses mutation error by calling onErrorDismiss", async () => {
    vi.mocked(api.updateSong).mockRejectedValue(new Error("Boom"));

    renderComponent();

    fireEvent.click(screen.getByRole("button", { name: "Submit" }));
    expect(await screen.findByTestId("error")).toHaveTextContent("Boom");

    fireEvent.click(screen.getByRole("button", { name: "Dismiss Error" }));

    await waitFor(() => {
      expect(screen.getByTestId("error")).toBeEmptyDOMElement();
    });
  });

  it("passes submitting state when upload is in progress", () => {
    vi.mocked(useCloudinaryUpload).mockReturnValue({
      upload: mockUpload,
      isUploading: true,
      error: null,
    });

    renderComponent();
    expect(screen.getByTestId("submitting")).toHaveTextContent("true");
  });
});
