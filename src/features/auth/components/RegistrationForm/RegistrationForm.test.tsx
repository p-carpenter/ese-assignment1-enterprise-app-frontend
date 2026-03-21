import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RegistrationForm } from "./RegistrationForm";
import { AuthContext } from "@/shared/context/AuthContext";

vi.mock("@/features/auth/api", () => ({
  registerUser: vi.fn(),
}));

const queryClient = new QueryClient();

const renderRegistrationForm = () => {
  render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <AuthContext.Provider
          value={{
            user: null,
            loading: false,
            setUser: vi.fn(),
            refreshUser: vi.fn(),
            login: vi.fn(),
            logout: vi.fn(),
          }}
        >
          <RegistrationForm />
        </AuthContext.Provider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
};

describe("RegistrationForm", () => {
  describe("Validation", () => {
    it("shows validation errors for invalid or empty fields", async () => {
      const user = userEvent.setup();
      renderRegistrationForm();

      await user.click(screen.getByRole("button", { name: /sign up/i }));

      expect(
        await screen.findByText("Please enter a valid email address"),
      ).toBeInTheDocument();
      expect(
        await screen.findByText("Username must be at least 3 characters"),
      ).toBeInTheDocument();
      expect(
        await screen.findByText("Password must be at least 8 characters"),
      ).toBeInTheDocument();

      await user.type(
        screen.getByPlaceholderText("Email address"),
        "not-an-email",
      );
      await user.type(screen.getByPlaceholderText("Username"), "ab");
      await user.type(screen.getByPlaceholderText("Password"), "short");
      await user.type(
        screen.getByPlaceholderText("Confirm Password"),
        "mismatch",
      );
      await user.click(screen.getByRole("button", { name: /sign up/i }));

      expect(
        await screen.findByText("Please enter a valid email address"),
      ).toBeInTheDocument();
      expect(
        await screen.findByText("Username must be at least 3 characters"),
      ).toBeInTheDocument();
      expect(
        await screen.findByText("Password must be at least 8 characters"),
      ).toBeInTheDocument();
      expect(
        await screen.findByText("Passwords do not match"),
      ).toBeInTheDocument();
    });
  });

  describe("Edge cases", () => {
    it("shows success message after successful registration", async () => {
      const user = userEvent.setup();
      renderRegistrationForm();

      await user.type(
        screen.getByPlaceholderText("Email address"),
        "user@example.com",
      );
      await user.type(screen.getByPlaceholderText("Username"), "username");
      await user.type(screen.getByPlaceholderText("Password"), "password123");
      await user.type(
        screen.getByPlaceholderText("Confirm Password"),
        "password123",
      );
      await user.click(screen.getByRole("button", { name: /sign up/i }));

      expect(
        await screen.findByText(/registration successful/i),
      ).toBeInTheDocument();
    });

    it("shows fallback error message if error is not ApiError", async () => {
      const user = userEvent.setup();
      renderRegistrationForm();

      await user.type(
        screen.getByPlaceholderText("Email address"),
        "user@example.com",
      );
      await user.type(screen.getByPlaceholderText("Username"), "username");
      await user.type(screen.getByPlaceholderText("Password"), "password123");
      await user.type(
        screen.getByPlaceholderText("Confirm Password"),
        "password123",
      );
      await user.click(screen.getByRole("button", { name: /sign up/i }));

      expect(
        await screen.findByText(/registration failed|unexpected error/i),
      ).toBeInTheDocument();
    });
  });
});
