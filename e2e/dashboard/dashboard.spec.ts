/**
 * Dashboard E2E Tests
 *
 * Tests the main dashboard flows:
 * - Dashboard loads with key metrics
 * - KPI cards display correctly
 * - Recent activity shows
 * - Date range filtering works
 */

import { authenticate, testCredentials } from "@arkelythex/test-utils/e2e";
import { expect, test } from "../base-test";

test.describe("Dashboard", () => {
	test.beforeEach(async ({ page }) => {
		await authenticate(page, testCredentials.admin);
	});

	test("should load dashboard with key metrics", async ({ page }) => {
		await page.goto("/dashboard");

		// Should load without errors
		await expect(page.locator("h1")).toContainText("Dashboard");

		// Should show KPI cards
		await expect(page.locator('[data-testid="kpi-revenue"]')).toBeVisible();
		await expect(page.locator('[data-testid="kpi-invoices"]')).toBeVisible();
		await expect(page.locator('[data-testid="kpi-customers"]')).toBeVisible();
	});

	test("should display financial summary", async ({ page }) => {
		await page.goto("/dashboard");

		// Should show financial metrics
		await expect(
			page.locator('[data-testid="financial-summary"]'),
		).toBeVisible();
	});

	test("should show recent invoices", async ({ page }) => {
		await page.goto("/dashboard");

		// Should show recent invoices section
		await expect(page.locator('[data-testid="recent-invoices"]')).toBeVisible();
	});

	test("should filter by date range", async ({ page }) => {
		await page.goto("/dashboard");

		// Open date picker
		await page.click('[data-testid="date-range-picker"]');

		// Select last 30 days
		await page.click('[data-testid="preset-last-30-days"]');

		// Should update KPI values
		await expect(page.locator('[data-testid="kpi-revenue"]')).toBeVisible();
	});
});
