import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { RegisterPage } from "./RegisterPage";

vi.mock("../../components/RegistrationForm/RegistrationForm", () => ({
  RegistrationForm: () => (
    <div data-testid="registration-form">Registration Form</div>
  ),
}));

vi.mock("../../components/AuthFormFooter/AuthFormFooter", () => ({
  AuthFormFooter: ({
    footerText,
    linkText,
    linkTo,
  }: {
    footerText: string;
    linkText: string;
    linkTo: string;
  }) => (
    <div data-testid="auth-footer">
      <span>{footerText}</span>
      <a href={linkTo}>{linkText}</a>
    </div>
  ),
}));

vi.mock("../../components/AuthLayout/AuthLayout", () => ({
  AuthLayout: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="auth-layout">{children}</div>
  ),
}));

const renderPage = () => {
  return render(
    <MemoryRouter>
      <RegisterPage />
    </MemoryRouter>,
  );
};

describe("RegisterPage", () => {
  describe("Rendering & Composition", () => {
    it("renders the authentication layout wrapper", () => {
      renderPage();
      expect(screen.getByTestId("auth-layout")).toBeInTheDocument();
    });

    it("renders the registration form", () => {
      renderPage();
      expect(screen.getByTestId("registration-form")).toBeInTheDocument();
    });

    it("renders the 'or' divider", () => {
      renderPage();
      expect(screen.getByText("or")).toBeInTheDocument();
    });
  });

  describe("Props Passing", () => {
    it("passes the correct text and routing props to the AuthFormFooter", () => {
      renderPage();

      const footer = screen.getByTestId("auth-footer");
      expect(footer).toHaveTextContent("Already have an account?");

      const link = screen.getByRole("link", { name: "Log in to AdaStream" });
      expect(link).toHaveAttribute("href", "/login");
    });
  });
});
