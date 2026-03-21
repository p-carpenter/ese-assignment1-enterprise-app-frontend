import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { CreateNewPlaylistForm } from "./CreateNewPlaylistForm";
import "@testing-library/jest-dom/vitest";

const { mockUseCloudinaryUpload, mockUpload } = vi.hoisted(() => ({
  mockUseCloudinaryUpload: vi.fn(),
  mockUpload: vi.fn(),
}));

vi.mock("@/shared/hooks", () => ({
  useCloudinaryUpload: mockUseCloudinaryUpload,
}));

vi.mock("@/shared/components", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/shared/components")>();
  return {
    ...actual,
    AlertMessage: ({ message }: { message?: string | null }) =>
      message ? <div>{message}</div> : null,
  };
});

describe("CreateNewPlaylistForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseCloudinaryUpload.mockReturnValue({
      upload: mockUpload,
      isUploading: false,
      error: null,
    });
  });

  describe("Validation", () => {
    it("shows validation error when submitting without a title", async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn();
      render(<CreateNewPlaylistForm onSubmit={onSubmit} />);

      await user.click(screen.getByRole("button", { name: "Create Playlist" }));

      expect(
        await screen.findByText(/playlist name is required/i),
      ).toBeInTheDocument();
      expect(onSubmit).not.toHaveBeenCalled();
    });
  });

  describe("Form Submission", () => {
    it("submits the expected payload with updated fields", async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn();
      render(<CreateNewPlaylistForm onSubmit={onSubmit} />);

      await user.type(screen.getByLabelText("Title"), "Focus Flow");
      await user.type(screen.getByLabelText("Description"), "Coding playlist");

      await user.click(screen.getByLabelText("Public"));
      await user.click(screen.getByLabelText("Collaborative"));

      await user.click(screen.getByRole("button", { name: "Create Playlist" }));

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            title: "Focus Flow",
            description: "Coding playlist",
            cover_art_url: "",
            is_public: true,
            is_collaborative: true,
          }),
          expect.anything(),
        );
      });
    });

    it("submits successfully with only required fields", async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn();
      render(<CreateNewPlaylistForm onSubmit={onSubmit} />);

      await user.type(screen.getByLabelText("Title"), "Minimal Playlist");
      await user.click(screen.getByRole("button", { name: "Create Playlist" }));

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            title: "Minimal Playlist",
            description: "",
            cover_art_url: "",
            is_public: false,
            is_collaborative: false,
          }),
          expect.anything(),
        );
      });
    });

    it("disables the upload button and shows uploading state when isCoverUploading is true", async () => {
      userEvent.setup();
      // Patch the hook to simulate uploading.
      mockUseCloudinaryUpload.mockReturnValue({
        upload: mockUpload,
        isUploading: true,
        error: null,
      });
      render(<CreateNewPlaylistForm onSubmit={vi.fn()} />);
      const uploadBtn = screen.getByRole("button", {
        name: /upload cover art/i,
      });
      expect(uploadBtn).toBeDisabled();
      expect(uploadBtn).toHaveTextContent(/uploading/i);
    });
  });

  describe("UI States", () => {
    it("disables submit and changes button text while submitting", () => {
      render(<CreateNewPlaylistForm onSubmit={vi.fn()} isSubmitting={true} />);
      const button = screen.getByRole("button", { name: "Creating..." });
      expect(button).toBeDisabled();
    });

    it("disables submit while cover is uploading", () => {
      mockUseCloudinaryUpload.mockReturnValue({
        upload: mockUpload,
        isUploading: true,
        error: null,
      });
      render(<CreateNewPlaylistForm onSubmit={vi.fn()} />);
      const button = screen.getByRole("button", { name: "Create Playlist" });
      expect(button).toBeDisabled();
      expect(screen.getByText("Uploading…")).toBeInTheDocument();
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
  });

  describe("Visibility and Toggles", () => {
    it("hides the collaborative checkbox when public is false", () => {
      render(<CreateNewPlaylistForm onSubmit={vi.fn()} />);
      expect(screen.queryByLabelText("Collaborative")).not.toBeInTheDocument();
    });

    it("resets collaborative to false and hides it when public is unchecked", async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn();
      render(<CreateNewPlaylistForm onSubmit={onSubmit} />);

      await user.type(screen.getByLabelText("Title"), "My Playlist");
      await user.click(screen.getByLabelText("Public"));
      await user.click(screen.getByLabelText("Collaborative"));
      await user.click(screen.getByLabelText("Public"));

      expect(screen.queryByLabelText("Collaborative")).not.toBeInTheDocument();
      await user.click(screen.getByRole("button", { name: "Create Playlist" }));

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            is_public: false,
            is_collaborative: false,
          }),
          expect.anything(),
        );
      });
    });
  });

  describe("Cover Art Upload", () => {
    it("uploads cover art and includes secure_url in submit payload", async () => {
      const user = userEvent.setup();
      mockUpload.mockResolvedValue({
        secure_url: "https://img.example.com/cover.png",
      });
      const onSubmit = vi.fn();

      render(<CreateNewPlaylistForm onSubmit={onSubmit} />);
      const fileInput = screen.getByLabelText(
        "Upload Cover Art",
      ) as HTMLInputElement;
      const file = new File(["cover"], "cover.jpg", { type: "image/jpeg" });

      await user.upload(fileInput, file);
      await waitFor(() => expect(mockUpload).toHaveBeenCalledWith(file));

      await user.type(screen.getByLabelText("Title"), "Artful Mix");
      await user.click(screen.getByRole("button", { name: "Create Playlist" }));

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            title: "Artful Mix",
            cover_art_url: "https://img.example.com/cover.png",
          }),
          expect.anything(),
        );
      });
    });

    it("does not call upload when no file is selected", () => {
      render(<CreateNewPlaylistForm onSubmit={vi.fn()} />);
      const fileInput = screen.getByLabelText(
        "Upload Cover Art",
      ) as HTMLInputElement;
      fireEvent.change(fileInput, { target: { files: [] } });
      expect(mockUpload).not.toHaveBeenCalled();
    });

    it("maintains default empty cover_art_url if backend handles the placeholder (upload returns null)", async () => {
      const user = userEvent.setup();
      // Simulate an upload failing or returning nothing
      mockUpload.mockResolvedValue(null);
      const onSubmit = vi.fn();

      render(<CreateNewPlaylistForm onSubmit={onSubmit} />);
      const fileInput = screen.getByLabelText(
        "Upload Cover Art",
      ) as HTMLInputElement;
      const file = new File(["cover"], "cover.jpg", { type: "image/jpeg" });

      await user.upload(fileInput, file);
      await waitFor(() => expect(mockUpload).toHaveBeenCalledWith(file));

      await user.type(screen.getByLabelText("Title"), "Fallback Playlist");
      await user.click(screen.getByRole("button", { name: "Create Playlist" }));

      await waitFor(() => {
        // The frontend shouldn't send the placeholder URL, it should send the empty string
        expect(onSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            title: "Fallback Playlist",
            cover_art_url: "",
          }),
          expect.anything(),
        );
      });
    });

    it("handles thrown errors during upload without crashing the form", async () => {
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});
      const user = userEvent.setup();
      mockUpload.mockRejectedValue(new Error("Network Error"));
      const onSubmit = vi.fn();

      render(<CreateNewPlaylistForm onSubmit={onSubmit} />);
      const fileInput = screen.getByLabelText(
        "Upload Cover Art",
      ) as HTMLInputElement;
      const file = new File(["cover"], "cover.jpg", { type: "image/jpeg" });

      await user.upload(fileInput, file);
      await waitFor(() => expect(mockUpload).toHaveBeenCalledWith(file));

      expect(consoleSpy).toHaveBeenCalledWith(
        "Cover art upload failed:",
        expect.any(Error),
      );

      // Form should still be submittable with default empty cover_art_url.
      await user.type(
        screen.getByLabelText("Title"),
        "Error Recovery Playlist",
      );
      await user.click(screen.getByRole("button", { name: "Create Playlist" }));

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledWith(
          expect.objectContaining({ cover_art_url: "" }),
          expect.anything(),
        );
      });

      consoleSpy.mockRestore();
    });
  });
});
