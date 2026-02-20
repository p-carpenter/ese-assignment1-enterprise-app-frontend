import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { RequestResetPasswordForm } from "./components/RequestResetPasswordForm/RequestResetPasswordForm";
import { ResetPasswordForm } from "./components/ResetPasswordForm/ResetPasswordForm";
import { RequestResetPasswordPage } from "./pages/RequestResetPasswordPage/RequestResetPasswordPage";
import { ResetPasswordPage } from "./pages/ResetPasswordPage/ResetPasswordPage";
import { requestPasswordReset, confirmPasswordReset } from "./api";
import "@testing-library/jest-dom/vitest";

// Mock the api module
vi.mock("./api", () => ({
  requestPasswordReset: vi.fn(),
  confirmPasswordReset: vi.fn(),
}));

const mockRequestPasswordReset = vi.mocked(
  requestPasswordReset,
) as unknown as ReturnType<typeof vi.fn>;
const mockConfirmPasswordReset = vi.mocked(
  confirmPasswordReset,
) as unknown as ReturnType<typeof vi.fn>;

describe("Reset Password Features", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("RequestResetPasswordForm", () => {
    it("submits email and calls requestPasswordReset API", async () => {
      mockRequestPasswordReset.mockResolvedValueOnce(undefined);

      render(
        <MemoryRouter>
          <RequestResetPasswordForm />
        </MemoryRouter>,
      );

      const emailInput = screen.getByPlaceholderText("Email address");
      fireEvent.change(emailInput, { target: { value: "user@example.com" } });

      const submitButton = screen.getByRole("button", {
        name: /Request Password Reset/i,
      });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockRequestPasswordReset).toHaveBeenCalledWith(
          "user@example.com",
        );
      });
    });

    it("shows success message after successful request", async () => {
      mockRequestPasswordReset.mockResolvedValueOnce(undefined);

      render(
        <MemoryRouter>
          <RequestResetPasswordForm />
        </MemoryRouter>,
      );

      fireEvent.change(screen.getByPlaceholderText("Email address"), {
        target: { value: "user@example.com" },
      });

      fireEvent.click(
        screen.getByRole("button", { name: /Request Password Reset/i }),
      );

      expect(
        await screen.findByText(
          /Password reset requested! Please check your email/i,
        ),
      ).toBeInTheDocument();
    });

    it("shows error message when API rejects", async () => {
      const errorMessage = "Email not found";
      mockRequestPasswordReset.mockRejectedValueOnce(new Error(errorMessage));

      render(
        <MemoryRouter>
          <RequestResetPasswordForm />
        </MemoryRouter>,
      );

      fireEvent.change(screen.getByPlaceholderText("Email address"), {
        target: { value: "nonexistent@example.com" },
      });

      fireEvent.click(
        screen.getByRole("button", { name: /Request Password Reset/i }),
      );

      expect(await screen.findByText(errorMessage)).toBeInTheDocument();
    });

    it("disables button while loading", async () => {
      mockRequestPasswordReset.mockImplementationOnce(
        () => new Promise(() => {}), // Never resolves
      );

      render(
        <MemoryRouter>
          <RequestResetPasswordForm />
        </MemoryRouter>,
      );

      fireEvent.change(screen.getByPlaceholderText("Email address"), {
        target: { value: "user@example.com" },
      });

      const submitButton = screen.getByRole("button", {
        name: /Request Password Reset/i,
      });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(submitButton).toBeDisabled();
      });
    });

    it("calls onSuccess callback after successful request", async () => {
      const onSuccess = vi.fn();
      mockRequestPasswordReset.mockResolvedValueOnce(undefined);

      render(
        <MemoryRouter>
          <RequestResetPasswordForm onSuccess={onSuccess} />
        </MemoryRouter>,
      );

      fireEvent.change(screen.getByPlaceholderText("Email address"), {
        target: { value: "user@example.com" },
      });

      fireEvent.click(
        screen.getByRole("button", { name: /Request Password Reset/i }),
      );

      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalled();
      });
    });
  });

  describe("ResetPasswordForm", () => {
    it("submits password reset with matching passwords", async () => {
      mockConfirmPasswordReset.mockResolvedValueOnce(undefined);

      render(
        <MemoryRouter initialEntries={["/reset/abc123/token123"]}>
          <Routes>
            <Route path="/reset/:uid/:token" element={<ResetPasswordForm />} />
          </Routes>
        </MemoryRouter>,
      );

      fireEvent.change(screen.getByPlaceholderText("New password"), {
        target: { value: "newpass123" },
      });

      fireEvent.change(screen.getByPlaceholderText("Confirm new password"), {
        target: { value: "newpass123" },
      });

      fireEvent.click(screen.getByRole("button", { name: /Reset Password/i }));

      await waitFor(() => {
        expect(mockConfirmPasswordReset).toHaveBeenCalledWith(
          "abc123",
          "token123",
          "newpass123",
          "newpass123",
        );
      });
    });

    it("shows success message after password reset", async () => {
      mockConfirmPasswordReset.mockResolvedValueOnce(undefined);

      render(
        <MemoryRouter initialEntries={["/reset/abc123/token123"]}>
          <Routes>
            <Route path="/reset/:uid/:token" element={<ResetPasswordForm />} />
          </Routes>
        </MemoryRouter>,
      );

      fireEvent.change(screen.getByPlaceholderText("New password"), {
        target: { value: "newpass123" },
      });

      fireEvent.change(screen.getByPlaceholderText("Confirm new password"), {
        target: { value: "newpass123" },
      });

      fireEvent.click(screen.getByRole("button", { name: /Reset Password/i }));

      expect(
        await screen.findByText(/Password reset successfully!/i),
      ).toBeInTheDocument();
    });

    it("shows error when API call fails", async () => {
      const errorMessage = "Invalid reset token";
      mockConfirmPasswordReset.mockRejectedValueOnce(new Error(errorMessage));

      render(
        <MemoryRouter initialEntries={["/reset/abc123/token123"]}>
          <Routes>
            <Route path="/reset/:uid/:token" element={<ResetPasswordForm />} />
          </Routes>
        </MemoryRouter>,
      );

      fireEvent.change(screen.getByPlaceholderText("New password"), {
        target: { value: "newpass123" },
      });

      fireEvent.change(screen.getByPlaceholderText("Confirm new password"), {
        target: { value: "newpass123" },
      });

      fireEvent.click(screen.getByRole("button", { name: /Reset Password/i }));

      expect(await screen.findByText(errorMessage)).toBeInTheDocument();
    });

    it("shows error when uid or token is missing", async () => {
      render(
        <MemoryRouter initialEntries={["/reset"]}>
          <Routes>
            <Route path="/reset" element={<ResetPasswordForm />} />
          </Routes>
        </MemoryRouter>,
      );

      fireEvent.change(screen.getByPlaceholderText("New password"), {
        target: { value: "newpass123" },
      });

      fireEvent.change(screen.getByPlaceholderText("Confirm new password"), {
        target: { value: "newpass123" },
      });

      fireEvent.click(screen.getByRole("button", { name: /Reset Password/i }));

      expect(
        await screen.findByText(/Invalid reset link/i),
      ).toBeInTheDocument();
    });

    it("disables button while loading", async () => {
      mockConfirmPasswordReset.mockImplementationOnce(
        () => new Promise(() => {}), // Never resolves
      );

      render(
        <MemoryRouter initialEntries={["/reset/abc123/token123"]}>
          <Routes>
            <Route path="/reset/:uid/:token" element={<ResetPasswordForm />} />
          </Routes>
        </MemoryRouter>,
      );

      fireEvent.change(screen.getByPlaceholderText("New password"), {
        target: { value: "newpass123" },
      });

      fireEvent.change(screen.getByPlaceholderText("Confirm new password"), {
        target: { value: "newpass123" },
      });

      const submitButton = screen.getByRole("button", {
        name: /Reset Password/i,
      });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(submitButton).toBeDisabled();
      });
    });

    it("calls onSuccess callback after successful password reset", async () => {
      const onSuccess = vi.fn();
      mockConfirmPasswordReset.mockResolvedValueOnce(undefined);

      render(
        <MemoryRouter initialEntries={["/reset/abc123/token123"]}>
          <Routes>
            <Route
              path="/reset/:uid/:token"
              element={<ResetPasswordForm onSuccess={onSuccess} />}
            />
          </Routes>
        </MemoryRouter>,
      );

      fireEvent.change(screen.getByPlaceholderText("New password"), {
        target: { value: "newpass123" },
      });

      fireEvent.change(screen.getByPlaceholderText("Confirm new password"), {
        target: { value: "newpass123" },
      });

      fireEvent.click(screen.getByRole("button", { name: /Reset Password/i }));

      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalled();
      });
    });
  });

  describe("RequestResetPasswordPage", () => {
    it("renders the form and footer", () => {
      const onSuccess = vi.fn();

      render(
        <MemoryRouter>
          <RequestResetPasswordPage onSuccess={onSuccess} />
        </MemoryRouter>,
      );

      expect(screen.getByText(/Reset your password/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText("Email address")).toBeInTheDocument();
      expect(
        screen.getByText(/Sorted out your password?/i),
      ).toBeInTheDocument();
      expect(screen.getByText("Go back to login")).toBeInTheDocument();
    });

    it("passes onSuccess to the form", async () => {
      const onSuccess = vi.fn();
      mockRequestPasswordReset.mockResolvedValueOnce(undefined);

      render(
        <MemoryRouter>
          <RequestResetPasswordPage onSuccess={onSuccess} />
        </MemoryRouter>,
      );

      fireEvent.change(screen.getByPlaceholderText("Email address"), {
        target: { value: "user@example.com" },
      });

      fireEvent.click(
        screen.getByRole("button", { name: /Request Password Reset/i }),
      );

      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalled();
      });
    });
  });

  describe("ResetPasswordPage", () => {
    it("renders the form and footer", () => {
      const onSuccess = vi.fn();

      render(
        <MemoryRouter initialEntries={["/reset/abc123/token123"]}>
          <Routes>
            <Route
              path="/reset/:uid/:token"
              element={<ResetPasswordPage onSuccess={onSuccess} />}
            />
          </Routes>
        </MemoryRouter>,
      );

      expect(screen.getByText(/Reset your password/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText("New password")).toBeInTheDocument();
      expect(
        screen.getByPlaceholderText("Confirm new password"),
      ).toBeInTheDocument();
      expect(
        screen.getByText(/Sorted out your password?/i),
      ).toBeInTheDocument();
      expect(screen.getByText("Go back to login")).toBeInTheDocument();
    });

    it("passes onSuccess to the form", async () => {
      const onSuccess = vi.fn();
      mockConfirmPasswordReset.mockResolvedValueOnce(undefined);

      render(
        <MemoryRouter initialEntries={["/reset/abc123/token123"]}>
          <Routes>
            <Route
              path="/reset/:uid/:token"
              element={<ResetPasswordPage onSuccess={onSuccess} />}
            />
          </Routes>
        </MemoryRouter>,
      );

      fireEvent.change(screen.getByPlaceholderText("New password"), {
        target: { value: "newpass123" },
      });

      fireEvent.change(screen.getByPlaceholderText("Confirm new password"), {
        target: { value: "newpass123" },
      });

      fireEvent.click(screen.getByRole("button", { name: /Reset Password/i }));

      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalled();
      });
    });
  });
});
