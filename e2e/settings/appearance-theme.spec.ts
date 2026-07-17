/**
 * Appearance theme smoke — login, theme switching, shell visibility.
 */

import { authenticate, testCredentials } from "@arkelythex/test-utils/e2e";
import { expect, test } from "../base-test";

test.describe("Appearance theme smoke", () => {
	test.beforeEach(async ({ page }) => {
		await authenticate(page, testCredentials.admin);
	});

	test("switches light and dark themes on appearance settings", async ({
		page,
	}) => {
		await page.goto("/settings/appearance");

		await expect(page.locator("h1")).toContainText("Apariencia");

		await page.getByRole("button", { name: "Dark" }).click();
		await expect(page.locator("html")).toHaveClass(/dark/);

		await page.getByRole("button", { name: "Light" }).click();
		await expect(page.locator("html")).toHaveClass(/light/);
	});

	test("keeps workspace shell and company context visible after theme change", async ({
		page,
	}) => {
		await page.goto("/settings/appearance");
		await page.getByRole("button", { name: "System" }).click();

		await page.goto("/dashboard");

		await expect(page.getByTestId("active-company-switcher")).toBeVisible();
		await expect(page.getByText(/RUC/i)).toBeVisible();
	});
});
