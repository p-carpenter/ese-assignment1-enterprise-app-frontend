import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { LoginPage } from "./LoginPage";
import { login, getMe } from "@/features/auth/api";
import { AuthProvider } from "@/shared/context/AuthContext";
import "@testing-library/jest-dom/vitest";

vi.mock("@/features/auth/api", () => ({
  login: vi.fn(),
  getMe: vi.fn(),
}));

const mockLogin = vi.mocked(login);
const mockGetMe = vi.mocked(getMe) as unknown as ReturnType<typeof vi.fn>;

const renderLoginPage = async () => {
  const utils = render(
    <MemoryRouter>
      <AuthProvider>
        <LoginPage />
      </AuthProvider>
    </MemoryRouter>,
  );

  // Wait for AuthProvider's getMe effect to finish to avoid act() warnings
  await waitFor(() => expect(mockGetMe).toHaveBeenCalled());

  return utils;
};

describe("LoginPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetMe.mockResolvedValue({
      id: 1,
      username: "testuser",
      email: "test@example.com",
    });
  });

  it("renders the email and password inputs", async () => {
    await renderLoginPage();
    expect(screen.getByPlaceholderText("Email address")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Password")).toBeInTheDocument();
  });

  it("renders a 'Forgot your password?' link", async () => {
    await renderLoginPage();
    expect(screen.getByText(/forgot your password\?/i)).toBeInTheDocument();
  });

  it("renders the 'Sign up for Spotify' footer link", async () => {
    await renderLoginPage();
    expect(
      screen.getByRole("link", { name: /sign up for spotify/i }),
    ).toBeInTheDocument();
  });

  it("renders the 'Don't have an account?' footer text", async () => {
    await renderLoginPage();
    expect(screen.getByText(/don't have an account\?/i)).toBeInTheDocument();
  });

  it("calls login() on valid submission", async () => {
    mockLogin.mockResolvedValueOnce(undefined);

    await renderLoginPage();

    fireEvent.change(screen.getByPlaceholderText("Email address"), {
      target: { value: "user@example.com" },
    });
    fireEvent.change(screen.getByPlaceholderText("Password"), {
      target: { value: "password123" },
    });
    fireEvent.click(screen.getByRole("button", { name: /log in/i }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith("user@example.com", "password123");
    });
  });

  it("shows an error message when login() rejects", async () => {
    mockLogin.mockRejectedValueOnce(new Error("Invalid credentials"));

    await renderLoginPage();

    fireEvent.change(screen.getByPlaceholderText("Email address"), {
      target: { value: "bad@example.com" },
    });
    fireEvent.change(screen.getByPlaceholderText("Password"), {
      target: { value: "wrong" },
    });
    fireEvent.click(screen.getByRole("button", { name: /log in/i }));

    expect(await screen.findByText("Invalid credentials")).toBeInTheDocument();
  });
});
