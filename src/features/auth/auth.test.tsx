import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { LoginForm } from "./components/LoginForm/LoginForm";
import { RegistrationForm } from "./components/RegistrationForm/RegistrationForm";
import { ProtectedRoute } from "./components/ProtectedRoute/ProtectedRoute";
import { login, register } from "./api";
import "@testing-library/jest-dom/vitest";

vi.mock("./api", () => ({
  login: vi.fn(),
  register: vi.fn(),
}));

const mockLogin = vi.mocked(login) as unknown as ReturnType<typeof vi.fn>;
const mockRegister = vi.mocked(register) as unknown as ReturnType<typeof vi.fn>;

describe("Auth features", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("submits login form and calls onSuccess", async () => {
    const onSuccess = vi.fn();
    mockLogin.mockResolvedValueOnce(undefined);

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
      expect(mockLogin).toHaveBeenCalledWith("user@example.com", "secret");
      expect(onSuccess).toHaveBeenCalled();
    });
  });

  it("shows login error when api rejects", async () => {
    mockLogin.mockRejectedValueOnce(new Error("Invalid credentials"));

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
    mockRegister.mockResolvedValueOnce(undefined);

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
      expect(mockRegister).toHaveBeenCalledWith(
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

  it("disables the login button while the request is in flight", async () => {
    mockLogin.mockImplementationOnce(() => new Promise(() => {})); // never resolves

    render(
      <MemoryRouter>
        <LoginForm />
      </MemoryRouter>,
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

  it("shows a registration error when the api rejects", async () => {
    mockRegister.mockRejectedValueOnce(new Error("Email already in use"));

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
      await screen.findByText("Email already in use"),
    ).toBeInTheDocument();
  });

  it("disables the registration button while the request is in flight", async () => {
    mockRegister.mockImplementationOnce(() => new Promise(() => {}));

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

    const submitButton = screen.getByRole("button", { name: /sign up/i });
    fireEvent.click(submitButton);

    await waitFor(() => expect(submitButton).toBeDisabled());
  });
});
