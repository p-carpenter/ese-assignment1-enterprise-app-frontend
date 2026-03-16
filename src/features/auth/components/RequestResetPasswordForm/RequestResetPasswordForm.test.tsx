import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RequestResetPasswordForm } from "./RequestResetPasswordForm";
import { requestPasswordReset } from "../../api";
import { ApiError } from "@/shared/api/errors";

vi.mock("../../api", () => ({
    requestPasswordReset: vi.fn(),
}));

describe("RequestResetPasswordForm", () => {
    const user = userEvent.setup();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("shows validation error for empty or invalid email", async () => {
        render(<RequestResetPasswordForm />);

        await user.click(screen.getByRole("button", { name: /request password reset/i }));
        expect(await screen.findByText("Please enter a valid email address")).toBeInTheDocument();

        await user.type(screen.getByPlaceholderText("Email address"), "not-an-email");
        await user.click(screen.getByRole("button", { name: /request password reset/i }));
        expect(await screen.findByText("Please enter a valid email address")).toBeInTheDocument();

        expect(requestPasswordReset).not.toHaveBeenCalled();
    });

    it("submits successfully, shows loading state, and displays success message", async () => {
        let resolveApi: (value?: unknown) => void;
        const promise = new Promise((resolve) => {
            resolveApi = resolve;
        });
        vi.mocked(requestPasswordReset).mockReturnValue(promise as Promise<void>);

        render(<RequestResetPasswordForm />);

        await user.type(screen.getByPlaceholderText("Email address"), "test@example.com");
        await user.click(screen.getByRole("button", { name: /request password reset/i }));

        const button = screen.getByRole("button", { name: /requesting password reset/i });
        expect(button).toBeDisabled();
        expect(requestPasswordReset).toHaveBeenCalledWith("test@example.com");

        resolveApi!();

        expect(
            await screen.findByText("Password reset requested! Please check your email for a confirmation link.")
        ).toBeInTheDocument();

        expect(screen.getByRole("button", { name: /request password reset/i })).toBeDisabled();
    });

    it("displays specific ApiError message when the server rejects the request", async () => {
        const mockApiError = new ApiError(
            429,
            { detail: "Rate limited. Try again later." }, 
            "Request failed"
        );

        vi.mocked(requestPasswordReset).mockRejectedValue(mockApiError);

        render(<RequestResetPasswordForm />);

        await user.type(screen.getByPlaceholderText("Email address"), "test@example.com");
        await user.click(screen.getByRole("button", { name: /request password reset/i }));

        expect(await screen.findByText("Rate limited. Try again later.")).toBeInTheDocument();
    });

    it("displays standard error message when request fails with a generic Error", async () => {
        vi.mocked(requestPasswordReset).mockRejectedValue(new Error("Network offline"));

        render(<RequestResetPasswordForm />);

        await user.type(screen.getByPlaceholderText("Email address"), "test@example.com");
        await user.click(screen.getByRole("button", { name: /request password reset/i }));

        expect(await screen.findByText("Network offline")).toBeInTheDocument();
    });
});