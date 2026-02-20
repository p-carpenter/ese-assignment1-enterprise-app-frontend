import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { AuthFormFooter } from "./AuthFormFooter";
import "@testing-library/jest-dom/vitest";

describe("AuthFormFooter", () => {
  it("renders the footer text", () => {
    render(
      <MemoryRouter>
        <AuthFormFooter
          footerText="Don't have an account?"
          linkText="Sign up"
          linkTo="/register"
        />
      </MemoryRouter>,
    );
    expect(screen.getByText("Don't have an account?")).toBeInTheDocument();
  });

  it("renders a link with the correct label text", () => {
    render(
      <MemoryRouter>
        <AuthFormFooter
          footerText="Already have an account?"
          linkText="Log in"
          linkTo="/login"
        />
      </MemoryRouter>,
    );
    expect(screen.getByRole("link", { name: "Log in" })).toBeInTheDocument();
  });

  it("link points to the correct route", () => {
    render(
      <MemoryRouter>
        <AuthFormFooter
          footerText="Already have an account?"
          linkText="Log in"
          linkTo="/login"
        />
      </MemoryRouter>,
    );
    expect(screen.getByRole("link", { name: "Log in" })).toHaveAttribute(
      "href",
      "/login",
    );
  });

  it("renders both text and link together", () => {
    render(
      <MemoryRouter>
        <AuthFormFooter
          footerText="New here?"
          linkText="Create account"
          linkTo="/register"
        />
      </MemoryRouter>,
    );
    expect(screen.getByText("New here?")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Create account" }),
    ).toBeInTheDocument();
  });
});
