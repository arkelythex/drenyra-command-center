/**
 * Global Setup for Playwright E2E Tests
 *
 * Runs ONCE before the entire test suite.
 * Responsibilities:
 *   - Validate required environment variables
 *   - Ensure Playwright browsers are installed
 *   - Create shared auth storage state file
 *
 * This file runs in Node.js (not browser context).
 */
import type { FullConfig } from "@playwright/test";

/**
 * Verify that required env vars are set.
 * Fail fast with clear messages instead of cryptic timeouts.
 */
function validateEnvironment(config: FullConfig): void {
	const baseUrl = config.projects[0]?.use?.baseURL;
	if (!baseUrl) {
		throw new Error(
			"BASE_URL is required. Set BASE_URL env var or ensure playwright.config.ts has baseURL configured.",
		);
	}

	if (process.env.CI && !process.env.E2E_CREDENTIALS_EMAIL) {
		console.warn(
			"⚠️  E2E_CREDENTIALS_EMAIL not set — auth tests may fail in CI. " +
				"Set both E2E_CREDENTIALS_EMAIL and E2E_CREDENTIALS_PASSWORD.",
		);
	}
}

/**
 * Optionally pre-authenticate and save storage state.
 * This speeds up tests that use storageState in their project config.
 *
 * Currently a no-op placeholder — activate when auth is stable and
 * you want to skip UI login in every test file.
 */
async function globalSetup(config: FullConfig): Promise<void> {
	validateEnvironment(config);
}

export default globalSetup;
