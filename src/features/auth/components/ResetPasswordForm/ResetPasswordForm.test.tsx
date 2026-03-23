import { describe, it, expect, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { http, HttpResponse } from "msw";
import { server } from "@/mocks/server";
import { resetHandlerState } from "@/mocks/handlers";
import { renderWithQueryClient } from "@/test/render";
import { ResetPasswordForm } from "./ResetPasswordForm";

const renderResetPasswordForm = () => {
  renderWithQueryClient(
    <MemoryRouter initialEntries={["/reset/123/abc"]}>
      <Routes>
        <Route path="/reset/:uid/:token" element={<ResetPasswordForm />} />
      </Routes>
    </MemoryRouter>,
  );
};

describe("ResetPasswordForm", () => {
  beforeEach(() => {
    resetHandlerState();
  });

  describe("Validation", () => {
    it("shows validation errors for empty fields, short passwords, and mismatched passwords", async () => {
      const user = userEvent.setup();
      renderResetPasswordForm();

      await user.click(screen.getByRole("button", { name: /reset password/i }));
      expect(
        await screen.findByText("Password must be at least 8 characters"),
      ).toBeInTheDocument();

      await user.type(screen.getByPlaceholderText("New password"), "short");
      await user.click(screen.getByRole("button", { name: /reset password/i }));
      expect(
        await screen.findByText("Password must be at least 8 characters"),
      ).toBeInTheDocument();

      await user.clear(screen.getByPlaceholderText("New password"));
      await user.type(
        screen.getByPlaceholderText("New password"),
        "validpassword123",
      );
      await user.type(
        screen.getByPlaceholderText("Confirm new password"),
        "mismatch",
      );
      await user.click(screen.getByRole("button", { name: /reset password/i }));

      expect(
        await screen.findByText("Passwords do not match"),
      ).toBeInTheDocument();
    });
  });

  describe("API Interactions & Edge Cases", () => {
    it("shows success message after successful reset", async () => {
      const user = userEvent.setup();
      renderResetPasswordForm();

      await user.type(
        screen.getByPlaceholderText("New password"),
        "validpassword123",
      );
      await user.type(
        screen.getByPlaceholderText("Confirm new password"),
        "validpassword123",
      );
      await user.click(screen.getByRole("button", { name: /reset password/i }));

      expect(
        await screen.findByText(/password reset successfully/i),
      ).toBeInTheDocument();
    });

    it("shows fallback error message if API fails unexpectedly", async () => {
      server.use(
        http.post(
          "http://localhost:8000/api/auth/password/reset/confirm/",
          () =>
            HttpResponse.json(
              { detail: "Failed to reset password" },
              { status: 500 },
            ),
        ),
      );

      const user = userEvent.setup();
      renderResetPasswordForm();

      await user.type(
        screen.getByPlaceholderText("New password"),
        "validpassword123",
      );
      await user.type(
        screen.getByPlaceholderText("Confirm new password"),
        "validpassword123",
      );
      await user.click(screen.getByRole("button", { name: /reset password/i }));

      expect(
        await screen.findByText(/failed to reset password/i),
      ).toBeInTheDocument();
    });
  });
});
