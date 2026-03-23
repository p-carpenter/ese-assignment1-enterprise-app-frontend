import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { EmailVerificationPage } from "./EmailVerificationPage";
import { server } from "@/mocks/server";
import { http, HttpResponse } from "msw";
import { resetHandlerState } from "@/mocks/handlers";

const mockNavigate = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual =
    await vi.importActual<typeof import("react-router-dom")>(
      "react-router-dom",
    );
  return { ...actual, useNavigate: () => mockNavigate };
});

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
    resetHandlerState();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("shows success and redirects to login when verification succeeds", async () => {
    const setTimeoutSpy = vi.spyOn(globalThis, "setTimeout");

    renderPageAtRoute("/verify/good-key", "/verify/:key");

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
    server.use(
      http.post(
        "http://localhost:8000/api/auth/registration/verify-email",
        () =>
          HttpResponse.json(
            {
              detail:
                "Failed to confirm your email. The key may be invalid or expired.",
            },
            { status: 400 },
          ),
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
  });
});
