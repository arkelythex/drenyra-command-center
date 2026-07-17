/**
 * Banking Reconciliation E2E Tests
 *
 * Tests the banking reconciliation flow:
 * - View bank accounts
 * - Import bank statements
 * - Match transactions
 * - Generate reconciliation reports
 */

import { authenticate, testCredentials } from "@arkelythex/test-utils/e2e";
import { expect, test } from "../base-test";

test.describe("Banking Reconciliation", () => {
	test.beforeEach(async ({ page }) => {
		await authenticate(page, testCredentials.admin);
	});

	test("should view bank accounts list", async ({ page }) => {
		await page.goto("/banking/accounts");

		await expect(page.locator("h1")).toContainText("Cuentas Bancarias");
		await expect(page.locator('[data-testid="add-account-btn"]')).toBeVisible();
	});

	test("should add new bank account", async ({ page }) => {
		await page.goto("/banking/accounts");

		await page.click('[data-testid="add-account-btn"]');

		// Fill bank account form
		await page.fill('[data-testid="account-name"]', "Cuenta Principal");
		await page.fill('[data-testid="account-number"]', "1234567890");
		await page.selectOption('[data-testid="bank-select"]', "BCP");

		await page.click('[data-testid="save-btn"]');

		await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
	});

	test("should navigate to reconciliation", async ({ page }) => {
		await page.goto("/banking/reconciliation");

		await expect(page.locator("h1")).toContainText("Conciliación");
		await expect(page.locator('[data-testid="import-btn"]')).toBeVisible();
	});

	test("should import bank statement", async ({ page }) => {
		await page.goto("/banking/reconciliation");

		await page.click('[data-testid="import-btn"]');

		// Upload bank statement file
		const fileInput = page.locator('[data-testid="file-input"]');
		await fileInput.setInputFiles({
			name: "bank-statement.csv",
			mimeType: "text/csv",
			content:
				"date,description,amount\n2026-01-01,Deposit,1000\n2026-01-02,Withdrawal,-500",
		});

		await page.click('[data-testid="process-btn"]');

		// Should show imported transactions
		await expect(
			page.locator('[data-testid="imported-transactions"]'),
		).toBeVisible();
	});

	test("should match transactions automatically", async ({ page }) => {
		await page.goto("/banking/reconciliation");

		// Select transactions to match
		await page.check('[data-testid="transaction-checkbox-1"]');
		await page.check('[data-testid="transaction-checkbox-2"]');

		// Click match button
		await page.click('[data-testid="match-btn"]');

		// Should show matched status
		await expect(page.locator('[data-testid="matched-status"]')).toBeVisible();
	});
});
