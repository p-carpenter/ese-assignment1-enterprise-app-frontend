import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http, HttpResponse } from "msw";
import { server } from "@/mocks/server";
import { ResetPasswordForm } from "./ResetPasswordForm";

const queryClient = new QueryClient();

const renderResetPasswordForm = () => {
  render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={["/reset/123/abc"]}>
        <Routes>
          <Route path="/reset/:uid/:token" element={<ResetPasswordForm />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
};

describe("ResetPasswordForm", () => {
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
      // Use MSW instead of overriding global.fetch
      server.use(
        http.post("*/reset-password", () => {
          return HttpResponse.json({});
        }),
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
        await screen.findByText(/password reset successfully/i),
      ).toBeInTheDocument();
    });

    it("shows fallback error message if API fails unexpectedly", async () => {
      server.use(
        http.post("*/reset-password", () => {
          return new HttpResponse(null, { status: 500 });
        }),
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
        await screen.findByText(/failed to reset password|unexpected error/i),
      ).toBeInTheDocument();
    });
  });
});
