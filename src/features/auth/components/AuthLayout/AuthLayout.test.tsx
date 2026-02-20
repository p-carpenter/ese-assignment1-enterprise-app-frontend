import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { AuthLayout } from "./AuthLayout";
import "@testing-library/jest-dom/vitest";

describe("AuthLayout", () => {
  it("renders the app title 'Music Player'", () => {
    render(
      <AuthLayout>
        <div>Child Content</div>
      </AuthLayout>,
    );
    expect(screen.getByText("Music Player")).toBeInTheDocument();
  });

  it("renders its children", () => {
    render(
      <AuthLayout>
        <div>Child Content</div>
      </AuthLayout>,
    );
    expect(screen.getByText("Child Content")).toBeInTheDocument();
  });

  it("renders multiple children", () => {
    render(
      <AuthLayout>
        <p>First</p>
        <p>Second</p>
      </AuthLayout>,
    );
    expect(screen.getByText("First")).toBeInTheDocument();
    expect(screen.getByText("Second")).toBeInTheDocument();
  });
});
