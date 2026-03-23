import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { CreateNewPlaylistModal } from "./CreateNewPlaylistModal";
import type { ReactNode } from "react";
import type { PlaylistFormValues } from "./CreateNewPlaylistForm/schema";
import { server } from "@/mocks/server";
import { http, HttpResponse } from "msw";
import { resetHandlerState } from "@/mocks/handlers";

const mockNavigate = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual =
    await vi.importActual<typeof import("react-router-dom")>(
      "react-router-dom",
    );
  return { ...actual, useNavigate: () => mockNavigate };
});

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
      <button
        onClick={() =>
          props.onSubmit({
            title: "New Playlist",
            description: "",
            is_public: true,
            is_collaborative: false,
          })
        }
      >
        Submit Form
      </button>
    </div>
  ),
}));

const renderComponent = (props = {}) => {
  const queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <CreateNewPlaylistModal isOpen={true} onClose={vi.fn()} {...props} />
    </QueryClientProvider>,
  );
};

describe("CreateNewPlaylistModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetHandlerState();
  });

  describe("Mutation success", () => {
    it("navigates to the new playlist on success", async () => {
      renderComponent();

      fireEvent.click(screen.getByRole("button", { name: "Submit Form" }));
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith("/playlists/2");
      });
    });

    it("shows readable message on mutation error", async () => {
      server.use(
        http.post("http://localhost:8000/api/playlists/", () =>
          HttpResponse.json(
            { detail: "Title already exists" },
            { status: 400 },
          ),
        ),
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
      server.use(
        http.post("http://localhost:8000/api/playlists/", () =>
          HttpResponse.error(),
        ),
      );
      renderComponent();

      fireEvent.click(screen.getByRole("button", { name: "Submit Form" }));
      await waitFor(() => {
        expect(screen.getByTestId("form-error")).toHaveTextContent(
          "Failed to create playlist. Please try again.",
        );
      });
    });
  });
});
