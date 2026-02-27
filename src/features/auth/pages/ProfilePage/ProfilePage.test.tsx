import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { MemoryRouter } from "react-router-dom";
import { ProfilePage } from "./ProfilePage";
import { updateProfile } from "@/features/auth/api";
import { useCloudinaryUpload } from "@/shared/hooks";
import "@testing-library/jest-dom/vitest";

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
  loading: false,
  refreshUser: vi.fn(),
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
}));

const mockUpdateProfile = vi.mocked(updateProfile) as unknown as ReturnType<
  typeof vi.fn
>;
const mockedUseCloudinary = useCloudinaryUpload as unknown as ReturnType<
  typeof vi.fn
>;

vi.mock("@/shared/hooks", () => ({
  useCloudinaryUpload: vi.fn(),
}));

vi.mock("@/shared/context/AuthContext", () => ({
  useAuth: () => mockAuthState,
  AuthProvider: ({ children }: { children: ReactNode }) => children,
}));

const renderProfile = (
  userOverride?: Partial<typeof mockUser> | null,
  isEditing = false,
) => {
  mockAuthState.user =
    userOverride === null ? null : { ...mockUser, ...(userOverride || {}) };

  return render(
    <MemoryRouter>
      <ProfilePage isEditing={isEditing} />
    </MemoryRouter>,
  );
};

describe("ProfilePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthState.user = { ...mockUser };
    mockedUseCloudinary.mockReturnValue({
      upload: vi.fn().mockResolvedValue({
        secure_url: "http://example.com/new-avatar.jpg",
        duration: 0,
      }),
      isUploading: false,
      error: null,
    });
  });

  describe("when profile is missing", () => {
    it("shows a 'Profile not found' message", () => {
      renderProfile(null);
      expect(screen.getByText("Profile not found")).toBeInTheDocument();
    });
  });

  describe("when a valid profile is supplied", () => {
    it("renders the username", () => {
      renderProfile();
      expect(
        screen.getByRole("heading", { level: 1, name: mockUser.username }),
      ).toBeInTheDocument();
    });

    it("renders the email address", () => {
      renderProfile();
      expect(screen.getByText(mockUser.email)).toBeInTheDocument();
    });

    it("renders the user ID", () => {
      renderProfile();
      expect(screen.getByText(`#${mockUser.id}`)).toBeInTheDocument();
    });
  });

  describe("profile editing", () => {
    it("renders editable username field and save/cancel buttons", () => {
      renderProfile(undefined, true);
      expect(
        screen.getByPlaceholderText(mockUser.username),
      ).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /save/i })).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /cancel/i }),
      ).toBeInTheDocument();
    });

    it("submits profile updates", async () => {
      mockUpdateProfile.mockResolvedValueOnce({
        ...mockUser,
        username: "newname",
        avatar_url: "http://example.com/new-avatar.jpg",
      });

      renderProfile(undefined, true);

      fireEvent.change(screen.getByPlaceholderText(mockUser.username), {
        target: { value: "newname" },
      });

      fireEvent.click(screen.getByRole("button", { name: /save/i }));

      await waitFor(() => {
        expect(mockUpdateProfile).toHaveBeenCalledWith(
          "newname",
          mockUser.avatar_url,
        );
        expect(mockNavigate).toHaveBeenCalledWith("/profile");
      });
    });
  });
});
