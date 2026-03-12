import "@testing-library/jest-dom/vitest";
import { server } from "./src/mocks/server";

// jsdom doesn't implement IntersectionObserver – provide a minimal stub.
// vi.fn() uses arrow functions internally and can't be used with `new`;
// a plain class is the only reliable constructor replacement in jsdom.
beforeEach(() => {
  window.IntersectionObserver = class {
    observe() { return null; }
    unobserve() { return null; }
    disconnect() { return null; }
  } as unknown as typeof IntersectionObserver;
});

beforeAll(() => server.listen({ onUnhandledRequest: "warn" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());