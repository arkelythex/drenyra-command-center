/**
 * Global test setup file for Web (React) component tests.
 *
 * Extends the existing test setup with shared test-utils.
 */
import * as jestDomMatchers from "@testing-library/jest-dom/matchers";
import { cleanup } from "@testing-library/react";
import { vi, beforeAll, beforeEach, afterEach, expect } from "vitest";

expect.extend(jestDomMatchers);

declare global {
	var IS_REACT_ACT_ENVIRONMENT: boolean | undefined;
}

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

function createMemoryStorage(): Storage {
	let store = new Map<string, string>();

	return {
		get length() {
			return store.size;
		},
		clear: () => {
			store = new Map<string, string>();
		},
		getItem: (key: string) => store.get(key) ?? null,
		key: (index: number) => Array.from(store.keys())[index] ?? null,
		removeItem: (key: string) => {
			store.delete(key);
		},
		setItem: (key: string, value: string) => {
			store.set(key, String(value));
		},
	};
}

function ensureWebStorage(name: "localStorage" | "sessionStorage"): void {
	let existing: Storage | undefined;

	try {
		existing = window[name];
	} catch {
		existing = undefined;
	}

	const storage = existing ?? createMemoryStorage();

	if (!existing) {
		Object.defineProperty(window, name, {
			configurable: true,
			writable: true,
			value: storage,
		});
	}

	Object.defineProperty(globalThis, name, {
		configurable: true,
		writable: true,
		value: storage,
	});
}

ensureWebStorage("localStorage");
ensureWebStorage("sessionStorage");

// Mock window APIs that don't exist in jsdom
beforeAll(() => {
	ensureWebStorage("localStorage");
	ensureWebStorage("sessionStorage");

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

	Object.defineProperty(window, "IntersectionObserver", {
		writable: true,
		value: class IntersectionObserver {
			observe = vi.fn();
			unobserve = vi.fn();
			disconnect = vi.fn();
		},
	});

	Object.defineProperty(window, "ResizeObserver", {
		writable: true,
		value: class ResizeObserver {
			observe = vi.fn();
			unobserve = vi.fn();
			disconnect = vi.fn();
		},
	});

	// scrollIntoView is not implemented in jsdom
	Element.prototype.scrollIntoView = vi.fn() as () => void;
});

beforeEach(() => {
	ensureWebStorage("localStorage");
	ensureWebStorage("sessionStorage");
});

// Cleanup after each test
afterEach(() => {
	cleanup();
	window.localStorage.clear();
	window.sessionStorage.clear();
});
