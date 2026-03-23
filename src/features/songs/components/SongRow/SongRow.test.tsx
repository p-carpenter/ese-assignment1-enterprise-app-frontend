import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { SongRow } from "./SongRow";
import { createSong } from "@/test/factories/song";
import { MemoryRouter } from "react-router-dom";
import userEvent from "@testing-library/user-event";

describe("SongRow", () => {
  const song = createSong({
    id: 1,
    title: "Test Song",
    artist: "Test Artist",
    duration: 125, // 2:05
    cover_art_url: "https://example.com/cover.jpg",
  });

  const onPlayMock = vi.fn();
  const dropdownItems = [{ label: "Edit", onSelect: vi.fn() }];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderComponent = (isActive = false) => {
    return render(
      <MemoryRouter>
        <SongRow
          song={song}
          isActive={isActive}
          onPlay={onPlayMock}
          dropdownItems={dropdownItems}
        />
      </MemoryRouter>,
    );
  };

  it("calls onPlay when the row is clicked", () => {
    renderComponent();
    fireEvent.click(screen.getByRole("listitem"));
    expect(onPlayMock).toHaveBeenCalledWith(song);
  });

  it("does not call onPlay when the dropdown container is clicked", async () => {
    const user = userEvent.setup();
    renderComponent();

    const dropdownContainer = screen.getByTestId("dropdown-container");

    await user.click(dropdownContainer);

    expect(onPlayMock).not.toHaveBeenCalled();
  });
});
