import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { AuthFooter } from "./AuthFooter";
import { AuthContext } from "@/shared/context/AuthContext";
import { type UserProfile } from "@/features/auth/types";

const mockNavigate = vi.fn();
type User = UserProfile | null;

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const renderWithAuth = (user: User, logoutMock = vi.fn()) => {
  return render(
    <MemoryRouter>
      <AuthContext.Provider
        value={{
          user,
          logout: logoutMock,
          loading: false,
          setUser: vi.fn(),
          refreshUser: vi.fn(),
          login: vi.fn(),
        }}
      >
        <AuthFooter />
      </AuthContext.Provider>
    </MemoryRouter>,
  );
};

describe("AuthFooter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns null if user is not authenticated", () => {
    const { container } = renderWithAuth(null);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders avatar image and username if avatar_url is present", () => {
    renderWithAuth({
      id: 1,
      email: "test@example.com",
      username: "testuser",
      avatar_url: "https://example.com/avatar.jpg",
    });
    expect(screen.getByText("testuser")).toBeInTheDocument();

    const avatar = screen.getByAltText("Profile");
    expect(avatar).toHaveAttribute("src", "https://example.com/avatar.jpg");
  });

  it("renders initial fallback if no avatar_url is present", () => {
    renderWithAuth({ id: 1, email: "test@example.com", username: "brad" });
    expect(screen.getByText("brad")).toBeInTheDocument();
    expect(screen.getByText("B")).toBeInTheDocument();
  });

  it("navigates to profile when clicking the avatar button", () => {
    renderWithAuth({
      id: 1,
      email: "test@example.com",
      username: "testuser",
      avatar_url: "https://example.com/avatar.jpg",
    });
    fireEvent.click(screen.getByTitle("View Profile"));
    expect(mockNavigate).toHaveBeenCalledWith("/profile");
  });

  it("calls logout and navigates to login on logout click", async () => {
    const logoutMock = vi.fn().mockResolvedValue(undefined);
    renderWithAuth(
      {
        id: 1,
        email: "test@example.com",
        username: "testuser",
        avatar_url: "https://example.com/avatar.jpg",
      },
      logoutMock,
    );

    fireEvent.click(screen.getByRole("button", { name: /log out/i }));

    expect(logoutMock).toHaveBeenCalled();
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/login");
    });
  });

  it("displays an error message and does not navigate if logout fails", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const logoutMock = vi.fn().mockRejectedValue(new Error("Network error"));

    renderWithAuth(
      {
        id: 1,
        email: "test@example.com",
        username: "testuser",
      },
      logoutMock,
    );

    fireEvent.click(screen.getByRole("button", { name: /log out/i }));

    expect(
      await screen.findByText("Logout failed. Please try again."),
    ).toBeInTheDocument();
    expect(mockNavigate).not.toHaveBeenCalled();

    consoleSpy.mockRestore();
  });
});
