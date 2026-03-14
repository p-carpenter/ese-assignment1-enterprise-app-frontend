import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { CreateNewPlaylistForm } from "./CreateNewPlaylistForm";

const { mockUseCloudinaryUpload, mockUpload } = vi.hoisted(() => ({
  mockUseCloudinaryUpload: vi.fn(),
  mockUpload: vi.fn(),
}));

vi.mock("@/shared/hooks/useCloudinaryUpload", () => ({
  useCloudinaryUpload: mockUseCloudinaryUpload,
}));

describe("CreateNewPlaylistForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseCloudinaryUpload.mockReturnValue({
      upload: mockUpload,
      isUploading: false,
      error: null,
    });
  });

  it("submits the expected payload with updated fields", () => {
    const onSubmit = vi.fn();
    render(<CreateNewPlaylistForm onSubmit={onSubmit} />);

    fireEvent.change(screen.getByLabelText("Title"), {
      target: { value: "Focus Flow" },
    });
    fireEvent.change(screen.getByLabelText("Description"), {
      target: { value: "Coding playlist" },
    });

    fireEvent.click(screen.getByLabelText("Public"));
    fireEvent.click(screen.getByLabelText("Collaborative"));

    fireEvent.click(screen.getByRole("button", { name: "Create Playlist" }));

    expect(onSubmit).toHaveBeenCalledWith({
      title: "Focus Flow",
      description: "Coding playlist",
      cover_art_url: "",
      is_public: false,
      is_collaborative: true,
    });
  });

  it("disables submit and changes button text while submitting", () => {
    render(<CreateNewPlaylistForm onSubmit={vi.fn()} isSubmitting={true} />);

    const button = screen.getByRole("button", { name: "Creating..." });
    expect(button).toBeDisabled();
  });

  it("shows both form error and cover upload error", () => {
    mockUseCloudinaryUpload.mockReturnValue({
      upload: mockUpload,
      isUploading: false,
      error: "Upload failed",
    });

    render(
      <CreateNewPlaylistForm
        onSubmit={vi.fn()}
        error="Could not save playlist"
      />,
    );

    expect(screen.getByText("Could not save playlist")).toBeInTheDocument();
    expect(
      screen.getByText("Cover Art Error: Upload failed"),
    ).toBeInTheDocument();
  });

  it("uploads cover art and includes secure_url in submit payload", async () => {
    mockUpload.mockResolvedValue({
      secure_url: "https://img.example.com/cover.png",
    });
    const onSubmit = vi.fn();

    render(<CreateNewPlaylistForm onSubmit={onSubmit} />);

    const fileInput = screen.getByLabelText(
      "Upload Cover Art",
    ) as HTMLInputElement;
    const file = new File(["cover"], "cover.jpg", { type: "image/jpeg" });
    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(mockUpload).toHaveBeenCalledWith(file);
    });

    fireEvent.change(screen.getByLabelText("Title"), {
      target: { value: "Artful Mix" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Create Playlist" }));

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Artful Mix",
        cover_art_url: "https://img.example.com/cover.png",
      }),
    );
  });

  it("does not call upload when no file is selected", () => {
    render(<CreateNewPlaylistForm onSubmit={vi.fn()} />);

    const fileInput = screen.getByLabelText(
      "Upload Cover Art",
    ) as HTMLInputElement;
    fireEvent.change(fileInput, { target: { files: [] } });

    expect(mockUpload).not.toHaveBeenCalled();
  });

  it("keeps cover URL empty if upload resolves null", async () => {
    mockUpload.mockResolvedValue(null);
    const onSubmit = vi.fn();

    render(<CreateNewPlaylistForm onSubmit={onSubmit} />);

    const fileInput = screen.getByLabelText(
      "Upload Cover Art",
    ) as HTMLInputElement;
    const file = new File(["cover"], "cover.jpg", { type: "image/jpeg" });
    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(mockUpload).toHaveBeenCalledWith(file);
    });

    fireEvent.click(screen.getByRole("button", { name: "Create Playlist" }));
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ cover_art_url: "" }),
    );
  });
});
