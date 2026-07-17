/**
 * Reports E2E Tests
 *
 * Tests financial reports generation:
 * - Generate balance sheet
 * - Generate income statement
 * - Generate cash flow report
 * - Export reports to PDF/Excel
 */

import { authenticate, testCredentials } from "@arkelythex/test-utils/e2e";
import { expect, test } from "../base-test";

test.describe("Reports", () => {
	test.beforeEach(async ({ page }) => {
		await authenticate(page, testCredentials.admin);
	});

	test("should view reports list", async ({ page }) => {
		await page.goto("/reports");

		await expect(page.locator("h1")).toContainText("Reportes");
		await expect(page.locator('[data-testid="balance-sheet"]')).toBeVisible();
		await expect(
			page.locator('[data-testid="income-statement"]'),
		).toBeVisible();
	});

	test("should generate balance sheet", async ({ page }) => {
		await page.goto("/reports/balance-sheet");

		// Select date range
		await page.click('[data-testid="date-range-picker"]');
		await page.click('[data-testid="preset-current-year"]');

		// Generate report
		await page.click('[data-testid="generate-btn"]');

		// Should show report data
		await expect(page.locator('[data-testid="report-table"]')).toBeVisible();
	});

	test("should generate income statement", async ({ page }) => {
		await page.goto("/reports/income-statement");

		await page.click('[data-testid="date-range-picker"]');
		await page.click('[data-testid="preset-current-year"]');
		await page.click('[data-testid="generate-btn"]');

		await expect(page.locator('[data-testid="report-table"]')).toBeVisible();
	});

	test("should export report to PDF", async ({ page }) => {
		await page.goto("/reports/balance-sheet");

		await page.click('[data-testid="date-range-picker"]');
		await page.click('[data-testid="preset-current-year"]');
		await page.click('[data-testid="generate-btn"]');

		// Export to PDF
		await page.click('[data-testid="export-pdf-btn"]');

		// Should download file
		const download = await page.waitForEvent("download");
		expect(download.suggestedFilename()).toContain("balance-sheet");
	});

	test("should export report to Excel", async ({ page }) => {
		await page.goto("/reports/balance-sheet");

		await page.click('[data-testid="date-range-picker"]');
		await page.click('[data-testid="preset-current-year"]');
		await page.click('[data-testid="generate-btn"]');

		// Export to Excel
		await page.click('[data-testid="export-excel-btn"]');

		const download = await page.waitForEvent("download");
		expect(download.suggestedFilename()).toContain("balance-sheet");
	});
});
