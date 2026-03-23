import { describe, it, expect, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { LoginForm } from "./LoginForm";
import { AuthProvider } from "@/shared/context/AuthContext";
import { renderWithQueryClient } from "@/test/render";
import { server } from "@/mocks/server";
import { http, HttpResponse } from "msw";
import { resetHandlerState } from "@/mocks/handlers";

const renderLoginForm = () => {
  return renderWithQueryClient(
    <MemoryRouter>
      <AuthProvider>
        <LoginForm />
      </AuthProvider>
    </MemoryRouter>,
  );
};

describe("LoginForm", () => {
  beforeEach(() => {
    resetHandlerState();
  });

  describe("Validation", () => {
    it("shows validation errors for empty fields and invalid emails", async () => {
      const user = userEvent.setup();
      renderLoginForm();

      await user.click(screen.getByRole("button", { name: /log in/i }));

      expect(
        await screen.findByText("Please enter a valid email address"),
      ).toBeInTheDocument();
      expect(
        await screen.findByText("Password is required"),
      ).toBeInTheDocument();

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
    it("shows standard error message for generic network failures", async () => {
      server.use(
        http.post("http://localhost:8000/api/auth/login/", () =>
          HttpResponse.error(),
        ),
      );

      const user = userEvent.setup();
      renderLoginForm();

      await user.type(
        screen.getByPlaceholderText("Email address"),
        "user@example.com",
      );
      await user.type(screen.getByPlaceholderText("Password"), "password123");
      await user.click(screen.getByRole("button", { name: /log in/i }));

      await waitFor(() => {
        expect(screen.getByRole("alert")).toBeInTheDocument();
      });
    });
  });
});
