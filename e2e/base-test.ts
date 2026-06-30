/**
 * E2E Base Test Setup
 *
 * Global setup for Playwright E2E tests.
 * Provides common fixtures and test hooks.
 */

import { BasePage } from "@arkelythex/test-utils/e2e";
import { test as base } from "@playwright/test";

/**
 * Extended test fixture with common page objects.
 */
export const test = base.extend<{
	basePage: BasePage;
}>({
	basePage: async ({ page }, use) => {
		const basePage = new BasePage(page);
		await use(basePage);
	},
});

export { expect } from "@playwright/test";
