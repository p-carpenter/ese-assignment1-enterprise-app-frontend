import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LoginForm } from "./LoginForm";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthContext } from "@/shared/context/AuthContext";

vi.mock("@/features/auth/api", () => ({
  login: vi.fn(),
}));

const queryClient = new QueryClient();

describe("LoginForm validation", () => {
  it("shows validation errors for empty fields and invalid emails", async () => {
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
            <LoginForm />
          </AuthContext.Provider>
        </MemoryRouter>
      </QueryClientProvider>,
    );

    // Try to submit without filling out any fields
    await user.click(screen.getByRole("button", { name: /log in/i }));

    expect(
      await screen.findByText("Please enter a valid email address"),
    ).toBeInTheDocument();
    expect(await screen.findByText("Password is required")).toBeInTheDocument();

    // Type an invalid email
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
