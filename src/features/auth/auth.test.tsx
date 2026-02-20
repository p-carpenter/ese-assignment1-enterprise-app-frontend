import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import LoginForm from "../components/features/auth/LoginForm";
import RegistrationForm from "../components/features/auth/RegistrationForm";
import { ProtectedRoute } from "../components/features/auth/ProtectedRoute";
import { api } from "../services/api";
import "@testing-library/jest-dom/vitest";

vi.mock("../services/api", () => ({
  api: {
    auth: {
      login: vi.fn(),
      register: vi.fn(),
    },
  },
}));

const mockedApi = api as unknown as {
  auth: {
    login: ReturnType<typeof vi.fn>;
    register: ReturnType<typeof vi.fn>;
  };
};

describe("Auth features", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("submits login form and calls onSuccess", async () => {
    const onSuccess = vi.fn();
    mockedApi.auth.login.mockResolvedValueOnce(undefined);

    render(
      <MemoryRouter>
        <LoginForm onSuccess={onSuccess} />
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByPlaceholderText("Email address"), {
      target: { value: "user@example.com" },
    });
    fireEvent.change(screen.getByPlaceholderText("Password"), {
      target: { value: "secret" },
    });

    fireEvent.click(screen.getByRole("button", { name: /log in/i }));

    await waitFor(() => {
      expect(mockedApi.auth.login).toHaveBeenCalledWith(
        "user@example.com",
        "secret",
      );
      expect(onSuccess).toHaveBeenCalled();
    });
  });

  it("shows login error when api rejects", async () => {
    mockedApi.auth.login.mockRejectedValueOnce(
      new Error("Invalid credentials"),
    );

    render(
      <MemoryRouter>
        <LoginForm />
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByPlaceholderText("Email address"), {
      target: { value: "user@example.com" },
    });
    fireEvent.change(screen.getByPlaceholderText("Password"), {
      target: { value: "bad" },
    });

    fireEvent.click(screen.getByRole("button", { name: /log in/i }));

    expect(await screen.findByText("Invalid credentials")).toBeInTheDocument();
  });

  it("submits registration form and shows success message", async () => {
    const onSuccess = vi.fn();
    mockedApi.auth.register.mockResolvedValueOnce(undefined);

    render(
      <MemoryRouter>
        <RegistrationForm onSuccess={onSuccess} />
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByPlaceholderText("Username"), {
      target: { value: "newuser" },
    });
    fireEvent.change(screen.getByPlaceholderText("Email address"), {
      target: { value: "new@example.com" },
    });
    fireEvent.change(screen.getByPlaceholderText("Password"), {
      target: { value: "pass1234" },
    });
    fireEvent.change(screen.getByPlaceholderText("Confirm Password"), {
      target: { value: "pass1234" },
    });

    fireEvent.click(screen.getByRole("button", { name: /sign up/i }));

    await waitFor(() => {
      expect(mockedApi.auth.register).toHaveBeenCalledWith(
        "newuser",
        "new@example.com",
        "pass1234",
        "pass1234",
      );
      expect(onSuccess).toHaveBeenCalled();
    });

    expect(
      await screen.findByText(/Registration successful!/i),
    ).toBeInTheDocument();
  });

  it("redirects to login when not authenticated", () => {
    render(
      <MemoryRouter initialEntries={["/private"]}>
        <Routes>
          <Route
            path="/private"
            element={
              <ProtectedRoute isAuthenticated={false}>
                <div>Private Page</div>
              </ProtectedRoute>
            }
          />
          <Route path="/login" element={<div>Login Page</div>} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText("Login Page")).toBeInTheDocument();
  });

  it("renders private content when authenticated", () => {
    render(
      <MemoryRouter initialEntries={["/private"]}>
        <Routes>
          <Route
            path="/private"
            element={
              <ProtectedRoute isAuthenticated={true}>
                <div>Private Page</div>
              </ProtectedRoute>
            }
          />
          <Route path="/login" element={<div>Login Page</div>} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText("Private Page")).toBeInTheDocument();
  });
});
