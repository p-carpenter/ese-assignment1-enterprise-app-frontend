import { screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { EditSongModal } from "./EditSongModal";
import { useCloudinaryUpload } from "@/shared/hooks";
import type { ComponentProps, ReactNode } from "react";
import { SongDetailsForm } from "../SongDetailsForm/SongDetailsForm";
import { renderWithQueryClient } from "@/test/render";
import { server } from "@/mocks/server";
import { http, HttpResponse } from "msw";
import { resetHandlerState } from "@/mocks/handlers";
import { createSong } from "@/test/factories/song";

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

const baseSong = createSong({ id: 1, title: "Original", artist: "Artist" });

describe("EditSongModal", () => {
  const mockUpload = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    resetHandlerState();

    vi.mocked(useCloudinaryUpload).mockReturnValue({
      upload: mockUpload,
      isUploading: false,
      error: null,
    });
  });

  const renderComponent = (
    props: Partial<ComponentProps<typeof EditSongModal>> = {},
  ) =>
    renderWithQueryClient(
      <EditSongModal
        song={baseSong}
        isOpen={true}
        onClose={vi.fn()}
        onSongUpdated={vi.fn()}
        {...props}
      />,
    );

  it("returns null when song is null", () => {
    const { container } = renderComponent({ song: null });
    expect(container).toBeEmptyDOMElement();
  });

  it("submits updated details and triggers callbacks", async () => {
    const onClose = vi.fn();
    const onSongUpdated = vi.fn();

    renderComponent({ onClose, onSongUpdated });
    fireEvent.click(screen.getByRole("button", { name: "Submit" }));

    await waitFor(() => {
      expect(onSongUpdated).toHaveBeenCalledOnce();
      expect(onClose).toHaveBeenCalledOnce();
    });
  });

  it("handles cover art upload error natively logging it", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockUpload.mockRejectedValue(new Error("Upload failed"));

    renderComponent();
    fireEvent.click(screen.getByRole("button", { name: "Upload Cover" }));

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(
        "Cover art upload failed:",
        expect.any(Error),
      );
    });

    consoleSpy.mockRestore();
  });

  it("dismisses mutation error cleanly", async () => {
    server.use(
      http.put("http://localhost:8000/api/songs/1/", () =>
        HttpResponse.json({ detail: "Validation failed" }, { status: 400 }),
      ),
    );

    renderComponent();
    fireEvent.click(screen.getByRole("button", { name: "Submit" }));

    expect(await screen.findByTestId("error")).toHaveTextContent(
      "Validation failed",
    );

    fireEvent.click(screen.getByRole("button", { name: "Dismiss Error" }));

    await waitFor(() => {
      expect(screen.queryByTestId("error")).toBeEmptyDOMElement();
    });
  });

  it("shows upload error correctly when mutation has no error", () => {
    vi.mocked(useCloudinaryUpload).mockReturnValue({
      upload: mockUpload,
      isUploading: false,
      error: "Cloudinary is down",
    });

    renderComponent();
    expect(screen.getByTestId("error")).toHaveTextContent("Cloudinary is down");
  });
});
