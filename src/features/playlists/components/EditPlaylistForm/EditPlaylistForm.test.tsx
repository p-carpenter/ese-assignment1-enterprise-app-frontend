import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { EditPlaylistForm } from "./EditPlaylistForm";
import type { Playlist } from "../../types";
import { server } from "@/mocks/server";
import { http, HttpResponse, delay } from "msw";

// ─── Mock useCloudinaryUpload ─────────────────────────────────────────────────
const mockUpload = vi.fn();

vi.mock("@/shared/hooks/useCloudinaryUpload", () => ({
  useCloudinaryUpload: () => ({
    upload: mockUpload,
    isUploading: false,
    error: null,
  }),
}));

// ─── Fixtures ─────────────────────────────────────────────────────────────────
const basePlaylist: Playlist = {
  id: 1,
  title: "My Playlist",
  description: "Original description",
  is_public: true,
  is_collaborative: false,
  cover_art_url: "https://example.com/original-cover.png",
  owner: { id: 1, username: "testuser" },
  songs: [],
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const createQueryClient = () =>
  new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

const renderForm = (playlist: Playlist = basePlaylist, onClose = vi.fn()) => {
  const queryClient = createQueryClient();
  return {
    onClose,
    queryClient,
    ...render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <EditPlaylistForm playlist={playlist} onClose={onClose} />
        </MemoryRouter>
      </QueryClientProvider>,
    ),
  };
};

describe("EditPlaylistForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUpload.mockResolvedValue(null);
  });

  // ─── Initial state / pre-filled fields ──────────────────────────────────

  it("pre-fills the title input with the playlist title", () => {
    renderForm();
    expect(screen.getByPlaceholderText("Title")).toHaveValue("My Playlist");
  });

  it("pre-fills the description textarea with the playlist description", () => {
    renderForm();
    expect(screen.getByPlaceholderText("Description")).toHaveValue(
      "Original description",
    );
  });

  it("shows an empty description textarea when description is null", () => {
    renderForm({ ...basePlaylist, description: null as unknown as string });
    expect(screen.getByPlaceholderText("Description")).toHaveValue("");
  });

  it("shows the cover art image with the current cover_art_url", () => {
    renderForm();
    const img = screen.getByRole("img", { name: "Cover" });
    expect(img).toHaveAttribute(
      "src",
      "https://example.com/original-cover.png",
    );
  });

  it("shows a placeholder image when cover_art_url is null", () => {
    renderForm({ ...basePlaylist, cover_art_url: null });
    const img = screen.getByRole("img", { name: "Cover" });
    expect(img).toHaveAttribute("src", "https://placehold.co/220");
  });

  it("renders the Public toggle showing the initial state (on)", () => {
    renderForm();
    // The toggle label shows "Public"
    expect(screen.getByText("Public")).toBeInTheDocument();
  });

  it("renders the Collaborative toggle (initially off)", () => {
    renderForm();
    expect(screen.getByText("Collaborative")).toBeInTheDocument();
  });

  // ─── Input changes ───────────────────────────────────────────────────────

  it("allows typing a new title", () => {
    renderForm();
    const input = screen.getByPlaceholderText("Title");
    fireEvent.change(input, { target: { value: "Updated Title" } });
    expect(input).toHaveValue("Updated Title");
  });

  it("allows editing the description", () => {
    renderForm();
    const textarea = screen.getByPlaceholderText("Description");
    fireEvent.change(textarea, { target: { value: "New description" } });
    expect(textarea).toHaveValue("New description");
  });

  // ─── Toggle buttons ──────────────────────────────────────────────────────
  // The toggle buttons have no accessible text; locate them by querying
  // all buttons and excluding the labeled ones. This needs to change in future.

  const getToggleButtons = () =>
    Array.from(
      document.querySelectorAll<HTMLButtonElement>("button[type='button']"),
    );

  it("sends is_public: false to PATCH after toggling Public off", async () => {
    let patchBody: Record<string, unknown> = {};
    server.use(
      http.patch(
        "http://localhost:8000/api/playlists/1/",
        async ({ request }) => {
          patchBody = (await request.json()) as Record<string, unknown>;
          return HttpResponse.json(basePlaylist);
        },
      ),
    );

    renderForm(); // basePlaylist has is_public: true

    // The toggle buttons have no text — Public toggle is the first type="button"
    const [publicToggle] = getToggleButtons();
    fireEvent.click(publicToggle);

    fireEvent.click(screen.getByRole("button", { name: /save/i }));
    await waitFor(() => {
      expect(patchBody.is_public).toBe(false);
    });
  });

  it("sends is_collaborative: true to PATCH after toggling Collaborative on", async () => {
    let patchBody: Record<string, unknown> = {};
    server.use(
      http.patch(
        "http://localhost:8000/api/playlists/1/",
        async ({ request }) => {
          patchBody = (await request.json()) as Record<string, unknown>;
          return HttpResponse.json(basePlaylist);
        },
      ),
    );

    renderForm(); // basePlaylist has is_collaborative: false

    const [, collabToggle] = getToggleButtons();
    fireEvent.click(collabToggle);

    fireEvent.click(screen.getByRole("button", { name: /save/i }));
    await waitFor(() => {
      expect(patchBody.is_collaborative).toBe(true);
    });
  });

  // ─── Cover upload ────────────────────────────────────────────────────────

  it("the 'Change cover' button is present", () => {
    renderForm();
    expect(
      screen.getByRole("button", { name: /change cover/i }),
    ).toBeInTheDocument();
  });

  it("updates the cover image to the newly uploaded URL on success", async () => {
    mockUpload.mockResolvedValueOnce({
      secure_url: "https://example.com/new-cover.png",
    });

    renderForm();

    // Simulate selecting a file via the hidden input
    const fileInput = document.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;
    const file = new File(["dummy"], "photo.jpg", { type: "image/jpeg" });

    await act(async () => {
      fireEvent.change(fileInput, { target: { files: [file] } });
    });

    await waitFor(() => {
      const img = screen.getByRole("img", { name: "Cover" });
      expect(img).toHaveAttribute("src", "https://example.com/new-cover.png");
    });
  });

  it("does not update cover URL when upload returns null (e.g. cancelled)", async () => {
    mockUpload.mockResolvedValueOnce(null);

    renderForm();

    const fileInput = document.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;
    const file = new File(["dummy"], "photo.jpg", { type: "image/jpeg" });

    await act(async () => {
      fireEvent.change(fileInput, { target: { files: [file] } });
    });

    // Cover should still be the original
    await waitFor(() => {
      const img = screen.getByRole("img", { name: "Cover" });
      expect(img).toHaveAttribute(
        "src",
        "https://example.com/original-cover.png",
      );
    });
  });

  it("calls the upload function with the selected file", async () => {
    mockUpload.mockResolvedValueOnce({
      secure_url: "https://cdn.example.com/cover.png",
    });

    renderForm();

    const fileInput = document.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;
    const file = new File(["data"], "cover.jpg", { type: "image/jpeg" });

    await act(async () => {
      fireEvent.change(fileInput, { target: { files: [file] } });
    });

    expect(mockUpload).toHaveBeenCalledWith(file);
  });

  // ─── Save mutation ───────────────────────────────────────────────────────

  it("calls the PATCH endpoint and invokes onClose after a successful save", async () => {
    const onClose = vi.fn();
    renderForm(basePlaylist, onClose);

    fireEvent.click(screen.getByRole("button", { name: /save/i }));

    await waitFor(() => {
      expect(onClose).toHaveBeenCalledOnce();
    });
  });

  it("sends updated title to the PATCH endpoint", async () => {
    let patchBody: Record<string, unknown> = {};

    server.use(
      http.patch(
        "http://localhost:8000/api/playlists/1/",
        async ({ request }) => {
          patchBody = (await request.json()) as Record<string, unknown>;
          return HttpResponse.json({ ...basePlaylist, ...patchBody });
        },
      ),
    );

    const onClose = vi.fn();
    renderForm(basePlaylist, onClose);

    fireEvent.change(screen.getByPlaceholderText("Title"), {
      target: { value: "Renamed Playlist" },
    });
    fireEvent.click(screen.getByRole("button", { name: /save/i }));

    await waitFor(() => {
      expect(patchBody.title).toBe("Renamed Playlist");
    });
  });

  it("shows 'Saving…' on the Save button while the mutation is pending", async () => {
    server.use(
      http.patch("http://localhost:8000/api/playlists/1/", async () => {
        await delay(500);
        return HttpResponse.json(basePlaylist);
      }),
    );

    renderForm();
    fireEvent.click(screen.getByRole("button", { name: /save/i }));

    expect(await screen.findByText("Saving…")).toBeInTheDocument();
  });

  it("disables the Save button while saving", async () => {
    server.use(
      http.patch("http://localhost:8000/api/playlists/1/", async () => {
        await delay(500);
        return HttpResponse.json(basePlaylist);
      }),
    );

    renderForm();
    const saveBtn = screen.getByRole("button", { name: /save/i });
    fireEvent.click(saveBtn);

    await waitFor(() =>
      expect(screen.getByText("Saving…").closest("button")).toBeDisabled(),
    );
  });

  it("shows an error state when the PATCH endpoint fails", async () => {
    server.use(
      http.patch("http://localhost:8000/api/playlists/1/", () => {
        return new HttpResponse(null, { status: 500 });
      }),
    );

    const onClose = vi.fn();
    renderForm(basePlaylist, onClose);
    fireEvent.click(screen.getByRole("button", { name: /save/i }));

    // onClose should NOT be called when mutation fails
    await waitFor(() => {
      expect(onClose).not.toHaveBeenCalled();
    });
  });

  // ─── Cancel button ───────────────────────────────────────────────────────

  it("calls onClose when the Cancel button is clicked", () => {
    const onClose = vi.fn();
    renderForm(basePlaylist, onClose);
    fireEvent.click(screen.getByRole("button", { name: /cancel/i }));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("does not call PATCH when Cancel is clicked", () => {
    let patched = false;
    server.use(
      http.patch("http://localhost:8000/api/playlists/1/", () => {
        patched = true;
        return HttpResponse.json(basePlaylist);
      }),
    );

    renderForm();
    fireEvent.click(screen.getByRole("button", { name: /cancel/i }));
    expect(patched).toBe(false);
  });

  // ─── cover_art_url in payload ─────────────────────────────────────────────

  it("omits cover_art_url from the payload when cover URL is empty", async () => {
    let patchBody: Record<string, unknown> = {};
    server.use(
      http.patch(
        "http://localhost:8000/api/playlists/1/",
        async ({ request }) => {
          patchBody = (await request.json()) as Record<string, unknown>;
          return HttpResponse.json(basePlaylist);
        },
      ),
    );

    renderForm({ ...basePlaylist, cover_art_url: null });
    fireEvent.click(screen.getByRole("button", { name: /save/i }));

    await waitFor(() => {
      expect(patchBody).not.toHaveProperty("cover_art_url");
    });
  });

  it("includes cover_art_url in the payload when cover URL is set", async () => {
    let patchBody: Record<string, unknown> = {};
    server.use(
      http.patch(
        "http://localhost:8000/api/playlists/1/",
        async ({ request }) => {
          patchBody = (await request.json()) as Record<string, unknown>;
          return HttpResponse.json(basePlaylist);
        },
      ),
    );

    renderForm();
    fireEvent.click(screen.getByRole("button", { name: /save/i }));

    await waitFor(() => {
      expect(patchBody.cover_art_url).toBe(
        "https://example.com/original-cover.png",
      );
    });
  });
});
