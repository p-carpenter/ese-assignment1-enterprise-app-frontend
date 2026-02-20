import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Button } from "./Button";
import "@testing-library/jest-dom/vitest";

describe("Button", () => {
  it("renders its children", () => {
    render(<Button>Click me</Button>);
    expect(
      screen.getByRole("button", { name: "Click me" }),
    ).toBeInTheDocument();
  });

  it("calls onClick when clicked", () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Click</Button>);
    fireEvent.click(screen.getByRole("button"));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("is disabled when the disabled prop is true", () => {
    render(<Button disabled>Click</Button>);
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("does not fire onClick when disabled", () => {
    const onClick = vi.fn();
    render(
      <Button disabled onClick={onClick}>
        Click
      </Button>,
    );
    fireEvent.click(screen.getByRole("button"));
    expect(onClick).not.toHaveBeenCalled();
  });

  it("applies the 'outlined' variant class by default", () => {
    render(<Button>Click</Button>);
    expect(screen.getByRole("button").className).toMatch(/outlined/);
  });

  it("applies the 'primary' variant class when variant='primary'", () => {
    render(<Button variant="primary">Click</Button>);
    expect(screen.getByRole("button").className).toMatch(/primary/);
  });

  it("applies the 'small' size class by default", () => {
    render(<Button>Click</Button>);
    expect(screen.getByRole("button").className).toMatch(/small/);
  });

  it("applies the 'large' size class when size='large'", () => {
    render(<Button size="large">Click</Button>);
    expect(screen.getByRole("button").className).toMatch(/large/);
  });

  it("forwards additional HTML attributes (e.g. type='submit')", () => {
    render(<Button type="submit">Submit</Button>);
    expect(screen.getByRole("button")).toHaveAttribute("type", "submit");
  });

  it("merges a custom className with the generated classes", () => {
    render(<Button className="my-custom">Click</Button>);
    const btn = screen.getByRole("button");
    expect(btn.className).toMatch(/my-custom/);
    expect(btn.className).toMatch(/outlined/);
  });
});
