import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { axe, toHaveNoViolations } from "jest-axe";
import { LinkButton } from "./LinkButton";
import "@testing-library/jest-dom/vitest";
expect.extend(toHaveNoViolations);

// Custom render function to avoid repeating MemoryRouter wrapper.
const renderWithRouter = (ui: React.ReactElement) => {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
};

describe("LinkButton", () => {
  describe("Rendering & Routing", () => {
    it("renders its children correctly", () => {
      renderWithRouter(
        <LinkButton to="/dashboard">Go to Dashboard</LinkButton>,
      );
      expect(
        screen.getByRole("link", { name: "Go to Dashboard" }),
      ).toBeInTheDocument();
    });

    it("resolves the 'to' prop as the href attribute", () => {
      renderWithRouter(<LinkButton to="/settings">Settings</LinkButton>);
      expect(screen.getByRole("link")).toHaveAttribute("href", "/settings");
    });

    it("passes react-router-dom specific props like 'replace' and 'state'", () => {
      renderWithRouter(
        <LinkButton to="/login" replace state={{ from: "home" }}>
          Login
        </LinkButton>,
      );
      const link = screen.getByRole("link");
      expect(link).toHaveAttribute("href", "/login");
    });
  });

  describe("Styling & Variants", () => {
    it("applies the 'outlined' and 'small' classes by default", () => {
      renderWithRouter(<LinkButton to="/">Home</LinkButton>);
      const link = screen.getByRole("link");
      expect(link.className).toMatch(/outlined/);
      expect(link.className).toMatch(/small/);
    });

    it("applies the 'primary' variant class when variant='primary'", () => {
      renderWithRouter(
        <LinkButton to="/" variant="primary">
          Home
        </LinkButton>,
      );
      expect(screen.getByRole("link").className).toMatch(/primary/);
    });

    it("applies the 'large' size class when size='large'", () => {
      renderWithRouter(
        <LinkButton to="/" size="large">
          Home
        </LinkButton>,
      );
      expect(screen.getByRole("link").className).toMatch(/large/);
    });

    it("merges custom className without overwriting base styles", () => {
      renderWithRouter(
        <LinkButton to="/" className="custom-tracking-class">
          Home
        </LinkButton>,
      );
      const link = screen.getByRole("link");
      expect(link.className).toMatch(/custom-tracking-class/);
      expect(link.className).toMatch(/button/);
      expect(link.className).toMatch(/linkOverride/);
    });
  });

  describe("Accessibility", () => {
    it("passes basic jest-axe accessibility checks", async () => {
      const { container } = renderWithRouter(
        <LinkButton to="/profile" aria-label="User Profile">
          Profile
        </LinkButton>,
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it("has no a11y violations with primary variant", async () => {
      const { container } = renderWithRouter(
        <LinkButton to="/submit" variant="primary">
          Submit
        </LinkButton>,
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});
