import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ChangePasswordForm } from "./ChangePasswordForm";
import { server } from "@/mocks/server";
import { http, HttpResponse, delay } from "msw";
import { resetHandlerState } from "@/mocks/handlers";
import { renderWithQueryClient } from "@/test/render";

describe("ChangePasswordForm", () => {
  const mockOnSuccess = vi.fn();
  const mockOnCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    resetHandlerState();
  });

  it("renders input fields and buttons", () => {
    renderWithQueryClient(
      <ChangePasswordForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />,
    );
    expect(screen.getByPlaceholderText("Current Password")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("New Password")).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("Confirm New Password"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Change Password" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
  });

  it("shows generic error message if server rejects", async () => {
    server.use(
      http.post("http://localhost:8000/api/auth/password/change/", () =>
        HttpResponse.error(),
      ),
    );

    const user = userEvent.setup();
    renderWithQueryClient(
      <ChangePasswordForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />,
    );

    await user.type(screen.getByPlaceholderText("Current Password"), "wrong");
    await user.type(screen.getByPlaceholderText("New Password"), "newpass8");
    await user.type(
      screen.getByPlaceholderText("Confirm New Password"),
      "newpass8",
    );
    await user.click(screen.getByRole("button", { name: "Change Password" }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeInTheDocument();
    });
  });

  it("calls onCancel when cancel button is clicked", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(
      <ChangePasswordForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />,
    );
    await user.click(screen.getByRole("button", { name: /cancel/i }));
    expect(mockOnCancel).toHaveBeenCalled();
  });

  it("disables button while pending", async () => {
    server.use(
      http.post("http://localhost:8000/api/auth/password/change/", async () => {
        await delay("infinite");
        return new HttpResponse(null, { status: 200 });
      }),
    );

    const user = userEvent.setup();
    renderWithQueryClient(
      <ChangePasswordForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />,
    );

    await user.type(screen.getByPlaceholderText("Current Password"), "pass");
    await user.type(screen.getByPlaceholderText("New Password"), "newpass8");
    await user.type(
      screen.getByPlaceholderText("Confirm New Password"),
      "newpass8",
    );
    await user.click(screen.getByRole("button", { name: "Change Password" }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /saving/i })).toBeDisabled();
    });
  });
});
