import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ResetPasswordForm } from "./ResetPasswordForm";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient();

describe("ResetPasswordForm validation", () => {
  it("shows validation errors for empty fields, short passwords, and mismatched passwords", async () => {
    const user = userEvent.setup();
    render(
      <QueryClientProvider client={queryClient}>
        <ResetPasswordForm uid="123" token="abc" onSuccess={vi.fn()} />
      </QueryClientProvider>
    );

    // Try to submit with empty fields
    await user.click(screen.getByRole("button", { name: /reset password/i }));

    expect(await screen.findByText("Password must be at least 8 characters")).toBeInTheDocument();

    // Try a short password and empty confirmation
    await user.type(screen.getByPlaceholderText("New password"), "short");
    await user.click(screen.getByRole("button", { name: /reset password/i }));

    expect(await screen.findByText("Password must be at least 8 characters")).toBeInTheDocument();

    // Try mismatched passwords
    await user.clear(screen.getByPlaceholderText("New password"));
    await user.type(screen.getByPlaceholderText("New password"), "validpassword123");
    await user.type(screen.getByPlaceholderText("Confirm new password"), "mismatch");
    await user.click(screen.getByRole("button", { name: /reset password/i }));

    expect(await screen.findByText("Passwords do not match")).toBeInTheDocument();
  });
});
