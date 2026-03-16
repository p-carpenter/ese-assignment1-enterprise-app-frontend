import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
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
          onMp3Upload={() => {}}
        />,
      );
      expect(screen.getByText(/audio file ready/i)).toBeInTheDocument();
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

  describe("form submission and validation", () => {
    describe("validation", () => {
      it("shows validation errors when submitting empty required fields", async () => {
        const user = userEvent.setup();
        const onSubmit = vi.fn();
        render(<SongDetailsForm onSubmit={onSubmit} />);

        await user.click(screen.getByRole("button", { name: /save song/i }));

        expect(
          await screen.findByText(/title is required/i),
        ).toBeInTheDocument();
        expect(
          await screen.findByText(/artist is required/i),
        ).toBeInTheDocument();
        expect(onSubmit).not.toHaveBeenCalled();
      });
    });

    describe("submit payload", () => {
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
              releaseYear: "",
            },
            expect.anything(),
          );
        });
      });
    });

    describe("file uploads", () => {
      it("calls onCoverArtUpload when an image file is selected", async () => {
        const user = userEvent.setup();
        const onCoverArtUpload = vi.fn();
        render(
          <SongDetailsForm
            onSubmit={noop}
            onCoverArtUpload={onCoverArtUpload}
          />,
        );

        const imageFile = new File(["img"], "cover.jpg", {
          type: "image/jpeg",
        });
        const imageInput = document.querySelector(
          'input[accept="image/*"]',
        ) as HTMLInputElement;

        await user.upload(imageInput, imageFile);

        expect(onCoverArtUpload).toHaveBeenCalledWith(imageFile);
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

        const audioFile = new File(["audio"], "song.mp3", {
          type: "audio/mp3",
        });
        const audioInput = document.querySelector(
          'input[accept="audio/*"]',
        ) as HTMLInputElement;

        await user.upload(audioInput, audioFile);

        expect(onMp3Upload).toHaveBeenCalledWith(audioFile);
      });
    });
  });
});
