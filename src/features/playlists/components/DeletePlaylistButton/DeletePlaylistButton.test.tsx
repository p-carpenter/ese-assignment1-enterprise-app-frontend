import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { DeletePlaylistButton } from "./DeletePlaylistButton";
import { server } from "@/mocks/server";
import { http, HttpResponse, delay } from "msw";
import { resetHandlerState } from "@/mocks/handlers";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const createQueryClient = () =>
  new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

/**
 * Renders the component inside a MemoryRouter so that `useNavigate` works.
 * A `/` route with "Home Page" text lets tests assert post-delete navigation.
 */
const renderButton = (playlistId = 1) => {
  const queryClient = createQueryClient();
  return {
    queryClient,
    ...render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={[`/playlists/${playlistId}`]}>
          <Routes>
            <Route
              path="/playlists/:id"
              element={<DeletePlaylistButton playlistId={playlistId} />}
            />
            <Route path="/" element={<div>Home Page</div>} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    ),
  };
};

describe("DeletePlaylistButton", () => {
  beforeEach(() => {
    resetHandlerState();
  });

  describe("Initial state", () => {
    it("renders the Delete button in the initial state", () => {
      renderButton();
      expect(
        screen.getByRole("button", { name: /delete playlist/i }),
      ).toBeInTheDocument();
    });

    it("does not show the confirmation UI initially", () => {
      renderButton();
      expect(screen.queryByText("Are you sure?")).not.toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: /yes, delete/i }),
      ).not.toBeInTheDocument();
    });
  });

  describe("Confirmation state", () => {
    it("shows the confirmation UI after clicking Delete", () => {
      renderButton();
      fireEvent.click(screen.getByRole("button", { name: /delete playlist/i }));
      expect(screen.getByText("Are you sure?")).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /yes, delete/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /cancel/i }),
      ).toBeInTheDocument();
    });

    it("hides the initial Delete button once confirmation is shown", () => {
      renderButton();
      fireEvent.click(screen.getByRole("button", { name: /delete playlist/i }));
      expect(
        screen.queryByRole("button", { name: /delete playlist/i }),
      ).not.toBeInTheDocument();
    });
  });

  describe("Cancel", () => {
    it("returns to the initial Delete button when Cancel is clicked", () => {
      renderButton();
      fireEvent.click(screen.getByRole("button", { name: /delete playlist/i }));
      fireEvent.click(screen.getByRole("button", { name: /cancel/i }));

      expect(
        screen.getByRole("button", { name: /delete playlist/i }),
      ).toBeInTheDocument();
      expect(screen.queryByText("Are you sure?")).not.toBeInTheDocument();
    });

    it("does not call the DELETE endpoint when Cancel is clicked", () => {
      let deleted = false;
      server.use(
        http.delete("http://localhost:8000/api/playlists/1/", () => {
          deleted = true;
          return new HttpResponse(null, { status: 204 });
        }),
      );

      renderButton();
      fireEvent.click(screen.getByRole("button", { name: /delete playlist/i }));
      fireEvent.click(screen.getByRole("button", { name: /cancel/i }));

      expect(deleted).toBe(false);
    });
  });

  describe("Successful deletion", () => {
    it("calls the DELETE endpoint when 'Yes, delete' is confirmed", async () => {
      let deleteCalled = false;
      server.use(
        http.delete("http://localhost:8000/api/playlists/1/", () => {
          deleteCalled = true;
          return new HttpResponse(null, { status: 204 });
        }),
      );

      renderButton();
      fireEvent.click(screen.getByRole("button", { name: /delete playlist/i }));
      fireEvent.click(screen.getByRole("button", { name: /yes, delete/i }));

      await waitFor(() => {
        expect(deleteCalled).toBe(true);
      });
    });

    it("navigates to '/' after a successful deletion", async () => {
      renderButton();
      fireEvent.click(screen.getByRole("button", { name: /delete playlist/i }));
      fireEvent.click(screen.getByRole("button", { name: /yes, delete/i }));

      expect(await screen.findByText("Home Page")).toBeInTheDocument();
    });
  });

  describe("Pending / loading state", () => {
    it("shows 'Deleting…' while the delete mutation is pending", async () => {
      server.use(
        http.delete("http://localhost:8000/api/playlists/1/", async () => {
          await delay(500);
          return new HttpResponse(null, { status: 204 });
        }),
      );

      renderButton();
      fireEvent.click(screen.getByRole("button", { name: /delete playlist/i }));
      fireEvent.click(screen.getByRole("button", { name: /yes, delete/i }));

      expect(await screen.findByText("Deleting…")).toBeInTheDocument();
    });

    it("disables the 'Yes, delete' button while deleting", async () => {
      server.use(
        http.delete("http://localhost:8000/api/playlists/1/", async () => {
          await delay(500);
          return new HttpResponse(null, { status: 204 });
        }),
      );

      renderButton();
      fireEvent.click(screen.getByRole("button", { name: /delete playlist/i }));
      fireEvent.click(screen.getByRole("button", { name: /yes, delete/i }));

      await waitFor(() => {
        expect(screen.getByText("Deleting…").closest("button")).toBeDisabled();
      });
    });
  });

  describe("Correct playlist ID", () => {
    it("sends the DELETE request for the correct playlist ID", async () => {
      let deletedId: string | undefined;
      server.use(
        http.delete(
          "http://localhost:8000/api/playlists/:id/",
          ({ params }) => {
            deletedId = params.id as string;
            return new HttpResponse(null, { status: 204 });
          },
        ),
      );

      renderButton(42);
      fireEvent.click(screen.getByRole("button", { name: /delete playlist/i }));
      fireEvent.click(screen.getByRole("button", { name: /yes, delete/i }));

      await waitFor(() => {
        expect(deletedId).toBe("42");
      });
    });
  });

  describe("Network error", () => {
    it("stays on the confirmation screen when the DELETE request fails", async () => {
      server.use(
        http.delete("http://localhost:8000/api/playlists/1/", () => {
          return new HttpResponse(null, { status: 500 });
        }),
      );

      renderButton();
      fireEvent.click(screen.getByRole("button", { name: /delete playlist/i }));
      fireEvent.click(screen.getByRole("button", { name: /yes, delete/i }));

      // After the failed mutation, onSuccess is not called so it shouldn't navigate.
      await waitFor(() => {
        expect(screen.queryByText("Home Page")).not.toBeInTheDocument();
      });
    });
  });
});
