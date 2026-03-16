import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RegistrationForm } from "./RegistrationForm";
import { MemoryRouter } from "react-router-dom";
import { AuthContext } from "@/shared/context/AuthContext";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

vi.mock("@/features/auth/api", () => ({
  registerUser: vi.fn(),
}));

const queryClient = new QueryClient();

describe("RegistrationForm validation", () => {
  it("shows validation errors for invalid or empty fields", async () => {
    const user = userEvent.setup();
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

    // Try to submit with empty fields
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

    // Type invalid data
    await user.type(
      screen.getByPlaceholderText("Email address"),
      "not-an-email",
    );
    await user.type(screen.getByPlaceholderText("Username"), "ab"); // Less than 3 chars
    await user.type(screen.getByPlaceholderText("Password"), "short"); // Less than 8 chars
    await user.type(
      screen.getByPlaceholderText("Confirm Password"),
      "mismatch",
    ); // Unmatching
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
