/**
 * Global Vitest Setup for ARKELYTHEX
 *
 * This file runs once before all tests.
 * Use for:
 * - Global mocks
 * - Test utilities
 * - Environment setup
 * - Cleanup
 */
import { afterAll, beforeAll, vi } from "vitest";

// Mock console.error in production to avoid noise
beforeAll(() => {
	// Mock console.error in tests to reduce noise from expected errors
	vi.spyOn(console, "error").mockImplementation((...args) => {
		// Allow certain errors through
		const message = args[0];
		if (typeof message === "string") {
			// Filter out expected errors in tests
			const ignoredPatterns = [
				"Vitest caught",
				"The vi.fn() mock",
				"Using mock DATABASE_URL",
			];
			const shouldIgnore = ignoredPatterns.some((pattern) =>
				message.includes(pattern),
			);
			if (!shouldIgnore) {
				console.error(...args);
			}
		}
	});
});

afterAll(() => {
	// Cleanup mocks
	vi.restoreAllMocks();
});

// Mock fetch for tests that make API calls
beforeAll(() => {
	global.fetch = vi.fn().mockResolvedValue({
		ok: true,
		json: vi.fn().mockResolvedValue({}),
	});
});

// Mock window for jsdom tests
if (typeof window !== "undefined") {
	// Add test-specific globals
	Object.defineProperty(window, "testTimeout", {
		get() {
			return 30000;
		},
	});
}
