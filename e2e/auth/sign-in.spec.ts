/**
 * Authentication E2E Tests
 *
 * Tests the full authentication flow:
 * - Login page renders
 * - Successful login redirects to dashboard
 * - Invalid credentials show error
 * - Logout works
 */

import { authenticate, testCredentials } from "@arkelythex/test-utils/e2e";
import { expect, test } from "../base-test";

test.describe("Authentication", () => {
	test("should display login page", async ({ page }) => {
		await page.goto("/auth/login");
		await expect(page.locator("h1")).toContainText("Iniciar Sesión");
		await expect(page.locator('input[name="email"]')).toBeVisible();
		await expect(page.locator('input[name="password"]')).toBeVisible();
		await expect(page.locator('button[type="submit"]')).toBeVisible();
	});

	test("should login successfully with valid credentials", async ({ page }) => {
		await authenticate(page, testCredentials.admin);
		await expect(page).toHaveURL(/\/dashboard/);
	});

	test("should show error with invalid credentials", async ({ page }) => {
		await page.goto("/auth/login");
		await page.fill('input[name="email"]', "invalid@test.com");
		await page.fill('input[name="password"]', "wrongpassword");
		await page.click('button[type="submit"]');

		// Should show error message
		await expect(page.locator('[data-testid="error"]')).toBeVisible();
	});

	test("should logout successfully", async ({ page }) => {
		// Login first
		await authenticate(page, testCredentials.admin);
		await expect(page).toHaveURL(/\/dashboard/);

		// Logout
		await page.click('[data-testid="logout-button"]');
		await expect(page).toHaveURL(/\/auth\/login/);
	});
});
