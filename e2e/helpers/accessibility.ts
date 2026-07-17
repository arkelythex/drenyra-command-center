/**
 * Accessibility Testing Helpers
 *
 * Shared utilities for axe-core Playwright integration.
 * Provides functions for WCAG violation scanning and assertions.
 *
 * Usage:
 *   import { checkAccessibility, expectNoViolations } from "../helpers/accessibility";
 *
 *   test("page has no a11y violations", async ({ page }) => {
 *     await page.goto("/some-path");
 *     await expectNoViolations(page);
 *   });
 */

import AxeBuilder from "@axe-core/playwright";
import { expect, type Page } from "@playwright/test";

/** Default WCAG tags to check — A, AA, and the latest 2.1 additions */
export const DEFAULT_A11Y_TAGS = [
	"wcag2a",
	"wcag2aa",
	"wcag21a",
	"wcag21aa",
] as const;

/**
 * Run axe-core analysis on the current page.
 *
 * @param page - Playwright Page instance
 * @param tags - WCAG tag filters (default: wcag2a, wcag2aa, wcag21a, wcag21aa)
 * @returns AxeResults with violations, passes, incomplete, etc.
 */
export async function checkAccessibility(page: Page, tags?: string[]) {
	const results = await new AxeBuilder({ page })
		.withTags(tags ?? DEFAULT_A11Y_TAGS)
		.analyze();
	return results;
}

/**
 * Assert zero WCAG violations on the current page.
 * Fails the test if any violations are found, logging them as a table.
 *
 * @param page - Playwright Page instance
 * @param tags - WCAG tag filters (default: wcag2a, wcag2aa, wcag21a, wcag21aa)
 */
export async function expectNoViolations(
	page: Page,
	tags?: string[],
): Promise<void> {
	const results = await checkAccessibility(page, tags);

	if (results.violations.length > 0) {
		// Log violations in a readable format for test output
		const _summary = results.violations.map((v) => ({
			id: v.id,
			impact: v.impact,
			help: v.help,
			helpUrl: v.helpUrl,
			elements: v.nodes.length,
			description: v.description,
		}));

		// Log the specific selectors for each violation
		for (const violation of results.violations) {
			for (const _node of violation.nodes) {
			}
		}
	}

	expect(
		results.violations,
		`Expected zero WCAG violations, found ${results.violations.length}. Run with --debug for details.`,
	).toHaveLength(0);
}
