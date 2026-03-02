import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { SongDetailsForm } from "./SongDetailsForm";
import "@testing-library/jest-dom/vitest";

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

    it("does not show the MP3 file input when showMp3Upload=false (default)", () => {
      render(<SongDetailsForm onSubmit={noop} />);
      expect(document.querySelector('input[accept="audio/*"]')).toBeNull();
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

    it("shows '✓ Audio file ready' when mp3Uploaded=true", () => {
      render(
        <SongDetailsForm
          onSubmit={noop}
          showMp3Upload={true}
          mp3Uploaded={true}
        />,
      );
      expect(screen.getByText(/audio file ready/i)).toBeInTheDocument();
    });

    it("renders an error message when error prop is set", () => {
      render(<SongDetailsForm onSubmit={noop} error="Something went wrong" />);
      expect(screen.getByText("Something went wrong")).toBeInTheDocument();
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
      expect(screen.getByRole("button")).toBeDisabled();
    });

    it("disables the submit button when showMp3Upload=true and mp3Uploaded=false", () => {
      render(
        <SongDetailsForm
          onSubmit={noop}
          showMp3Upload={true}
          mp3Uploaded={false}
        />,
      );
      expect(screen.getByRole("button", { name: /save song/i })).toBeDisabled();
    });

    it("enables the submit button when showMp3Upload=true and mp3Uploaded=true", () => {
      render(
        <SongDetailsForm
          onSubmit={noop}
          showMp3Upload={true}
          mp3Uploaded={true}
        />,
      );
      expect(
        screen.getByRole("button", { name: /save song/i }),
      ).not.toBeDisabled();
    });
  });

  describe("form submission", () => {
    it("calls onSubmit with title and artist by default", () => {
      const onSubmit = vi.fn();
      render(<SongDetailsForm onSubmit={onSubmit} />);

      fireEvent.change(screen.getByPlaceholderText("Title"), {
        target: { value: "Test Song" },
      });
      fireEvent.change(screen.getByPlaceholderText("Artist"), {
        target: { value: "Test Artist" },
      });
      fireEvent.click(screen.getByRole("button", { name: /save song/i }));

      expect(onSubmit).toHaveBeenCalledWith({
        title: "Test Song",
        artist: "Test Artist",
        album: "",
        genre: "",
        releaseYear: "",
      });
    });

    it("calls onCoverArtUpload when an image file is selected", () => {
      const onCoverArtUpload = vi.fn();
      render(
        <SongDetailsForm onSubmit={noop} onCoverArtUpload={onCoverArtUpload} />,
      );

      const imageFile = new File(["img"], "cover.jpg", { type: "image/jpeg" });
      const imageInput = document.querySelector(
        'input[accept="image/*"]',
      ) as HTMLInputElement;
      fireEvent.change(imageInput, { target: { files: [imageFile] } });

      expect(onCoverArtUpload).toHaveBeenCalledWith(imageFile);
    });

    it("calls onMp3Upload when an audio file is selected", () => {
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
      fireEvent.change(audioInput, { target: { files: [audioFile] } });

      expect(onMp3Upload).toHaveBeenCalledWith(audioFile);
    });
  });
});
