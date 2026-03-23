import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RequestResetPasswordForm } from "./RequestResetPasswordForm";
import { server } from "@/mocks/server";
import { http, HttpResponse, delay } from "msw";
import { resetHandlerState } from "@/mocks/handlers";

describe("RequestResetPasswordForm", () => {
  const user = userEvent.setup();

  beforeEach(() => {
    resetHandlerState();
  });

  it("shows validation error for empty or invalid email", async () => {
    render(<RequestResetPasswordForm />);

    await user.click(
      screen.getByRole("button", { name: /request password reset/i }),
    );
    expect(
      await screen.findByText("Please enter a valid email address"),
    ).toBeInTheDocument();

    await user.type(
      screen.getByPlaceholderText("Email address"),
      "not-an-email",
    );
    await user.click(
      screen.getByRole("button", { name: /request password reset/i }),
    );
    expect(
      await screen.findByText("Please enter a valid email address"),
    ).toBeInTheDocument();
  });

  it("submits successfully, shows loading state, and displays success message", async () => {
    server.use(
      http.post("http://localhost:8000/api/auth/password/reset/", async () => {
        await delay(100);
        return HttpResponse.json({
          detail: "Password reset e-mail has been sent.",
        });
      }),
    );

    render(<RequestResetPasswordForm />);

    await user.type(
      screen.getByPlaceholderText("Email address"),
      "test@example.com",
    );
    await user.click(
      screen.getByRole("button", { name: /request password reset/i }),
    );

    expect(
      screen.getByRole("button", { name: /requesting password reset/i }),
    ).toBeDisabled();

    expect(
      await screen.findByText(
        "Password reset requested! Please check your email for a confirmation link.",
      ),
    ).toBeInTheDocument();
  });

  it("displays specific ApiError message when the server rejects the request", async () => {
    server.use(
      http.post("http://localhost:8000/api/auth/password/reset/", () =>
        HttpResponse.json(
          { detail: "Rate limited. Try again later." },
          { status: 429 },
        ),
      ),
    );

    render(<RequestResetPasswordForm />);

    await user.type(
      screen.getByPlaceholderText("Email address"),
      "test@example.com",
    );
    await user.click(
      screen.getByRole("button", { name: /request password reset/i }),
    );

    expect(
      await screen.findByText("Rate limited. Try again later."),
    ).toBeInTheDocument();
  });

  it("displays standard error message when request fails with a generic Error", async () => {
    server.use(
      http.post("http://localhost:8000/api/auth/password/reset/", () =>
        HttpResponse.error(),
      ),
    );

    render(<RequestResetPasswordForm />);

    await user.type(
      screen.getByPlaceholderText("Email address"),
      "test@example.com",
    );
    await user.click(
      screen.getByRole("button", { name: /request password reset/i }),
    );

    expect(await screen.findByRole("alert")).toBeInTheDocument();
  });
});
