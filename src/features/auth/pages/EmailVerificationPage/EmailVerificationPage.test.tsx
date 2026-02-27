import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { EmailVerificationPage } from "./EmailVerificationPage";
import { verifyRegistrationEmail } from "../../api";
import "@testing-library/jest-dom/vitest";

const mockNavigate = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual =
    await vi.importActual<typeof import("react-router-dom")>(
      "react-router-dom",
    );
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock("../../api", () => ({
  verifyRegistrationEmail: vi.fn(),
}));

const mockVerifyRegistrationEmail = vi.mocked(
  verifyRegistrationEmail,
) as unknown as ReturnType<typeof vi.fn>;

const renderPageAtRoute = (initialPath: string, routePath: string) => {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path={routePath} element={<EmailVerificationPage />} />
      </Routes>
    </MemoryRouter>,
  );
};

describe("EmailVerificationPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("shows success and redirects to login when verification succeeds", async () => {
    mockVerifyRegistrationEmail.mockResolvedValueOnce(undefined);
    const setTimeoutSpy = vi.spyOn(globalThis, "setTimeout");

    renderPageAtRoute("/verify/abc123", "/verify/:key");

    expect(screen.getByText("Verifying your email...")).toBeInTheDocument();

    await waitFor(() => {
      expect(mockVerifyRegistrationEmail).toHaveBeenCalledWith("abc123");
    });

    expect(
      await screen.findByText(/Your email has been verified!/i),
    ).toBeInTheDocument();

    const redirectTimerCall = setTimeoutSpy.mock.calls.find(
      (call) => call[1] === 3000,
    );
    expect(redirectTimerCall).toBeDefined();

    const scheduledCallback = redirectTimerCall?.[0] as
      | (() => void)
      | undefined;
    expect(scheduledCallback).toBeDefined();
    scheduledCallback?.();

    expect(mockNavigate).toHaveBeenCalledWith("/login");
  });

  it("shows an error and does not redirect when verification fails", async () => {
    mockVerifyRegistrationEmail.mockRejectedValueOnce(
      new Error(
        "Failed to confirm your email. The key may be invalid or expired.",
      ),
    );
    const setTimeoutSpy = vi.spyOn(globalThis, "setTimeout");

    renderPageAtRoute("/verify/bad-key", "/verify/:key");

    expect(
      await screen.findByText(
        "Failed to confirm your email. The key may be invalid or expired.",
      ),
    ).toBeInTheDocument();

    const redirectTimerCall = setTimeoutSpy.mock.calls.find(
      (call) => call[1] === 3000,
    );
    expect(redirectTimerCall).toBeUndefined();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("shows an error and skips API call when key is missing", async () => {
    renderPageAtRoute("/verify", "/verify");

    expect(
      await screen.findByText(
        "Missing verification key. Please try verifying your email again.",
      ),
    ).toBeInTheDocument();

    expect(mockVerifyRegistrationEmail).not.toHaveBeenCalled();
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
