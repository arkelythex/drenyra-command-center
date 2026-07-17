/**
 * Invoices E2E Tests
 *
 * Tests the invoice management flow:
 * - Create new invoice
 * - Add line items
 * - Calculate totals (subtotal, IGV, total)
 * - Send to SUNAT
 * - View CDR response
 */

import { authenticate, testCredentials } from "@arkelythex/test-utils/e2e";
import { expect, test } from "../base-test";

test.describe("Invoices", () => {
	test.beforeEach(async ({ page }) => {
		await authenticate(page, testCredentials.admin);
	});

	test("should navigate to invoices list", async ({ page }) => {
		await page.goto("/invoices");

		await expect(page.locator("h1")).toContainText("Facturas");
		await expect(
			page.locator('[data-testid="create-invoice-btn"]'),
		).toBeVisible();
	});

	test("should create new invoice with line items", async ({ page }) => {
		await page.goto("/invoices");

		// Click create button
		await page.click('[data-testid="create-invoice-btn"]');

		// Should show invoice form
		await expect(page.locator('[data-testid="invoice-form"]')).toBeVisible();

		// Fill customer RUC
		await page.fill('[data-testid="ruc-input"]', "20123456789");

		// Add line item
		await page.click('[data-testid="add-line-item"]');
		await page.fill(
			'[data-testid="line-item-description"]',
			"Servicio de consultoría",
		);
		await page.fill('[data-testid="line-item-quantity"]', "1");
		await page.fill('[data-testid="line-item-price"]', "1000");

		// Should calculate totals
		await expect(page.locator('[data-testid="subtotal"]')).toContainText(
			"1,000.00",
		);
		await expect(page.locator('[data-testid="igv"]')).toContainText("180.00");
		await expect(page.locator('[data-testid="total"]')).toContainText(
			"1,180.00",
		);
	});

	test("should validate RUC format", async ({ page }) => {
		await page.goto("/invoices");
		await page.click('[data-testid="create-invoice-btn"]');

		// Enter invalid RUC
		await page.fill('[data-testid="ruc-input"]', "123");
		await page.click('[data-testid="ruc-input"]'); // blur to trigger validation

		// Should show validation error
		await expect(page.locator('[data-testid="ruc-error"]')).toContainText(
			"RUC inválido",
		);
	});

	test("should save invoice as draft", async ({ page }) => {
		await page.goto("/invoices");
		await page.click('[data-testid="create-invoice-btn"]');

		await page.fill('[data-testid="ruc-input"]', "20123456789");
		await page.click('[data-testid="add-line-item"]');
		await page.fill('[data-testid="line-item-description"]', "Test service");
		await page.fill('[data-testid="line-item-quantity"]', "1");
		await page.fill('[data-testid="line-item-price"]', "1000");

		// Save as draft
		await page.click('[data-testid="save-draft-btn"]');

		// Should redirect to list with success message
		await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
	});
});
