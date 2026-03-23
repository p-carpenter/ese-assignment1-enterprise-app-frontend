import { describe, it, expect, beforeEach } from "vitest";
import { screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { LoginPage } from "./LoginPage";
import { AuthProvider } from "@/shared/context/AuthContext";
import { server } from "@/mocks/server";
import { http, HttpResponse } from "msw";
import { resetHandlerState } from "@/mocks/handlers";
import { renderWithQueryClient } from "@/test/render";

const renderLoginPage = () => {
  return renderWithQueryClient(
    <MemoryRouter>
      <AuthProvider>
        <LoginPage />
      </AuthProvider>
    </MemoryRouter>,
  );
};

describe("LoginPage", () => {
  beforeEach(() => {
    resetHandlerState();
  });

  it("renders the email and password inputs", async () => {
    renderLoginPage();
    expect(
      await screen.findByPlaceholderText("Email address"),
    ).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Password")).toBeInTheDocument();
  });

  it("renders a 'Forgot your password?' link", async () => {
    renderLoginPage();
    expect(
      await screen.findByText(/forgot your password\?/i),
    ).toBeInTheDocument();
  });

  it("renders the 'Sign up' footer link", async () => {
    renderLoginPage();
    expect(
      await screen.findByRole("link", { name: /sign up/i }),
    ).toBeInTheDocument();
  });

  it("shows an error message when login rejects", async () => {
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

    renderLoginPage();

    const emailInput = await screen.findByPlaceholderText("Email address");
    fireEvent.change(emailInput, { target: { value: "bad@example.com" } });
    fireEvent.change(screen.getByPlaceholderText("Password"), {
      target: { value: "wrong" },
    });
    fireEvent.click(screen.getByRole("button", { name: /log in/i }));

    expect(await screen.findByText("Invalid credentials")).toBeInTheDocument();
  });
});
