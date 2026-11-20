import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterAll, afterEach, beforeAll, vi } from "vitest";

import { server } from "./msw/server";

process.env.LARAVEL_API_URL ??= "http://localhost:8181";
process.env.NEXT_PUBLIC_REVERB_APP_KEY ??= "test-key";
process.env.NEXT_PUBLIC_REVERB_HOST ??= "localhost";
process.env.NEXT_PUBLIC_REVERB_PORT ??= "8080";
process.env.NEXT_PUBLIC_REVERB_SCHEME ??= "http";

beforeAll(() => server.listen({ onUnhandledFrame: "error" }));
afterEach(() => {
  cleanup();
  server.resetHandlers();
});
afterAll(() => server.close());

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}

Object.defineProperty(window, "ResizeObserver", {
  writable: true,
  value: ResizeObserverStub,
});

Element.prototype.scrollIntoView = vi.fn();
