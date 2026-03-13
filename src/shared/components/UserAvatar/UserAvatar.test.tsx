import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { UserAvatar } from "./UserAvatar";

describe("UserAvatar", () => {
  it("shows image when avatar_url is defined", () => {
    render(
      <UserAvatar
        user={{
          id: 1,
          username: "testuser",
          avatar_url: "http://test.com/img.png",
        }}
      />,
    );
    const img = screen.getByRole("img");
    expect(img).toHaveAttribute("src", "http://test.com/img.png");
    expect(img).toHaveAttribute("alt", "testuser");
  });

  it("shows fallback character when avatar_url is undefined", () => {
    render(
      <UserAvatar
        user={{ id: 1, username: "testuser", avatar_url: undefined }}
      />,
    );
    expect(screen.getByText("T")).toBeInTheDocument();
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });
});
