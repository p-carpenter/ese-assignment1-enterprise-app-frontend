import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { RequestResetPasswordForm } from "./components/RequestResetPasswordForm/RequestResetPasswordForm";
import { ResetPasswordForm } from "./components/ResetPasswordForm/ResetPasswordForm";
import { RequestResetPasswordPage } from "./pages/RequestResetPasswordPage/RequestResetPasswordPage";
import { ResetPasswordPage } from "./pages/ResetPasswordPage/ResetPasswordPage";
import { server } from "@/mocks/server";
import { http, HttpResponse, delay } from "msw";
import { resetHandlerState } from "@/mocks/handlers";

describe("Reset Password Features", () => {
  beforeEach(() => {
    resetHandlerState();
  });

  describe("RequestResetPasswordForm", () => {
    it("shows success message after successful request", async () => {
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
      expect(screen.getByRole("status")).toBeInTheDocument();
    });

    it("shows error message when API rejects with a general error", async () => {
      server.use(
        http.post(
          "http://localhost:8000/api/auth/password/reset/",
          () => new HttpResponse(null, { status: 500 }),
        ),
      );

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

      // Assuming your ApiError fallback displays a generic message for 500s
      expect(await screen.findByRole("alert")).toBeInTheDocument();
    });

    it("shows error message when API rejects with specific field error", async () => {
      server.use(
        http.post("http://localhost:8000/api/auth/password/reset/", () =>
          HttpResponse.json(
            { email: ["No account found with this email."] },
            { status: 400 },
          ),
        ),
      );

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

      expect(
        await screen.findByText(/No account found with this email/i),
      ).toBeInTheDocument();
      expect(screen.getByRole("alert")).toBeInTheDocument();
    });

    it("disables button while loading", async () => {
      server.use(
        http.post(
          "http://localhost:8000/api/auth/password/reset/",
          async () => {
            await delay("infinite");
            return new HttpResponse(null, { status: 200 });
          },
        ),
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
  });

  describe("ResetPasswordForm", () => {
    it("shows success message after password reset", async () => {
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
      expect(screen.getByRole("status")).toBeInTheDocument();
    });

    it("shows error when API call fails", async () => {
      server.use(
        http.post(
          "http://localhost:8000/api/auth/password/reset/confirm/",
          () =>
            HttpResponse.json(
              { detail: "Invalid reset token" },
              { status: 400 },
            ),
        ),
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
      fireEvent.click(screen.getByRole("button", { name: /Reset Password/i }));

      expect(
        await screen.findByText("Invalid reset token"),
      ).toBeInTheDocument();
      expect(screen.getByRole("alert")).toBeInTheDocument();
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
      expect(screen.getByRole("alert")).toBeInTheDocument();
    });

    it("disables button while loading", async () => {
      server.use(
        http.post(
          "http://localhost:8000/api/auth/password/reset/confirm/",
          async () => {
            await delay("infinite");
            return new HttpResponse(null, { status: 200 });
          },
        ),
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
  });

  describe("RequestResetPasswordPage", () => {
    it("renders the form and footer", () => {
      render(
        <MemoryRouter>
          <RequestResetPasswordPage />
        </MemoryRouter>,
      );

      expect(screen.getByText(/Reset your password/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText("Email address")).toBeInTheDocument();
      expect(
        screen.getByText(/Remembered your password\?/i),
      ).toBeInTheDocument();
      expect(screen.getByText("Go back to login")).toBeInTheDocument();
    });
  });

  describe("ResetPasswordPage", () => {
    it("renders the form and footer", () => {
      render(
        <MemoryRouter initialEntries={["/reset/abc123/token123"]}>
          <Routes>
            <Route path="/reset/:uid/:token" element={<ResetPasswordPage />} />
          </Routes>
        </MemoryRouter>,
      );

      expect(screen.getByText(/Reset your password/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText("New password")).toBeInTheDocument();
      expect(
        screen.getByPlaceholderText("Confirm new password"),
      ).toBeInTheDocument();
      expect(
        screen.getByText(/Sorted out your password\?/i),
      ).toBeInTheDocument();
      expect(screen.getByText("Go back to login")).toBeInTheDocument();
    });
  });
});
