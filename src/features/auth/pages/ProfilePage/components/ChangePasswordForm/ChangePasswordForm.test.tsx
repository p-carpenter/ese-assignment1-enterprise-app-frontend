import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ChangePasswordForm } from "./ChangePasswordForm";
import { changePassword } from "@/features/auth/api";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ApiError } from "@/shared/api/errors";

vi.mock("@/features/auth/api", () => ({
  changePassword: vi.fn(),
}));

const mockChangePassword = vi.mocked(changePassword);

const renderWithClient = (ui: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>,
  );
};

describe("ChangePasswordForm", () => {
  const mockOnSuccess = vi.fn();
  const mockOnCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders input fields and buttons", () => {
    renderWithClient(
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
  });

  it("shows validation error if new passwords do not match", async () => {
    const user = userEvent.setup();
    renderWithClient(
      <ChangePasswordForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />,
    );

    await user.type(
      screen.getByPlaceholderText("Current Password"),
      "oldpass123",
    );
    await user.type(screen.getByPlaceholderText("New Password"), "newpass123");
    await user.type(
      screen.getByPlaceholderText("Confirm New Password"),
      "mismatch123",
    );
    await user.click(screen.getByRole("button", { name: "Change Password" }));

    expect(
      await screen.findByText("New passwords do not match"),
    ).toBeInTheDocument();
    expect(mockChangePassword).not.toHaveBeenCalled();
  });

  it("calls API and triggers onSuccess when valid", async () => {
    const user = userEvent.setup();
    mockChangePassword.mockResolvedValueOnce(undefined);
    renderWithClient(
      <ChangePasswordForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />,
    );

    await user.type(screen.getByPlaceholderText("Current Password"), "oldpass");
    await user.type(screen.getByPlaceholderText("New Password"), "newpass123");
    await user.type(
      screen.getByPlaceholderText("Confirm New Password"),
      "newpass123",
    );
    await user.click(screen.getByRole("button", { name: "Change Password" }));

    await waitFor(() => {
      expect(mockChangePassword).toHaveBeenCalledWith(
        "oldpass",
        "newpass123",
        "newpass123",
      );
      expect(mockOnSuccess).toHaveBeenCalled();
    });
  });

  it("displays API errors from ApiError correctly", async () => {
    const user = userEvent.setup();
    const error = new ApiError(400, { detail: "Invalid current password" });
    mockChangePassword.mockRejectedValueOnce(error);
    renderWithClient(
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
      expect(screen.getByText("Invalid current password")).toBeInTheDocument();
    });
  });

  it("displays non_field_errors from ApiError", async () => {
    const user = userEvent.setup();
    const error = new ApiError(400, {
      non_field_errors: ["Account is locked."],
    });
    mockChangePassword.mockRejectedValueOnce(error);
    renderWithClient(
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
      expect(screen.getByText("Account is locked.")).toBeInTheDocument();
    });
  });

  it("displays generic error for non-ApiError rejections", async () => {
    const user = userEvent.setup();
    mockChangePassword.mockRejectedValueOnce(new Error("Network failure"));
    renderWithClient(
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
      expect(screen.getByText("Network failure")).toBeInTheDocument();
    });
  });

  it("calls onCancel when cancel button is clicked", async () => {
    const user = userEvent.setup();
    renderWithClient(
      <ChangePasswordForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />,
    );
    await user.click(screen.getByRole("button", { name: /cancel/i }));
    expect(mockOnCancel).toHaveBeenCalled();
  });

  it("disables button while pending", async () => {
    mockChangePassword.mockImplementation(() => new Promise(() => {}));
    const user = userEvent.setup();
    renderWithClient(
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
