import "@testing-library/jest-dom/vitest";
import { server } from "./src/mocks/server";
import { mockIntersectionObserver } from 'jsdom-testing-mocks';

export const interactionObserverMock = mockIntersectionObserver();

beforeAll(() => server.listen({ onUnhandledRequest: "warn" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());