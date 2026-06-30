/**
 * Global Teardown for Playwright E2E Tests
 *
 * Runs ONCE after the entire test suite completes.
 * Responsibilities:
 *   - Log summary info
 *   - Clean up any global artifacts
 *   - Report test results location
 */
import type { FullConfig } from "@playwright/test";

async function globalTeardown(config: FullConfig): Promise<void> {
	const _reportPath = config.projects[0]?.use?.baseURL;
}

export default globalTeardown;
