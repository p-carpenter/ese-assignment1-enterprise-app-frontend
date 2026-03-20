import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { HistoryPopover } from "./HistoryPopover";

vi.mock("@/features/player/components", () => ({
  PlayHistory: vi.fn(() => <div data-testid="play-history" />),
}));

describe("HistoryPopover", () => {
  it("opens and closes the Play History popover via click", async () => {
    const user = userEvent.setup();
    render(<HistoryPopover />);

    expect(screen.queryByRole("dialog", { name: "Play History" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Toggle play history" }));
    expect(screen.getByRole("dialog", { name: "Play History" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Close history" }));
    expect(screen.queryByRole("dialog", { name: "Play History" })).not.toBeInTheDocument();
  });

  it("closes the popover when pressing the Escape key", async () => {
    const user = userEvent.setup();
    render(<HistoryPopover />);

    await user.click(screen.getByRole("button", { name: "Toggle play history" }));
    expect(screen.getByRole("dialog", { name: "Play History" })).toBeInTheDocument();

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog", { name: "Play History" })).not.toBeInTheDocument();
  });
});