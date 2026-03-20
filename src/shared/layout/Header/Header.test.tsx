import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { Header } from "./Header";
import { type UserProfile } from "@/features/auth/types";

const mockNavigate = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual =
    await vi.importActual<typeof import("react-router-dom")>(
      "react-router-dom",
    );
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => ({ pathname: "/" }),
    useSearchParams: () => [new URLSearchParams("")],
  };
});

vi.mock("use-debounce", () => ({
  useDebouncedCallback: (fn: (...args: unknown[]) => void) => fn,
}));

const mockAuthState = {
  user: {
    id: 1,
    username: "john",
    email: "john@example.com",
    avatar_url: "",
  } as UserProfile | null,
  setUser: vi.fn(),
  logout: vi.fn(),
  loading: false,
  refreshUser: vi.fn(),
};

vi.mock("@/shared/context/AuthContext", () => ({
  useAuth: () => mockAuthState,
}));

const renderHeader = () =>
  render(
    <MemoryRouter>
      <Header />
    </MemoryRouter>,
  );

describe("Header", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthState.user = {
      id: 1,
      username: "john",
      email: "john@example.com",
      avatar_url: "",
    };
  });

  describe("Navigation & Layout", () => {
    it("renders the app title with correct href", () => {
      renderHeader();
      const titleLink = screen.getByRole("link", { name: /adastream/i });
      expect(titleLink).toBeInTheDocument();
      expect(titleLink).toHaveAttribute("href", "/");
    });

    it("renders the home icon with correct href", () => {
      renderHeader();
      const homeLink = screen.getByRole("link", { name: /home/i });
      expect(homeLink).toBeInTheDocument();
      expect(homeLink).toHaveAttribute("href", "/");
    });

    it("renders the search bar", () => {
      renderHeader();
      expect(
        screen.getByRole("searchbox", { name: /search songs/i }),
      ).toBeInTheDocument();
    });

    it("renders an Add Song button that navigates to /upload", async () => {
      const user = userEvent.setup();
      renderHeader();
      await user.click(screen.getByRole("button", { name: /add song/i }));
      expect(mockNavigate).toHaveBeenCalledWith("/upload");
    });
  });

  describe("User Profile & Avatar", () => {
    it("renders a profile button and navigates to /profile on click", async () => {
      const user = userEvent.setup();
      renderHeader();
      const profileBtn = screen.getByTitle("View Profile");
      expect(profileBtn).toBeInTheDocument();

      await user.click(profileBtn);
      expect(mockNavigate).toHaveBeenCalledWith("/profile");
    });

    it("displays the uppercased user initial when no avatarUrl is given", () => {
      mockAuthState.user = { ...mockAuthState.user!, username: "alex" };
      renderHeader();
      expect(screen.getByText("A")).toBeInTheDocument();
    });

    it("renders an avatar img when avatarUrl is provided", () => {
      mockAuthState.user = {
        ...mockAuthState.user!,
        avatar_url: "http://example.com/avatar.jpg",
      };
      renderHeader();
      expect(screen.getByAltText("Profile")).toHaveAttribute(
        "src",
        "http://example.com/avatar.jpg",
      );
    });

    it("handles null user gracefully without crashing", () => {
      mockAuthState.user = null;
      renderHeader();
      expect(screen.getByTitle("View Profile")).toBeInTheDocument();
    });
  });

  describe("Authentication Actions", () => {
    it("calls logout() and navigates to /login on Log Out", async () => {
      const user = userEvent.setup();
      mockAuthState.logout.mockResolvedValueOnce(undefined);
      renderHeader();

      await user.click(screen.getByRole("button", { name: /log out/i }));

      await waitFor(() => {
        expect(mockAuthState.logout).toHaveBeenCalledTimes(1);
        expect(mockNavigate).toHaveBeenCalledWith("/login");
      });
    });

    it("logs an error and does notnavigate when logout() rejects", async () => {
      const user = userEvent.setup();
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});
      mockAuthState.logout.mockRejectedValueOnce(new Error("network error"));

      renderHeader();
      await user.click(screen.getByRole("button", { name: /log out/i }));

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          "Logout failed:",
          expect.any(Error),
        );
        expect(mockNavigate).not.toHaveBeenCalled();
      });

      consoleSpy.mockRestore();
    });
  });
});
