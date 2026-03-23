import { describe, it, expect, beforeEach } from "vitest";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { LoginForm } from "./components/LoginForm/LoginForm";
import { RegistrationForm } from "./components/RegistrationForm/RegistrationForm";
import { ProtectedRoute } from "./components/ProtectedRoute/ProtectedRoute";
import { AuthProvider } from "@/shared/context/AuthContext";
import { server } from "@/mocks/server";
import { http, HttpResponse, delay } from "msw";
import { resetHandlerState } from "@/mocks/handlers";

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

describe("Auth features", () => {
  beforeEach(() => {
    resetHandlerState();
  });

  it("submits login form and refreshes user", async () => {
    render(
      <QueryClientProvider client={createTestQueryClient()}>
        <MemoryRouter>
          <AuthProvider>
            <LoginForm />
          </AuthProvider>
        </MemoryRouter>
      </QueryClientProvider>,
    );

    await waitFor(() =>
      expect(screen.getByPlaceholderText("Email address")).toBeInTheDocument(),
    );

    await act(async () => {
      fireEvent.change(screen.getByPlaceholderText("Email address"), {
        target: { value: "test@test.com" },
      });
      fireEvent.change(screen.getByPlaceholderText("Password"), {
        target: { value: "secret" },
      });
      fireEvent.click(screen.getByRole("button", { name: /log in/i }));
    });

    // MSW will return 200 by default.
    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /log in/i }),
      ).not.toBeDisabled();
    });
  });

  it("shows login error when api rejects", async () => {
    server.use(
      http.post(
        "http://localhost:8000/api/auth/login/",
        () =>
          new HttpResponse(
            JSON.stringify({ non_field_errors: ["Invalid credentials"] }),
            { status: 400 },
          ),
      ),
    );

    render(
      <QueryClientProvider client={createTestQueryClient()}>
        <MemoryRouter>
          <AuthProvider>
            <LoginForm />
          </AuthProvider>
        </MemoryRouter>
      </QueryClientProvider>,
    );

    await act(async () => {
      fireEvent.change(screen.getByPlaceholderText("Email address"), {
        target: { value: "user@example.com" },
      });
      fireEvent.change(screen.getByPlaceholderText("Password"), {
        target: { value: "bad" },
      });
      fireEvent.click(screen.getByRole("button", { name: /log in/i }));
    });

    expect(await screen.findByText("Invalid credentials")).toBeInTheDocument();
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });

  it("submits registration form and shows success message", async () => {
    render(
      <MemoryRouter>
        <RegistrationForm />
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

    expect(
      await screen.findByText(/Registration successful!/i),
    ).toBeInTheDocument();
    expect(screen.getByRole("status")).toBeInTheDocument();
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

  it("shows registration error with ApiError field-level details", async () => {
    server.use(
      http.post(
        "http://localhost:8000/api/auth/registration/",
        () =>
          new HttpResponse(
            JSON.stringify({
              email: ["A user with this email already exists."],
            }),
            { status: 400 },
          ),
      ),
    );

    render(
      <MemoryRouter>
        <RegistrationForm />
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByPlaceholderText("Username"), {
      target: { value: "taken" },
    });
    fireEvent.change(screen.getByPlaceholderText("Email address"), {
      target: { value: "taken@example.com" },
    });
    fireEvent.change(screen.getByPlaceholderText("Password"), {
      target: { value: "pass1234" },
    });
    fireEvent.change(screen.getByPlaceholderText("Confirm Password"), {
      target: { value: "pass1234" },
    });

    fireEvent.click(screen.getByRole("button", { name: /sign up/i }));

    expect(
      await screen.findByText(/A user with this email already exists/i),
    ).toBeInTheDocument();
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });

  it("disables the login button while the request is in flight", async () => {
    server.use(
      http.post("http://localhost:8000/api/auth/login/", async () => {
        await delay("infinite");
        return new HttpResponse(null, { status: 200 });
      }),
    );

    render(
      <QueryClientProvider client={createTestQueryClient()}>
        <MemoryRouter>
          <AuthProvider>
            <LoginForm />
          </AuthProvider>
        </MemoryRouter>
      </QueryClientProvider>,
    );

    fireEvent.change(screen.getByPlaceholderText("Email address"), {
      target: { value: "user@example.com" },
    });
    fireEvent.change(screen.getByPlaceholderText("Password"), {
      target: { value: "secret" },
    });

    const submitButton = screen.getByRole("button", { name: /log in/i });
    fireEvent.click(submitButton);

    await waitFor(() => expect(submitButton).toBeDisabled());
  });
});
