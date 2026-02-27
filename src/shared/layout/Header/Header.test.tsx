import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { Header } from "./Header";
import { logout } from "@/features/auth/api";
import "@testing-library/jest-dom/vitest";

vi.mock("@/features/auth/api", () => ({
  logout: vi.fn(),
}));

const mockNavigate = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual =
    await vi.importActual<typeof import("react-router-dom")>(
      "react-router-dom",
    );
  return { ...actual, useNavigate: () => mockNavigate };
});

const mockAuthState = {
  user: {
    id: 1,
    username: "john",
    email: "john@example.com",
    avatar_url: "",
  },
  setUser: vi.fn(),
  loading: false,
  refreshUser: vi.fn(),
};

vi.mock("@/shared/context/AuthContext", () => ({
  useAuth: () => mockAuthState,
}));

const mockLogout = vi.mocked(logout);

const renderHeader = () => {
  return render(
    <MemoryRouter>
      <Header />
    </MemoryRouter>,
  );
};

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

  it("renders the app title", () => {
    renderHeader();
    expect(screen.getByText("Music Player")).toBeInTheDocument();
  });

  it("renders an Upload button", () => {
    renderHeader();
    expect(screen.getByRole("button", { name: /upload/i })).toBeInTheDocument();
  });

  it("renders a Log Out button", () => {
    renderHeader();
    expect(
      screen.getByRole("button", { name: /log out/i }),
    ).toBeInTheDocument();
  });

  it("renders a profile/avatar button", () => {
    renderHeader();
    expect(screen.getByTitle("View Profile")).toBeInTheDocument();
  });

  it("displays the user initial when no avatarUrl is given", () => {
    renderHeader();
    expect(screen.getByText("J")).toBeInTheDocument();
  });

  it("uppercases the user initial", () => {
    mockAuthState.user = {
      ...mockAuthState.user,
      username: "alex",
    };
    renderHeader();
    expect(screen.getByText("A")).toBeInTheDocument();
  });

  it("renders an avatar img when avatarUrl is provided", () => {
    mockAuthState.user = {
      ...mockAuthState.user,
      avatar_url: "http://example.com/avatar.jpg",
    };
    renderHeader();
    const img = screen.getByAltText("Profile");
    expect(img).toHaveAttribute("src", "http://example.com/avatar.jpg");
  });

  it("calls logout(), clears user, and navigates on Log Out", async () => {
    mockLogout.mockResolvedValueOnce(undefined);

    renderHeader();
    fireEvent.click(screen.getByRole("button", { name: /log out/i }));

    await waitFor(() => {
      expect(mockLogout).toHaveBeenCalledTimes(1);
      expect(mockAuthState.setUser).toHaveBeenCalledWith(null);
      expect(mockNavigate).toHaveBeenCalledWith("/login");
    });
  });

  it("logs an error when logout() rejects", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockLogout.mockRejectedValueOnce(new Error("network error"));

    renderHeader();
    fireEvent.click(screen.getByRole("button", { name: /log out/i }));

    // onLogout should not be called when logout() throws (the catch block
    // only logs the error and does not call onLogout)
    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalled();
    });
    consoleSpy.mockRestore();
  });
});
