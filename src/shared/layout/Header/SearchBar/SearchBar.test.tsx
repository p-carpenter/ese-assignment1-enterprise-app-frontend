import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, useLocation } from "react-router-dom";
import { SearchBar } from "./SearchBar";
import "@testing-library/jest-dom/vitest";

vi.mock("use-debounce", () => ({
  useDebouncedCallback: (fn: (...args: unknown[]) => void) => {
    const debounced = (...args: unknown[]) => fn(...args);
    debounced.cancel = vi.fn();
    debounced.flush = vi.fn(); 
    return debounced;
  },
}));

const LocationDisplay = () => {
    const location = useLocation();
    return (
        <div data-testid="location-display">
            {location.pathname}{location.search}
        </div>
    );
};

const renderSearchBar = (initialRoute = "/") => {
    return render(
        <MemoryRouter initialEntries={[initialRoute]}>
            <SearchBar />
            <LocationDisplay />
        </MemoryRouter>
    );
};

describe("SearchBar", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe("Rendering", () => {
        it("renders the search input", () => {
            renderSearchBar();
            expect(screen.getByRole("searchbox", { name: /search songs/i })).toBeInTheDocument();
        });

        it("does not render the clear button when input is empty", () => {
            renderSearchBar();
            expect(screen.queryByRole("button", { name: /clear search/i })).not.toBeInTheDocument();
        });

        it("initialises input value from the q search param", () => {
            renderSearchBar("/?q=coldplay");
            expect(screen.getByRole("searchbox")).toHaveValue("coldplay");
        });

        it("renders the clear button when input has a value", async () => {
            const user = userEvent.setup();
            renderSearchBar();
            await user.type(screen.getByRole("searchbox"), "radiohead");
            expect(screen.getByRole("button", { name: /clear search/i })).toBeInTheDocument();
        });

        it("hides the clear button after clearing input", async () => {
            const user = userEvent.setup();
            renderSearchBar("/?q=björk");
            await user.click(screen.getByRole("button", { name: /clear search/i }));
            expect(screen.queryByRole("button", { name: /clear search/i })).not.toBeInTheDocument();
        });
    });

    describe("Typing / navigation", () => {
        it("navigates to /?q=<query> when typing from home", async () => {
            const user = userEvent.setup();
            renderSearchBar();
            await user.type(screen.getByRole("searchbox"), "arctic monkeys");
            expect(screen.getByTestId("location-display").textContent).toMatch(/\/\?q=arctic(%20|\+)monkeys/);
        });

        it("navigates to /?q=<query> when typing from another page", async () => {
            const user = userEvent.setup();
            renderSearchBar("/profile");
            await user.type(screen.getByRole("searchbox"), "radiohead");
            expect(screen.getByTestId("location-display").textContent).toMatch(/\/\?q=radiohead/);
        });

        it("handles special characters and encodes the URL correctly", async () => {
            const user = userEvent.setup();
            renderSearchBar();
            await user.type(screen.getByRole("searchbox"), "AC/DC & R&B");
            expect(screen.getByTestId("location-display").textContent).toMatch(/\/\?q=AC%2FDC(\+|%20)%26(\+|%20)R%26B/);
        });

        it("ignores whitespace-only input and does not navigate to a search page", async () => {
            const user = userEvent.setup();
            renderSearchBar();
            await user.type(screen.getByRole("searchbox"), "   ");
            expect(screen.getByTestId("location-display").textContent).toBe("/");
        });

        it("pressing Enter after typing does not cause a page reload and updates URL", async () => {
            const user = userEvent.setup();
            renderSearchBar();
            await user.type(screen.getByRole("searchbox"), "blur{Enter}");
            expect(screen.getByTestId("location-display").textContent).toMatch(/\/\?q=blur/);
        });
    });

    describe("Clearing input", () => {
        it("clicking clear button empties the input", async () => {
            const user = userEvent.setup();
            renderSearchBar("/?q=tame+impala");
            await user.click(screen.getByRole("button", { name: /clear search/i }));
            expect(screen.getByRole("searchbox")).toHaveValue("");
        });

        it("clicking clear button navigates to / when already on home with no prior origin", async () => {
            const user = userEvent.setup();
            renderSearchBar("/?q=tame+impala");
            await user.click(screen.getByRole("button", { name: /clear search/i }));
            expect(screen.getByTestId("location-display")).toHaveTextContent("/");
        });

        it("typing then clearing via input returns to origin page", async () => {
            const user = userEvent.setup();
            renderSearchBar("/profile");
            const input = screen.getByRole("searchbox");
            await user.type(input, "test");
            await user.clear(input);
            expect(screen.getByTestId("location-display")).toHaveTextContent("/profile");
        });

        it("typing then clicking clear button returns to origin page", async () => {
            const user = userEvent.setup();
            renderSearchBar("/profile");
            const input = screen.getByRole("searchbox");
            await user.type(input, "test");
            await user.click(screen.getByRole("button", { name: /clear search/i }));
            expect(screen.getByTestId("location-display")).toHaveTextContent("/profile");
        });

        it("origin is captured from first keystroke, not subsequent ones", async () => {
            const user = userEvent.setup();
            renderSearchBar("/album/123");
            const input = screen.getByRole("searchbox");
            await user.type(input, "foo");

            await user.clear(input);
            expect(screen.getByTestId("location-display")).toHaveTextContent("/album/123");
        });

        it("origin resets after clearing, so a second search session uses the new origin", async () => {
            const user = userEvent.setup();
            renderSearchBar("/profile");
            const input = screen.getByRole("searchbox");

            await user.type(input, "test");
            await user.clear(input);

            // Origin should be /profile again
            await user.type(input, "again");
            await user.clear(input);
            expect(screen.getByTestId("location-display")).toHaveTextContent("/profile");
        });

        it("navigates to / when clearing whitespace-only input from home", async () => {
            const user = userEvent.setup();
            renderSearchBar();
            const input = screen.getByRole("searchbox");
            await user.type(input, "   ");
            await user.clear(input);
            expect(screen.getByTestId("location-display")).toHaveTextContent("/");
        });
    });
});