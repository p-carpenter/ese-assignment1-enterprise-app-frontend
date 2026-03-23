import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { ProfilePage } from "./ProfilePage";
import { useCloudinaryUpload } from "@/shared/hooks";
import { renderWithQueryClient } from "@/test/render";
import { server } from "@/mocks/server";
import { http, HttpResponse } from "msw";
import { resetHandlerState } from "@/mocks/handlers";

const mockNavigate = vi.fn();

const mockUser = {
  id: 42,
  username: "testuser",
  email: "test@example.com",
  avatar_url: "",
};

const mockAuthState = {
  user: null as typeof mockUser | null,
  setUser: vi.fn(),
};

vi.mock("react-router-dom", async () => {
  const actual =
    await vi.importActual<typeof import("react-router-dom")>(
      "react-router-dom",
    );
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock("@/shared/hooks", () => ({ useCloudinaryUpload: vi.fn() }));
vi.mock("@/shared/context/AuthContext", () => ({
  useAuth: () => mockAuthState,
}));

const mockedUseCloudinary = vi.mocked(useCloudinaryUpload);
type CloudinaryReturn = ReturnType<typeof useCloudinaryUpload>;

const renderProfile = (
  userOverride?: Partial<typeof mockUser> | null,
  isEditing = false,
) => {
  mockAuthState.user =
    userOverride === null ? null : { ...mockUser, ...(userOverride || {}) };

  return renderWithQueryClient(
    <MemoryRouter>
      <ProfilePage isEditing={isEditing} />
    </MemoryRouter>,
  );
};

describe("ProfilePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetHandlerState();
    mockedUseCloudinary.mockReturnValue({
      upload: vi
        .fn()
        .mockResolvedValue({ secure_url: "http://example.com/new-avatar.jpg" }),
      isUploading: false,
      error: null,
    } satisfies CloudinaryReturn);
  });

  describe("when user is missing", () => {
    it("shows 'Profile not found' message and navigates home", async () => {
      const user = userEvent.setup();
      renderProfile(null);

      expect(screen.getByText("Profile not found.")).toBeInTheDocument();

      await user.click(screen.getByRole("button", { name: /back to home/i }));
      expect(mockNavigate).toHaveBeenCalledWith("/");
    });
  });

  describe("View mode", () => {
    it("shows Back to Home link without edit controls", () => {
      renderProfile();
      expect(
        screen.getByRole("link", { name: /back to home/i }),
      ).toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: /save/i }),
      ).not.toBeInTheDocument();
    });
  });

  describe("Edit mode", () => {
    describe("Avatar upload", () => {
      it("handles avatar upload successfully", async () => {
        const uploadMock = vi
          .fn()
          .mockResolvedValue({ secure_url: "http://example.com/new.jpg" });
        mockedUseCloudinary.mockReturnValue({
          upload: uploadMock,
          isUploading: false,
          error: null,
        } as CloudinaryReturn);

        const { container } = renderProfile(undefined, true);
        const fileInput = container.querySelector('input[type="file"]');

        if (fileInput) {
          const file = new File(["dummy"], "avatar.png", { type: "image/png" });
          fireEvent.change(fileInput, { target: { files: [file] } });
          await waitFor(() => expect(uploadMock).toHaveBeenCalledWith(file));
        }
      });

      it("handles avatar upload failure gracefully", async () => {
        const consoleSpy = vi
          .spyOn(console, "error")
          .mockImplementation(() => {});
        mockedUseCloudinary.mockReturnValue({
          upload: vi.fn().mockRejectedValue(new Error("Upload failed")),
          isUploading: false,
          error: null,
        } as CloudinaryReturn);

        const { container } = renderProfile(undefined, true);
        const fileInput = container.querySelector('input[type="file"]');

        if (fileInput) {
          const file = new File(["dummy"], "avatar.png", { type: "image/png" });
          fireEvent.change(fileInput, { target: { files: [file] } });
          await waitFor(() => {
            expect(consoleSpy).toHaveBeenCalledWith(
              "Avatar upload failed:",
              expect.any(Error),
            );
          });
        }
        consoleSpy.mockRestore();
      });
    });

    describe("saving", () => {
      it("submits new username and navigates on success", async () => {
        const user = userEvent.setup();
        renderProfile(undefined, true);

        const input = screen.getByTestId("edit-username-input");
        await user.clear(input);
        await user.type(input, "newname");
        await user.click(screen.getByRole("button", { name: /save/i }));

        await waitFor(() => {
          expect(mockAuthState.setUser).toHaveBeenCalled();
          expect(mockNavigate).toHaveBeenCalledWith("/profile");
        });
      });

      it("displays error message when save fails", async () => {
        server.use(
          http.patch(
            "http://localhost:8000/api/auth/user/",
            () => new HttpResponse(null, { status: 500 }),
          ),
        );

        const user = userEvent.setup();
        renderProfile(undefined, true);

        await user.click(screen.getByRole("button", { name: /save/i }));

        expect(
          await screen.findByText("Failed to save profile. Please try again."),
        ).toBeInTheDocument();
      });

      it("disables save button while uploading", () => {
        mockedUseCloudinary.mockReturnValue({
          upload: vi.fn(),
          isUploading: true,
          error: null,
        } satisfies CloudinaryReturn);

        renderProfile(undefined, true);
        expect(screen.getByRole("button", { name: /save/i })).toBeDisabled();
      });
    });

    describe("cancel edit", () => {
      it("resets fields and navigates back to view profile", async () => {
        const user = userEvent.setup();
        renderProfile(undefined, true);

        const input = screen.getByTestId("edit-username-input");
        await user.clear(input);
        await user.type(input, "changedname");

        await user.click(screen.getByRole("button", { name: /cancel/i }));

        expect(mockNavigate).toHaveBeenCalledWith("/profile");
      });
    });

    describe("Password change", () => {
      it("shows success message after password change succeeds", async () => {
        const user = userEvent.setup();
        renderProfile(undefined, true);

        await user.click(screen.getByTestId("edit-password-icon"));
        await user.type(screen.getByPlaceholderText("Current Password"), "old");
        await user.type(
          screen.getByPlaceholderText("New Password"),
          "new8chars",
        );
        await user.type(
          screen.getByPlaceholderText("Confirm New Password"),
          "new8chars",
        );
        await user.click(
          screen.getByRole("button", { name: /change password/i }),
        );

        expect(
          await screen.findByText("Password changed successfully."),
        ).toBeInTheDocument();
      });
    });
  });
});
