import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { LoginPage } from "./LoginPage";
import { login } from "@/features/auth/api";
import "@testing-library/jest-dom/vitest";

vi.mock("@/features/auth/api", () => ({
  login: vi.fn(),
}));

const mockLogin = vi.mocked(login);

const renderLoginPage = (onSuccess = vi.fn()) => {
  return render(
    <MemoryRouter>
      <LoginPage onSuccess={onSuccess} />
    </MemoryRouter>,
  );
};

describe("LoginPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the email and password inputs", () => {
    renderLoginPage();
    expect(screen.getByPlaceholderText("Email address")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Password")).toBeInTheDocument();
  });

  it("renders a 'Forgot your password?' link", () => {
    renderLoginPage();
    expect(screen.getByText(/forgot your password\?/i)).toBeInTheDocument();
  });

  it("renders the 'Sign up for Spotify' footer link", () => {
    renderLoginPage();
    expect(
      screen.getByRole("link", { name: /sign up for spotify/i }),
    ).toBeInTheDocument();
  });

  it("renders the 'Don't have an account?' footer text", () => {
    renderLoginPage();
    expect(screen.getByText(/don't have an account\?/i)).toBeInTheDocument();
  });

  it("calls login() and onSuccess on valid submission", async () => {
    const onSuccess = vi.fn();
    mockLogin.mockResolvedValueOnce(undefined);

    renderLoginPage(onSuccess);

    fireEvent.change(screen.getByPlaceholderText("Email address"), {
      target: { value: "user@example.com" },
    });
    fireEvent.change(screen.getByPlaceholderText("Password"), {
      target: { value: "password123" },
    });
    fireEvent.click(screen.getByRole("button", { name: /log in/i }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith("user@example.com", "password123");
      expect(onSuccess).toHaveBeenCalled();
    });
  });

  it("shows an error message when login() rejects", async () => {
    mockLogin.mockRejectedValueOnce(new Error("Invalid credentials"));

    renderLoginPage();

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
