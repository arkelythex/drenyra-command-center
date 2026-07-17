/**
 * Company Settings E2E Tests
 *
 * Tests company management:
 * - View company details
 * - Update company information
 * - Manage users
 * - Configure billing
 */

import { authenticate, testCredentials } from "@arkelythex/test-utils/e2e";
import { expect, test } from "../base-test";

test.describe("Company Settings", () => {
	test.beforeEach(async ({ page }) => {
		await authenticate(page, testCredentials.admin);
	});

	test("should view company details", async ({ page }) => {
		await page.goto("/settings/company");

		await expect(page.locator("h1")).toContainText("Empresa");
		await expect(page.locator('[data-testid="company-ruc"]')).toBeVisible();
		await expect(page.locator('[data-testid="company-name"]')).toBeVisible();
	});

	test("should update company information", async ({ page }) => {
		await page.goto("/settings/company");

		// Click edit button
		await page.click('[data-testid="edit-company-btn"]');

		// Update trade name
		await page.fill(
			'[data-testid="trade-name-input"]',
			"Empresa Actualizada SAC",
		);

		// Save changes
		await page.click('[data-testid="save-btn"]');

		// Should show success message
		await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
	});

	test("should navigate to users tab", async ({ page }) => {
		await page.goto("/settings/company");

		// Click users tab
		await page.click('[data-testid="tab-users"]');

		await expect(page.locator('[data-testid="users-list"]')).toBeVisible();
	});

	test("should navigate to billing tab", async ({ page }) => {
		await page.goto("/settings/company");

		// Click billing tab
		await page.click('[data-testid="tab-billing"]');

		await expect(page.locator('[data-testid="billing-info"]')).toBeVisible();
	});
});
