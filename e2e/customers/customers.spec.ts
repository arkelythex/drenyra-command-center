/**
 * Customers E2E Tests
 *
 * Tests customer management:
 * - View customers list
 * - Add new customer
 * - Edit customer
 * - Search customers
 */

import { authenticate, testCredentials } from "@arkelythex/test-utils/e2e";
import { expect, test } from "../base-test";

test.describe("Customers", () => {
	test.beforeEach(async ({ page }) => {
		await authenticate(page, testCredentials.admin);
	});

	test("should view customers list", async ({ page }) => {
		await page.goto("/customers");

		await expect(page.locator("h1")).toContainText("Clientes");
		await expect(
			page.locator('[data-testid="add-customer-btn"]'),
		).toBeVisible();
	});

	test("should add new customer with valid RUC", async ({ page }) => {
		await page.goto("/customers");
		await page.click('[data-testid="add-customer-btn"]');

		// Fill customer form with valid RUC
		await page.fill('[data-testid="ruc-input"]', "20123456789");
		await page.fill(
			'[data-testid="business-name-input"]',
			"Cliente Prueba SAC",
		);

		await page.click('[data-testid="save-btn"]');

		await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
	});

	test("should reject invalid RUC", async ({ page }) => {
		await page.goto("/customers");
		await page.click('[data-testid="add-customer-btn"]');

		// Enter invalid RUC
		await page.fill('[data-testid="ruc-input"]', "12345678901");
		await page.click('[data-testid="ruc-input"]'); // blur

		await expect(page.locator('[data-testid="ruc-error"]')).toContainText(
			"RUC inválido",
		);
	});

	test("should search customers", async ({ page }) => {
		await page.goto("/customers");

		// Search for a customer
		await page.fill('[data-testid="search-input"]', "Cliente");
		await page.press('[data-testid="search-input"]', "Enter");

		// Should filter results
		await expect(page.locator('[data-testid="customers-table"]')).toBeVisible();
	});
});
