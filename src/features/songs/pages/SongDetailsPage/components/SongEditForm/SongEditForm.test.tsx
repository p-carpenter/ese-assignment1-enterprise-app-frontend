import { screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { SongEditForm } from "./SongEditForm";
import { queryKeys } from "@/shared/lib/queryKeys";
import { renderWithQueryClient } from "@/test/render";
import { server } from "@/mocks/server";
import { http, HttpResponse, delay } from "msw";
import { resetHandlerState } from "@/mocks/handlers";
import { createSong } from "@/test/factories/song";
import { useCloudinaryUpload } from "@/shared/hooks";

vi.mock("@/shared/hooks", () => ({
  useCloudinaryUpload: vi.fn(),
}));
const mockedUseCloudinary = vi.mocked(useCloudinaryUpload);

describe("SongEditForm", () => {
  const mockOnClose = vi.fn();
  const dummySong = createSong({
    id: 1,
    title: "Old Title",
    artist: "Old Artist",
  });

  beforeEach(() => {
    vi.clearAllMocks();
    resetHandlerState();

    mockedUseCloudinary.mockReturnValue({
      upload: vi.fn(),
      isUploading: false,
      error: null,
    });
  });

  describe("form submission", () => {
    it("updates input state, executes mutation, invalidates cache and closes modal", async () => {
      const user = userEvent.setup();
      const { queryClient } = renderWithQueryClient(
        <SongEditForm song={dummySong} onClose={mockOnClose} />,
      );
      const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

      const titleInput = screen.getByPlaceholderText("Title");
      await user.clear(titleInput);
      await user.type(titleInput, "New Title");

      await user.click(screen.getByRole("button", { name: "Save" }));

      await waitFor(() => {
        expect(invalidateSpy).toHaveBeenCalledWith({
          queryKey: queryKeys.song(dummySong.id),
        });
        expect(invalidateSpy).toHaveBeenCalledWith({
          queryKey: queryKeys.allSongs,
        });
        expect(mockOnClose).toHaveBeenCalled();
      });
    });
    it("closes without saving if no fields were modified", async () => {
      const user = userEvent.setup();
      renderWithQueryClient(
        <SongEditForm song={dummySong} onClose={mockOnClose} />,
      );

      await user.click(screen.getByRole("button", { name: "Save" }));

      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled();
      });
    });
    it("uploads a new cover and updates the form state", async () => {
      const mockUpload = vi
        .fn()
        .mockResolvedValue({ secure_url: "http://new-cover.jpg" });
      mockedUseCloudinary.mockReturnValue({
        upload: mockUpload,
        isUploading: false,
        error: null,
      });

      renderWithQueryClient(
        <SongEditForm song={dummySong} onClose={mockOnClose} />,
      );

      const fileInput = screen.getByLabelText("Upload cover image file");
      const file = new File(["dummy"], "cover.jpg", { type: "image/jpeg" });

      fireEvent.change(fileInput, { target: { files: [file] } });

      await waitFor(() => {
        expect(mockUpload).toHaveBeenCalledWith(file);
      });

      const img = screen.getByRole("img", { name: "Song cover art" });
      await waitFor(() => {
        expect(img).toHaveAttribute("src", "http://new-cover.jpg");
      });
    });

    describe("mutation lifecycle", () => {
      it("disables save button and shows saving label while mutation is pending", async () => {
        server.use(
          http.put("http://localhost:8000/api/songs/1/", async () => {
            await delay("infinite");
            return HttpResponse.json({});
          }),
        );

        const user = userEvent.setup();
        renderWithQueryClient(
          <SongEditForm song={dummySong} onClose={mockOnClose} />,
        );

        const titleInput = screen.getByPlaceholderText("Title");
        await user.clear(titleInput);
        await user.type(titleInput, "Changed Title");
        await user.click(screen.getByRole("button", { name: "Save" }));

        await waitFor(() => {
          const saveBtn = screen.getByRole("button", { name: "Save" });
          expect(saveBtn).toBeDisabled();
          expect(saveBtn).toHaveTextContent(/saving/i);
        });
      });
    });

    describe("errors and cancellation", () => {
      it("shows readable API error message when save fails", async () => {
        server.use(
          http.put("http://localhost:8000/api/songs/1/", () =>
            HttpResponse.json({ title: ["Title is invalid"] }, { status: 400 }),
          ),
        );

        const user = userEvent.setup();
        renderWithQueryClient(
          <SongEditForm song={dummySong} onClose={mockOnClose} />,
        );

        const titleInput = screen.getByPlaceholderText("Title");
        await user.clear(titleInput);
        await user.type(titleInput, "Bad Title");
        await user.click(screen.getByRole("button", { name: "Save" }));

        expect(
          await screen.findByText(/Title is invalid/i),
        ).toBeInTheDocument();
      });

      it("calls onClose when cancel is clicked", async () => {
        const user = userEvent.setup();
        renderWithQueryClient(
          <SongEditForm song={dummySong} onClose={mockOnClose} />,
        );

        await user.click(screen.getByRole("button", { name: "Cancel" }));
        expect(mockOnClose).toHaveBeenCalled();
      });
    });

    it("does nothing if file input is cleared without a file", () => {
      mockedUseCloudinary.mockReturnValue({
        upload: vi.fn(),
        isUploading: false,
        error: null,
      });

      renderWithQueryClient(
        <SongEditForm song={dummySong} onClose={mockOnClose} />,
      );
      const fileInput = screen.getByLabelText("Upload cover image file");

      fireEvent.change(fileInput, { target: { files: [] } });
      expect(mockedUseCloudinary().upload).not.toHaveBeenCalled();
    });
  });
});
