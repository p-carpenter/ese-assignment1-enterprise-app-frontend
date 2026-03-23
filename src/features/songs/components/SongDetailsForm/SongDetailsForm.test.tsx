import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SongDetailsForm } from "./SongDetailsForm";
import "@testing-library/jest-dom/vitest";

vi.mock("@/shared/components/AlertMessage/AlertMessage", () => ({
  AlertMessage: ({ message }: { message?: string | null }) =>
    message ? <div>{message}</div> : null,
}));

describe("SongDetailsForm", () => {
  const noop = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("rendering", () => {
    it("renders Title and Artist inputs", () => {
      render(<SongDetailsForm onSubmit={noop} />);
      expect(screen.getByPlaceholderText("Title")).toBeInTheDocument();
      expect(screen.getByPlaceholderText("Artist")).toBeInTheDocument();
    });

    it("pre-populates fields from initialValues", () => {
      render(
        <SongDetailsForm
          onSubmit={noop}
          initialValues={{ title: "My Song", artist: "My Artist" }}
        />,
      );
      expect(screen.getByPlaceholderText("Title")).toHaveValue("My Song");
      expect(screen.getByPlaceholderText("Artist")).toHaveValue("My Artist");
    });

    it("shows a cover art file input when onCoverArtUpload is provided", () => {
      render(<SongDetailsForm onSubmit={noop} onCoverArtUpload={() => {}} />);
      expect(
        document.querySelector('input[accept="image/*"]'),
      ).toBeInTheDocument();
    });

    it("does not show a cover art file input when onCoverArtUpload is omitted", () => {
      render(<SongDetailsForm onSubmit={noop} />);
      expect(document.querySelector('input[accept="image/*"]')).toBeNull();
    });

    it("shows the MP3 file input when showMp3Upload=true and onMp3Upload provided", () => {
      render(
        <SongDetailsForm
          onSubmit={noop}
          showMp3Upload={true}
          onMp3Upload={() => {}}
        />,
      );
      expect(
        document.querySelector('input[accept="audio/*"]'),
      ).toBeInTheDocument();
    });

    it("syncs uploadedCoverUrl prop into the form state and updates the image preview", () => {
      render(
        <SongDetailsForm
          onSubmit={noop}
          onCoverArtUpload={noop}
          uploadedCoverUrl="https://example.com/new-cover.jpg"
        />,
      );
      const img = screen.getByAltText("Song cover preview");
      expect(img).toHaveAttribute("src", "https://example.com/new-cover.jpg");
    });
  });

  describe("submit button state", () => {
    it("enables the submit button when showMp3Upload=false (no MP3 required)", () => {
      render(<SongDetailsForm onSubmit={noop} showMp3Upload={false} />);
      expect(
        screen.getByRole("button", { name: /save song/i }),
      ).not.toBeDisabled();
    });

    it("disables the submit button when isSubmitting=true", () => {
      render(<SongDetailsForm onSubmit={noop} isSubmitting={true} />);
      expect(screen.getByRole("button", { name: /saving/i })).toBeDisabled();
    });

    it("disables the submit button when MP3 upload is required but not yet uploaded", () => {
      render(
        <SongDetailsForm
          onSubmit={noop}
          showMp3Upload={true}
          mp3Uploaded={false}
        />,
      );
      expect(screen.getByRole("button", { name: /save song/i })).toBeDisabled();
    });

    it("syncs form values when initialValues prop changes after mount", () => {
      const { rerender } = render(
        <SongDetailsForm onSubmit={noop} initialValues={{ title: "old title" }} />,
      );
      expect(screen.getByPlaceholderText("Title")).toHaveValue("old title");

      // Simulate the parent component fetching ID3 tags and passing new props.
      rerender(
        <SongDetailsForm onSubmit={noop} initialValues={{ title: "new title" }} />,
      );
      expect(screen.getByPlaceholderText("Title")).toHaveValue("new title");
    });
  });

  describe("form submission and validation", () => {
    it("shows validation errors when submitting empty required fields", async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn();
      render(<SongDetailsForm onSubmit={onSubmit} />);

      await user.click(screen.getByRole("button", { name: /save song/i }));

      expect(await screen.findByText(/title is required/i)).toBeInTheDocument();
      expect(
        await screen.findByText(/artist is required/i),
      ).toBeInTheDocument();
      expect(onSubmit).not.toHaveBeenCalled();
    });

    it("calls onSubmit with populated values if validation passes", async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn();
      render(<SongDetailsForm onSubmit={onSubmit} />);

      await user.type(screen.getByPlaceholderText("Title"), "Test Song");
      await user.type(screen.getByPlaceholderText("Artist"), "Test Artist");
      await user.click(screen.getByRole("button", { name: /save song/i }));

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledWith(
          {
            title: "Test Song",
            artist: "Test Artist",
            album: "",
            cover_art_url: "",
            release_year: undefined,
          },
          expect.anything(),
        );
      });

    });

         it("handles empty string for release_year by stripping it to undefined", async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn();
      // Start with a value so it can be cleared.
      render(
        <SongDetailsForm 
          onSubmit={onSubmit} 
          initialValues={{ title: "T", artist: "A", release_year: 2020 }} 
        />
      );

      const yearInput = screen.getByPlaceholderText("Release Year");
      await user.clear(yearInput);

      await user.click(screen.getByRole("button", { name: /save song/i }));

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledWith(
          expect.objectContaining({ release_year: undefined }),
          expect.anything()
        );
      });
    });

    it("shows validation error if release_year is before 1200", async () => {
      const user = userEvent.setup();
      render(<SongDetailsForm onSubmit={noop} />);

      await user.type(screen.getByPlaceholderText("Release Year"), "1199");
      await user.click(screen.getByRole("button", { name: /save song/i }));

      expect(
        await screen.findByText(/release year must be 1200 or later/i),
      ).toBeInTheDocument();
    });

    it("shows validation error if release_year is in the future", async () => {
      const user = userEvent.setup();
      render(<SongDetailsForm onSubmit={noop} />);

      await user.type(screen.getByPlaceholderText("Release Year"), "3000");
      await user.click(screen.getByRole("button", { name: /save song/i }));

      expect(
        await screen.findByText(/release year cannot be in the future/i),
      ).toBeInTheDocument();
    });
  });

  describe("file uploads", () => {
    it("calls onCoverArtUpload when an image file is selected", async () => {
      const user = userEvent.setup();
      const onCoverArtUpload = vi.fn();
      render(
        <SongDetailsForm onSubmit={noop} onCoverArtUpload={onCoverArtUpload} />,
      );

      const imageFile = new File(["img"], "cover.jpg", { type: "image/jpeg" });
      const imageInput = document.querySelector(
        'input[accept="image/*"]',
      ) as HTMLInputElement;
      await user.upload(imageInput, imageFile);

      expect(onCoverArtUpload).toHaveBeenCalledWith(imageFile);
    });

    it("does nothing when cover art file selection is cancelled (null files)", () => {
      const onCoverArtUpload = vi.fn();
      render(
        <SongDetailsForm onSubmit={noop} onCoverArtUpload={onCoverArtUpload} />,
      );

      const imageInput = document.querySelector(
        'input[accept="image/*"]',
      ) as HTMLInputElement;
      fireEvent.change(imageInput, { target: { files: null } });

      expect(onCoverArtUpload).not.toHaveBeenCalled();
    });

    it("calls onMp3Upload when an audio file is selected", async () => {
      const user = userEvent.setup();
      const onMp3Upload = vi.fn();
      render(
        <SongDetailsForm
          onSubmit={noop}
          showMp3Upload={true}
          onMp3Upload={onMp3Upload}
        />,
      );

      const audioFile = new File(["audio"], "song.mp3", { type: "audio/mp3" });
      const audioInput = document.querySelector(
        'input[accept="audio/*"]',
      ) as HTMLInputElement;
      await user.upload(audioInput, audioFile);

      expect(onMp3Upload).toHaveBeenCalledWith(audioFile);
    });

    it("does nothing when audio file selection is cancelled (null files)", () => {
      const onMp3Upload = vi.fn();
      render(
        <SongDetailsForm
          onSubmit={noop}
          showMp3Upload={true}
          onMp3Upload={onMp3Upload}
        />,
      );

      const audioInput = document.querySelector(
        'input[accept="audio/*"]',
      ) as HTMLInputElement;
      fireEvent.change(audioInput, { target: { files: null } });

      expect(onMp3Upload).not.toHaveBeenCalled();
    });

    it("proxies the visible 'Change Cover Art' button click to the hidden file input", async () => {
      const user = userEvent.setup();
      render(<SongDetailsForm onSubmit={noop} onCoverArtUpload={noop} />);

      // Spy on the raw DOM click method since it's a hidden input.
      const clickSpy = vi.spyOn(HTMLInputElement.prototype, "click");
      
      await user.click(screen.getByRole("button", { name: /change cover art/i }));

      expect(clickSpy).toHaveBeenCalled();
      clickSpy.mockRestore();
    });

    it("displays the local filename and adds a checkmark when upload completes", async () => {
      const user = userEvent.setup();
      const { rerender } = render(
        <SongDetailsForm onSubmit={noop} showMp3Upload={true} onMp3Upload={noop} mp3Uploaded={false} />
      );

      const audioFile = new File(["audio"], "test-track.mp3", { type: "audio/mp3" });
      const audioInput = document.querySelector('input[accept="audio/*"]') as HTMLInputElement;
      
      await user.upload(audioInput, audioFile);

      expect(screen.getByText("test-track.mp3")).toBeInTheDocument();
      rerender(
        <SongDetailsForm onSubmit={noop} showMp3Upload={true} onMp3Upload={noop} mp3Uploaded={true} />
      );

      expect(screen.getByText("✓ test-track.mp3")).toBeInTheDocument();
    });
  });

  describe("mp3 visual states", () => {
    it("shows 'Uploading…' when mp3Uploading is true", () => {
      render(
        <SongDetailsForm
          onSubmit={noop}
          showMp3Upload={true}
          onMp3Upload={noop}
          mp3Uploading={true}
        />,
      );
      expect(screen.getByText("Uploading…")).toBeInTheDocument();
      expect(document.querySelector('input[accept="audio/*"]')).toBeDisabled();
    });

    it("shows '✓ Audio file ready' and updates label when mp3Uploaded is true", () => {
      render(
        <SongDetailsForm
          onSubmit={noop}
          showMp3Upload={true}
          onMp3Upload={noop}
          mp3Uploaded={true}
        />,
      );
      expect(screen.getByText("✓ Audio file ready")).toBeInTheDocument();
      expect(screen.getByText("✓ Change MP3")).toBeInTheDocument();
    });

    it("shows 'Uploading…' and disables button when coverArtUploading is true", () => {
      render(
        <SongDetailsForm onSubmit={noop} onCoverArtUpload={noop} coverArtUploading={true} />
      );
      
      const btn = screen.getByRole("button", { name: "Uploading…" });
      expect(btn).toBeInTheDocument();
      expect(btn).toBeDisabled();
    });
  });
});
