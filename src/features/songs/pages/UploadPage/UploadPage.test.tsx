import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { UploadPage } from "./UploadPage";
import "@testing-library/jest-dom/vitest";

const mockNavigate = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>(
    "react-router-dom",
  );
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock("@/features/songs", () => ({
  SongUploadForm: ({
    onUploadSuccess,
  }: {
    onUploadSuccess: () => void;
  }) => (
    <div data-testid="song-upload-form">
      <button onClick={onUploadSuccess}>Trigger Upload Success</button>
    </div>
  ),
}));

vi.mock("@/shared/layout", () => ({
  Header: ({
    onLogout,
    userInitial,
    avatarUrl,
  }: {
    onLogout: () => void;
    userInitial?: string;
    avatarUrl?: string;
  }) => (
    <div data-testid="header">
      {avatarUrl && <img src={avatarUrl} alt="avatar" />}
      {userInitial && <span>{userInitial}</span>}
      <button onClick={onLogout}>Log Out</button>
    </div>
  ),
}));

describe("UploadPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the Header", () => {
    render(
      <MemoryRouter>
        <UploadPage onLogout={() => {}} />
      </MemoryRouter>,
    );
    expect(screen.getByTestId("header")).toBeInTheDocument();
  });

  it("renders the SongUploadForm", () => {
    render(
      <MemoryRouter>
        <UploadPage onLogout={() => {}} />
      </MemoryRouter>,
    );
    expect(screen.getByTestId("song-upload-form")).toBeInTheDocument();
  });

  it("renders a 'Back to Home' button", () => {
    render(
      <MemoryRouter>
        <UploadPage onLogout={() => {}} />
      </MemoryRouter>,
    );
    expect(
      screen.getByRole("button", { name: /back to home/i }),
    ).toBeInTheDocument();
  });

  it("navigates to '/' when Back to Home is clicked", () => {
    render(
      <MemoryRouter>
        <UploadPage onLogout={() => {}} />
      </MemoryRouter>,
    );
    fireEvent.click(screen.getByRole("button", { name: /back to home/i }));
    expect(mockNavigate).toHaveBeenCalledWith("/");
  });

  it("calls onLogout when the Log Out button is clicked", () => {
    const onLogout = vi.fn();
    render(
      <MemoryRouter>
        <UploadPage onLogout={onLogout} />
      </MemoryRouter>,
    );
    fireEvent.click(screen.getByRole("button", { name: /log out/i }));
    expect(onLogout).toHaveBeenCalledTimes(1);
  });

  it("passes userInitial down to the Header", () => {
    render(
      <MemoryRouter>
        <UploadPage onLogout={() => {}} userInitial="J" />
      </MemoryRouter>,
    );
    expect(screen.getByText("J")).toBeInTheDocument();
  });

  it("passes avatarUrl down to the Header", () => {
    render(
      <MemoryRouter>
        <UploadPage
          onLogout={() => {}}
          avatarUrl="http://example.com/avatar.jpg"
        />
      </MemoryRouter>,
    );
    expect(screen.getByAltText("avatar")).toHaveAttribute(
      "src",
      "http://example.com/avatar.jpg",
    );
  });

  it("does not navigate away when upload succeeds (stays on upload page)", () => {
    render(
      <MemoryRouter>
        <UploadPage onLogout={() => {}} />
      </MemoryRouter>,
    );
    // Triggering onUploadSuccess should not call navigate
    fireEvent.click(
      screen.getByRole("button", { name: /trigger upload success/i }),
    );
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
