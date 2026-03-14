import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { ProfilePage } from "./ProfilePage";
import { updateProfile } from "@/features/auth/api";
import { useCloudinaryUpload } from "@/shared/hooks";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { changePassword } from "@/features/auth/api";

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

vi.mock("@/features/auth/api", () => ({
  updateProfile: vi.fn(),
  changePassword: vi.fn(),
}));
vi.mock("@/shared/hooks", () => ({ useCloudinaryUpload: vi.fn() }));
vi.mock("@/shared/context/AuthContext", () => ({
  useAuth: () => mockAuthState,
}));

const mockUpdateProfile = vi.mocked(updateProfile);
const mockedUseCloudinary = vi.mocked(useCloudinaryUpload);
const mockChangePassword = vi.mocked(changePassword);

type CloudinaryReturn = ReturnType<typeof useCloudinaryUpload>;

const renderProfile = (
  userOverride?: Partial<typeof mockUser> | null,
  isEditing = false,
) => {
  mockAuthState.user =
    userOverride === null ? null : { ...mockUser, ...(userOverride || {}) };

  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <ProfilePage isEditing={isEditing} />
      </MemoryRouter>
    </QueryClientProvider>,
  );
};

describe("ProfilePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedUseCloudinary.mockReturnValue({
      upload: vi
        .fn()
        .mockResolvedValue({ secure_url: "http://example.com/new-avatar.jpg" }),
      isUploading: false,
      error: null,
    } satisfies CloudinaryReturn);
  });

  describe("when user is missing", () => {
    it("shows 'Profile not found' message", () => {
      renderProfile(null);
      expect(screen.getByText("Profile not found.")).toBeInTheDocument();
    });

    it("shows a back to home button and navigates", async () => {
      const user = userEvent.setup();
      renderProfile(null);
      const backBtn = screen.getByRole("button", { name: /back to home/i });
      expect(backBtn).toBeInTheDocument();
      await user.click(backBtn);
      expect(mockNavigate).toHaveBeenCalledWith("/");
    });
  });

  describe("view mode", () => {
    it("shows Back to Home link", () => {
      renderProfile();
      expect(
        screen.getByRole("link", { name: /back to home/i }),
      ).toBeInTheDocument();
    });

    it("does not show save or cancel buttons", () => {
      renderProfile();
      expect(
        screen.queryByRole("button", { name: /save/i }),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: /cancel/i }),
      ).not.toBeInTheDocument();
    });
  });

  describe("edit mode", () => {
    describe("saving", () => {
      it("calls updateProfile with new username and navigates on success", async () => {
        const user = userEvent.setup();
        mockUpdateProfile.mockResolvedValueOnce({
          ...mockUser,
          username: "newname",
        });
        renderProfile(undefined, true);

        const input = screen.getByTestId("edit-username-input");
        await user.clear(input);
        await user.type(input, "newname");
        await user.click(screen.getByRole("button", { name: /save/i }));

        await waitFor(() => {
          expect(mockUpdateProfile).toHaveBeenCalledWith(
            "newname",
            mockUser.avatar_url,
          );
          expect(mockAuthState.setUser).toHaveBeenCalled();
          expect(mockNavigate).toHaveBeenCalledWith("/profile");
        });
      });

      it("displays error message when save fails", async () => {
        const user = userEvent.setup();
        mockUpdateProfile.mockRejectedValueOnce(new Error("Save failed"));
        renderProfile(undefined, true);

        await user.click(screen.getByRole("button", { name: /save/i }));

        await waitFor(() => {
          expect(
            screen.getByText("Failed to save profile. Please try again."),
          ).toBeInTheDocument();
        });
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

    describe("cancelling", () => {
      it("navigates to /profile without saving", async () => {
        const user = userEvent.setup();
        renderProfile(undefined, true);

        const input = screen.getByTestId("edit-username-input");
        await user.clear(input);
        await user.type(input, "changed-but-canceled");
        await user.click(screen.getByRole("button", { name: /cancel/i }));

        expect(mockNavigate).toHaveBeenCalledWith("/profile");
        expect(mockUpdateProfile).not.toHaveBeenCalled();
      });
    });

    describe("avatar upload", () => {
      it("updates avatar URL after successful upload", async () => {
        const user = userEvent.setup();
        const newAvatarUrl = "http://example.com/new-avatar.jpg";
        mockedUseCloudinary.mockReturnValue({
          upload: vi.fn().mockResolvedValue({ secure_url: newAvatarUrl }),
          isUploading: false,
          error: null,
        } satisfies CloudinaryReturn);

        renderProfile(undefined, true);

        const fileInput = document.querySelector(
          'input[type="file"]',
        ) as HTMLInputElement;
        const file = new File(["content"], "avatar.png", { type: "image/png" });
        await user.upload(fileInput, file);

        await waitFor(() => {
          expect(screen.getByAltText("Profile")).toHaveAttribute(
            "src",
            newAvatarUrl,
          );
        });
      });

      it("displays upload error from Cloudinary", () => {
        mockedUseCloudinary.mockReturnValue({
          upload: vi.fn().mockResolvedValue(null),
          isUploading: false,
          error: "Cloudinary upload failed",
        } satisfies CloudinaryReturn);

        renderProfile(undefined, true);
        expect(
          screen.getByText("Cloudinary upload failed"),
        ).toBeInTheDocument();
      });

      it("logs error when upload throws an exception", async () => {
        const user = userEvent.setup();
        const consoleErrorSpy = vi
          .spyOn(console, "error")
          .mockImplementation(() => {});
        mockedUseCloudinary.mockReturnValue({
          upload: vi.fn().mockRejectedValue(new Error("upload failed")),
          isUploading: false,
          error: null,
        } satisfies CloudinaryReturn);

        renderProfile(undefined, true);

        const fileInput = document.querySelector(
          'input[type="file"]',
        ) as HTMLInputElement;
        const file = new File(["content"], "avatar.png", { type: "image/png" });
        await user.upload(fileInput, file);

        await waitFor(() => {
          expect(consoleErrorSpy).toHaveBeenCalledWith(
            "Avatar upload failed:",
            expect.any(Error),
          );
        });
        consoleErrorSpy.mockRestore();
      });
    });

    describe("password change", () => {
      it("shows success message after password change callback fires", async () => {
        const user = userEvent.setup();

        mockChangePassword.mockResolvedValueOnce(undefined);

        renderProfile(undefined, true);

        const icon = screen.getByTestId("edit-password-icon");
        expect(icon).not.toBeNull();
        await user.click(icon);

        await user.type(screen.getByPlaceholderText("Current Password"), "old");
        await user.type(screen.getByPlaceholderText("New Password"), "new123");
        await user.type(
          screen.getByPlaceholderText("Confirm New Password"),
          "new123",
        );
        await user.click(
          screen.getByRole("button", { name: /change password/i }),
        );

        await waitFor(() => {
          expect(
            screen.getByText("Password changed successfully."),
          ).toBeInTheDocument();
        });
      });
    });
  });
});
