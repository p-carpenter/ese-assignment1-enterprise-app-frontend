import { describe, it, expect, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { RegistrationForm } from "./RegistrationForm";
import { AuthContext } from "@/shared/context/AuthContext";
import { server } from "@/mocks/server";
import { http, HttpResponse } from "msw";
import { resetHandlerState } from "@/mocks/handlers";
import { renderWithQueryClient } from "@/test/render";

const renderRegistrationForm = () => {
  renderWithQueryClient(
    <MemoryRouter>
      <AuthContext.Provider
        value={{
          user: null,
          loading: false,
          setUser: () => {},
          refreshUser: () => Promise.resolve(),
          login: () => Promise.resolve(),
          logout: () => Promise.resolve(),
        }}
      >
        <RegistrationForm />
      </AuthContext.Provider>
    </MemoryRouter>,
  );
};

describe("RegistrationForm", () => {
  beforeEach(() => {
    resetHandlerState();
  });

  describe("Validation", () => {
    it("shows validation errors for invalid or empty fields", async () => {
      const user = userEvent.setup();
      renderRegistrationForm();

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
    });
  });

  describe("Edge cases", () => {
    it("shows success message after successful registration", async () => {
      const user = userEvent.setup();
      renderRegistrationForm();

      await user.type(
        screen.getByPlaceholderText("Email address"),
        "user@example.com",
      );
      await user.type(screen.getByPlaceholderText("Username"), "username");
      await user.type(screen.getByPlaceholderText("Password"), "password123");
      await user.type(
        screen.getByPlaceholderText("Confirm Password"),
        "password123",
      );
      await user.click(screen.getByRole("button", { name: /sign up/i }));

      expect(
        await screen.findByText(/registration successful/i),
      ).toBeInTheDocument();
    });

    it("shows fallback error message if API fails", async () => {
      server.use(
        http.post(
          "http://localhost:8000/api/auth/registration/",
          () => new HttpResponse(null, { status: 500 }),
        ),
      );

      const user = userEvent.setup();
      renderRegistrationForm();

      await user.type(
        screen.getByPlaceholderText("Email address"),
        "user@example.com",
      );
      await user.type(screen.getByPlaceholderText("Username"), "username");
      await user.type(screen.getByPlaceholderText("Password"), "password123");
      await user.type(
        screen.getByPlaceholderText("Confirm Password"),
        "password123",
      );
      await user.click(screen.getByRole("button", { name: /sign up/i }));

      expect(await screen.findByRole("alert")).toBeInTheDocument();
    });
  });
});
