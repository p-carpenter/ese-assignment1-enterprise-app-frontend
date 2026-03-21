import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { CreateNewPlaylistModal } from "./CreateNewPlaylistModal";
import { ApiError } from "@/shared/api/errors";
import type { Playlist } from "../types";
import * as api from "@/features/playlists/api";
import type { ReactNode } from "react";
import type { PlaylistFormValues } from "./CreateNewPlaylistForm/schema";

const mockNavigate = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual =
    await vi.importActual<typeof import("react-router-dom")>(
      "react-router-dom",
    );
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock("@/features/playlists/api", () => ({ createPlaylist: vi.fn() }));

vi.mock("@/shared/components/Modal/Modal", () => ({
  Modal: ({ isOpen, children }: { isOpen: boolean; children: ReactNode }) =>
    isOpen ? <div data-testid="modal">{children}</div> : null,
}));

vi.mock("./CreateNewPlaylistForm/CreateNewPlaylistForm", () => ({
  CreateNewPlaylistForm: (props: {
    error?: string | null;
    isSubmitting: boolean;
    onSubmit: (data: PlaylistFormValues) => void;
  }) => (
    <div>
      <div data-testid="form-error">{props.error}</div>
      <div data-testid="is-submitting">{String(props.isSubmitting)}</div>
      <button
        onClick={() =>
          props.onSubmit({
            title: "New Playlist",
            description: "desc",
            is_public: true,
            is_collaborative: false,
            cover_art_url: "",
          })
        }
      >
        Submit Form
      </button>
    </div>
  ),
}));

const createdPlaylist: Playlist = {
  id: 99,
  title: "New Playlist",
  description: "desc",
  is_public: true,
  is_collaborative: false,
  cover_art_url: null,
  owner: { id: 1, username: "owner" },
  songs: [],
};

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

describe("CreateNewPlaylistModal", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = createTestQueryClient();
    vi.spyOn(queryClient, "invalidateQueries");
  });

  const renderComponent = (props = {}) =>
    render(
      <QueryClientProvider client={queryClient}>
        <CreateNewPlaylistModal isOpen={true} onClose={vi.fn()} {...props} />
      </QueryClientProvider>,
    );

  describe("Rendering", () => {
    it("returns null when closed", () => {
      const { container } = render(
        <QueryClientProvider client={queryClient}>
          <CreateNewPlaylistModal isOpen={false} onClose={vi.fn()} />
        </QueryClientProvider>,
      );
      expect(container).toBeEmptyDOMElement();
    });
  });

  describe("Interactions & API calls", () => {
    it("passes loading state from mutation to form and invalidates queries on success", async () => {
      const onClose = vi.fn();
      const onSuccess = vi.fn();
      let resolveMutation: (value: Playlist) => void;

      vi.mocked(api.createPlaylist).mockImplementation(
        () =>
          new Promise((resolve) => {
            resolveMutation = resolve;
          }),
      );

      renderComponent({ onClose, onSuccess });
      fireEvent.click(screen.getByRole("button", { name: "Submit Form" }));

      await waitFor(() => {
        expect(screen.getByTestId("is-submitting")).toHaveTextContent("true");
      });

      resolveMutation!(createdPlaylist);

      await waitFor(() => {
        expect(queryClient.invalidateQueries).toHaveBeenCalledWith({
          queryKey: ["playlists"],
        });
        expect(onClose).toHaveBeenCalledOnce();
        expect(onSuccess).toHaveBeenCalledWith(createdPlaylist);
        expect(mockNavigate).not.toHaveBeenCalled();
      });
    });

    it("navigates to playlist details when onSuccess callback is not provided", async () => {
      vi.mocked(api.createPlaylist).mockResolvedValue(createdPlaylist);
      renderComponent();

      fireEvent.click(screen.getByRole("button", { name: "Submit Form" }));
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith("/playlists/99");
      });
    });

    it("shows ApiError readable message on mutation error", async () => {
      vi.mocked(api.createPlaylist).mockRejectedValue(
        new ApiError(400, { detail: "Title already exists" }),
      );
      renderComponent();

      fireEvent.click(screen.getByRole("button", { name: "Submit Form" }));
      await waitFor(() => {
        expect(screen.getByTestId("form-error")).toHaveTextContent(
          "Title already exists",
        );
      });
    });

    it("shows generic message for unexpected mutation errors", async () => {
      vi.mocked(api.createPlaylist).mockRejectedValue(new Error("boom"));
      renderComponent();

      fireEvent.click(screen.getByRole("button", { name: "Submit Form" }));
      await waitFor(() => {
        expect(screen.getByTestId("form-error")).toHaveTextContent(
          "Failed to create playlist. Please try again.",
        );
      });
    });

    it("shows fallback error message if error is not ApiError", async () => {
      vi.mocked(api.createPlaylist).mockRejectedValue("not-an-error-object");
      renderComponent();

      fireEvent.click(screen.getByText("Submit Form"));
      await waitFor(() => {
        expect(screen.getByTestId("form-error")).toHaveTextContent(
          /unexpected error|failed/i,
        );
      });
    });
  });
});
