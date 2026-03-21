import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { LoginForm } from "./LoginForm";
import { AuthContext } from "@/shared/context/AuthContext";

vi.mock("@/features/auth/api", () => ({
  login: vi.fn(),
}));

const queryClient = new QueryClient();

const renderLoginForm = (loginMock = vi.fn()) => {
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <AuthContext.Provider
          value={{
            user: null,
            loading: false,
            setUser: vi.fn(),
            refreshUser: vi.fn(),
            login: loginMock,
            logout: vi.fn(),
          }}
        >
          <LoginForm />
        </AuthContext.Provider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
};

describe("LoginForm", () => {
  describe("Validation", () => {
    it("shows validation errors for empty fields and invalid emails", async () => {
      const user = userEvent.setup();
      renderLoginForm();

      // Submit empty.
      await user.click(screen.getByRole("button", { name: /log in/i }));

      expect(
        await screen.findByText("Please enter a valid email address"),
      ).toBeInTheDocument();
      expect(
        await screen.findByText("Password is required"),
      ).toBeInTheDocument();

      // Invalid email.
      await user.type(
        screen.getByPlaceholderText("Email address"),
        "not-an-email",
      );
      await user.click(screen.getByRole("button", { name: /log in/i }));

      expect(
        await screen.findByText("Please enter a valid email address"),
      ).toBeInTheDocument();
    });
  });

  describe("Edge cases", () => {
    it("shows fallback error message if error is not ApiError or Error", async () => {
      const loginMock = vi.fn().mockRejectedValue("not-an-error-object");
      const user = userEvent.setup();

      renderLoginForm(loginMock);

      await user.type(
        screen.getByPlaceholderText("Email address"),
        "user@example.com",
      );
      await user.type(screen.getByPlaceholderText("Password"), "password123");
      await user.click(screen.getByRole("button", { name: /log in/i }));

      expect(await screen.findByText(/login failed/i)).toBeInTheDocument();
    });
  });
});
