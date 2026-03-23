import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { EditPlaylistForm } from "./EditPlaylistForm";
import type { Playlist } from "@/features/playlists/types";
import { server } from "@/mocks/server";
import { http, HttpResponse, delay } from "msw";
import "@testing-library/jest-dom/vitest";
import { renderWithQueryClient } from "@/test/render";
import { createPlaylist } from "@/test/factories/playlist";

const mockUpload = vi.fn();

vi.mock("@/shared/hooks", () => ({
  useCloudinaryUpload: () => ({
    upload: mockUpload,
    isUploading: false,
    error: null,
  }),
}));

vi.mock("@/shared/components/AlertMessage/AlertMessage", () => ({
  AlertMessage: ({ message }: { message?: string | null }) =>
    message ? <div role="alert">{message}</div> : null,
}));

const renderForm = (
  playlist: Playlist = createPlaylist(),
  onClose = vi.fn(),
) => {
  return {
    onClose,
    ...renderWithQueryClient(
      <MemoryRouter>
        <EditPlaylistForm playlist={playlist} onClose={onClose} />
      </MemoryRouter>,
    ),
  };
};

describe("EditPlaylistForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUpload.mockResolvedValue(null);
  });

  describe("initial state", () => {
    it("pre-fills the title input with the playlist title", () => {
      renderForm(createPlaylist({ title: "My Playlist" }));
      expect(
        screen.getByRole("textbox", { name: /playlist title/i }),
      ).toHaveValue("My Playlist");
    });

    it("pre-fills the description textarea with the playlist description", () => {
      renderForm(createPlaylist({ description: "Original description" }));
      expect(
        screen.getByRole("textbox", { name: /playlist description/i }),
      ).toHaveValue("Original description");
    });

    it("shows an empty description textarea when description is null", () => {
      renderForm(createPlaylist({ description: null as unknown as string }));
      expect(
        screen.getByRole("textbox", { name: /playlist description/i }),
      ).toHaveValue("");
    });

    it("shows the cover art image with the current cover_art_url", () => {
      renderForm(
        createPlaylist({
          cover_art_url: "https://example.com/original-cover.png",
        }),
      );
      const img = screen.getByRole("img", { name: /playlist cover art/i });
      expect(img).toHaveAttribute(
        "src",
        "https://example.com/original-cover.png",
      );
    });

    it("shows a placeholder image when cover_art_url is null", () => {
      renderForm(createPlaylist({ cover_art_url: null }));
      const img = screen.getByRole("img", { name: /playlist cover art/i });
      expect(img).toHaveAttribute("src", "https://placehold.co/220");
    });

    it("renders the Public toggle showing the initial state (on)", () => {
      renderForm(createPlaylist({ is_public: true }));
      const publicSwitch = screen.getByRole("switch", {
        name: /toggle public visibility/i,
      });
      expect(publicSwitch).toHaveAttribute("aria-checked", "true");
    });

    it("renders the Collaborative toggle (initially off)", () => {
      renderForm(createPlaylist({ is_collaborative: false }));
      const collabSwitch = screen.getByRole("switch", {
        name: /toggle collaborative mode/i,
      });
      expect(collabSwitch).toHaveAttribute("aria-checked", "false");
    });
  });

  describe("input interactions", () => {
    it("hides the Collaborative toggle when public is false", () => {
      renderForm(createPlaylist({ is_public: false }));
      expect(
        screen.queryByRole("switch", { name: /toggle collaborative mode/i }),
      ).not.toBeInTheDocument();
    });

    it("resets collaborative to false and hides it when public is toggled off", async () => {
      const user = userEvent.setup();
      renderForm(createPlaylist({ is_public: true, is_collaborative: true }));

      const collabToggle = screen.getByRole("switch", {
        name: /toggle collaborative mode/i,
      });
      expect(collabToggle).toHaveAttribute("aria-checked", "true");

      const publicToggle = screen.getByRole("switch", {
        name: /toggle public visibility/i,
      });
      await user.click(publicToggle);

      expect(
        screen.queryByRole("switch", { name: /toggle collaborative mode/i }),
      ).not.toBeInTheDocument();

      let patchBody: Record<string, unknown> | null = null;
      server.use(
        http.patch("*/api/playlists/:id/", async ({ request }) => {
          patchBody = (await request.json()) as Record<string, unknown>;
          return HttpResponse.json(createPlaylist());
        }),
      );
      await user.click(
        screen.getByRole("button", { name: /save playlist changes/i }),
      );

      await waitFor(() => {
        expect(patchBody).not.toBeNull();
        expect(patchBody!.is_public).toBe(false);
        expect(patchBody!.is_collaborative).toBe(false);
      });
    });

    it("allows typing a new title", async () => {
      const user = userEvent.setup();
      renderForm();
      const input = screen.getByRole("textbox", { name: /playlist title/i });
      await user.clear(input);
      await user.type(input, "Updated Title");
      expect(input).toHaveValue("Updated Title");
    });

    it("allows editing the description", async () => {
      const user = userEvent.setup();
      renderForm();
      const textarea = screen.getByRole("textbox", {
        name: /playlist description/i,
      });
      await user.clear(textarea);
      await user.type(textarea, "New description");
      expect(textarea).toHaveValue("New description");
    });

    it("sends is_public: false to PATCH after toggling Public off", async () => {
      const user = userEvent.setup();
      let patchBody: Record<string, unknown> | null = null;
      server.use(
        http.patch("*/api/playlists/:id/", async ({ request }) => {
          patchBody = (await request.json()) as Record<string, unknown>;
          return HttpResponse.json(createPlaylist());
        }),
      );

      renderForm(createPlaylist({ is_public: true }));
      const publicToggle = screen.getByRole("switch", {
        name: /toggle public visibility/i,
      });
      await user.click(publicToggle);
      await user.click(
        screen.getByRole("button", { name: /save playlist changes/i }),
      );

      await waitFor(() => {
        expect(patchBody).not.toBeNull();
        expect(patchBody!.is_public).toBe(false);
      });
    });

    it("sends is_collaborative: true to PATCH after toggling Collaborative on", async () => {
      const user = userEvent.setup();
      let patchBody: Record<string, unknown> | null = null;
      server.use(
        http.patch("*/api/playlists/:id/", async ({ request }) => {
          patchBody = (await request.json()) as Record<string, unknown>;
          return HttpResponse.json(createPlaylist());
        }),
      );

      renderForm(createPlaylist({ is_public: true, is_collaborative: false }));
      const collabToggle = screen.getByRole("switch", {
        name: /toggle collaborative mode/i,
      });
      await user.click(collabToggle);
      await user.click(
        screen.getByRole("button", { name: /save playlist changes/i }),
      );

      await waitFor(() => {
        expect(patchBody).not.toBeNull();
        expect(patchBody!.is_collaborative).toBe(true);
      });
    });
  });

  describe("cover upload", () => {
    it("the 'Change cover' button is present", () => {
      renderForm();
      expect(
        screen.getByRole("button", { name: /change playlist cover/i }),
      ).toBeInTheDocument();
    });

    it("updates the cover image to the newly uploaded URL on success", async () => {
      const user = userEvent.setup();
      mockUpload.mockResolvedValueOnce({
        secure_url: "https://example.com/new-cover.png",
      });
      renderForm();

      const fileInput = screen.getByLabelText(/upload cover image file/i);
      const file = new File(["dummy"], "photo.jpg", { type: "image/jpeg" });
      await user.upload(fileInput, file);

      await waitFor(() => {
        const img = screen.getByRole("img", { name: /playlist cover art/i });
        expect(img).toHaveAttribute("src", "https://example.com/new-cover.png");
      });
    });

    it("does not update cover URL when upload returns null (e.g. cancelled)", async () => {
      const user = userEvent.setup();
      mockUpload.mockResolvedValueOnce(null);
      renderForm(
        createPlaylist({
          cover_art_url: "https://example.com/original-cover.png",
        }),
      );

      const fileInput = screen.getByLabelText(/upload cover image file/i);
      const file = new File(["dummy"], "photo.jpg", { type: "image/jpeg" });
      await user.upload(fileInput, file);

      await waitFor(() => {
        const img = screen.getByRole("img", { name: /playlist cover art/i });
        expect(img).toHaveAttribute(
          "src",
          "https://example.com/original-cover.png",
        );
      });
    });

    it("calls the upload function with the selected file", async () => {
      const user = userEvent.setup();
      mockUpload.mockResolvedValueOnce({
        secure_url: "https://cdn.example.com/cover.png",
      });
      renderForm();

      const fileInput = screen.getByLabelText(/upload cover image file/i);
      const file = new File(["data"], "cover.jpg", { type: "image/jpeg" });
      await user.upload(fileInput, file);

      await waitFor(() => {
        expect(mockUpload).toHaveBeenCalledWith(file);
      });
    });
  });

  describe("save mutation", () => {
    it("calls the PATCH endpoint and invokes onClose after a successful save", async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();

      server.use(
        http.patch("*/api/playlists/:id/", () => {
          return HttpResponse.json(createPlaylist());
        }),
      );

      renderForm(createPlaylist(), onClose);

      const titleInput = screen.getByRole("textbox", {
        name: /playlist title/i,
      });
      await user.type(titleInput, " updated");
      await user.click(
        screen.getByRole("button", { name: /save playlist changes/i }),
      );

      await waitFor(() => expect(onClose).toHaveBeenCalledOnce());
    });

    it("sends updated title to the PATCH endpoint", async () => {
      const user = userEvent.setup();
      let patchBody: Record<string, unknown> | null = null;

      server.use(
        http.patch("*/api/playlists/:id/", async ({ request }) => {
          patchBody = (await request.json()) as Record<string, unknown>;
          return HttpResponse.json(createPlaylist());
        }),
      );

      const onClose = vi.fn();
      renderForm(createPlaylist(), onClose);

      const titleInput = screen.getByRole("textbox", {
        name: /playlist title/i,
      });
      await user.clear(titleInput);
      await user.type(titleInput, "Renamed Playlist");
      await user.click(
        screen.getByRole("button", { name: /save playlist changes/i }),
      );

      await waitFor(() => {
        expect(patchBody).not.toBeNull();
        expect(patchBody!.title).toBe("Renamed Playlist");
      });
    });

    it("disables the Save button while saving", async () => {
      const user = userEvent.setup();
      server.use(
        http.patch("*/api/playlists/:id/", async () => {
          await delay(200);
          return HttpResponse.json(createPlaylist());
        }),
      );
      renderForm();

      const titleInput = screen.getByRole("textbox", {
        name: /playlist title/i,
      });
      await user.type(titleInput, " changed");

      const saveBtn = screen.getByRole("button", {
        name: /save playlist changes/i,
      });
      await user.click(saveBtn);

      // Checking immediately since it should be disabled before the MSW mock resolves
      await waitFor(() => expect(saveBtn).toBeDisabled());
    });

    it("shows an error state when the PATCH endpoint fails", async () => {
      const user = userEvent.setup();
      server.use(
        http.patch("*/api/playlists/:id/", () => {
          return new HttpResponse(null, { status: 500 });
        }),
      );

      const onClose = vi.fn();
      renderForm(createPlaylist(), onClose);

      const titleInput = screen.getByRole("textbox", {
        name: /playlist title/i,
      });
      await user.type(titleInput, " changed");
      await user.click(
        screen.getByRole("button", { name: /save playlist changes/i }),
      );

      await waitFor(() =>
        expect(screen.getByRole("alert")).toBeInTheDocument(),
      );
      expect(onClose).not.toHaveBeenCalled();
    });
  });

  describe("cancel behavior", () => {
    it("calls onClose when the Cancel button is clicked", async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();
      renderForm(createPlaylist(), onClose);
      await user.click(screen.getByRole("button", { name: /cancel editing/i }));
      expect(onClose).toHaveBeenCalledOnce();
    });

    it("does not call PATCH when Cancel is clicked", async () => {
      const user = userEvent.setup();
      let patched = false;
      server.use(
        http.patch("*/api/playlists/:id/", () => {
          patched = true;
          return HttpResponse.json(createPlaylist());
        }),
      );
      renderForm();
      await user.click(screen.getByRole("button", { name: /cancel editing/i }));
      expect(patched).toBe(false);
    });

    it("resets form state to initial values on cancel", async () => {
      const user = userEvent.setup();
      renderForm(
        createPlaylist({
          title: "My Playlist",
          description: "Original description",
        }),
      );

      const titleInput = screen.getByRole("textbox", {
        name: /playlist title/i,
      });
      const descInput = screen.getByRole("textbox", {
        name: /playlist description/i,
      });

      await user.clear(titleInput);
      await user.type(titleInput, "Changed Title");
      await user.clear(descInput);
      await user.type(descInput, "Changed Description");
      await user.click(screen.getByRole("button", { name: /cancel editing/i }));

      expect(titleInput).toHaveValue("My Playlist");
      expect(descInput).toHaveValue("Original description");
    });

    it("closes the form without making an API call if no fields were changed", async () => {
      const user = userEvent.setup();
      let patched = false;
      const onClose = vi.fn();

      server.use(
        http.patch("*/api/playlists/:id/", () => {
          patched = true;
          return HttpResponse.json(createPlaylist());
        }),
      );

      renderForm(createPlaylist(), onClose);
      await user.click(
        screen.getByRole("button", { name: /save playlist changes/i }),
      );

      expect(onClose).toHaveBeenCalledOnce();
      expect(patched).toBe(false);
    });
  });

  describe("payload shape", () => {
    it("omits cover_art_url from the payload when cover URL is empty", async () => {
      const user = userEvent.setup();
      let patchBody: Record<string, unknown> | null = null;

      server.use(
        http.patch("*/api/playlists/:id/", async ({ request }) => {
          patchBody = (await request.json()) as Record<string, unknown>;
          return HttpResponse.json(createPlaylist());
        }),
      );

      renderForm(createPlaylist({ cover_art_url: null }));
      const titleInput = screen.getByRole("textbox", {
        name: /playlist title/i,
      });
      await user.clear(titleInput);
      await user.type(titleInput, "Updated Title");

      await user.click(
        screen.getByRole("button", { name: /save playlist changes/i }),
      );

      await waitFor(() => {
        expect(patchBody).not.toBeNull();
        expect(patchBody).toHaveProperty("title");
        expect(patchBody).not.toHaveProperty("cover_art_url");
      });
    });

    it("includes cover_art_url in the payload when cover URL is set", async () => {
      const user = userEvent.setup();
      let patchBody: Record<string, unknown> | null = null;

      server.use(
        http.patch("*/api/playlists/:id/", async ({ request }) => {
          patchBody = (await request.json()) as Record<string, unknown>;
          return HttpResponse.json(createPlaylist());
        }),
      );

      renderForm(createPlaylist());
      const fileInput = screen.getByLabelText(/upload cover image file/i);
      const file = new File(["dummy"], "photo.jpg", { type: "image/jpeg" });
      mockUpload.mockResolvedValueOnce({
        secure_url: "https://example.com/new-cover.png",
      });

      await user.upload(fileInput, file);
      await waitFor(() =>
        expect(screen.getByRole("img")).toHaveAttribute(
          "src",
          "https://example.com/new-cover.png",
        ),
      );

      await user.click(
        screen.getByRole("button", { name: /save playlist changes/i }),
      );

      await waitFor(() => {
        expect(patchBody).not.toBeNull();
        expect(patchBody!.cover_art_url).toBe(
          "https://example.com/new-cover.png",
        );
      });
    });
  });
});
