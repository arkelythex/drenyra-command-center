import { expect, test } from "@playwright/test";

/**
 * Visual regression stubs — Fiscal Editorial v3.
 * Capture baselines when dev server + auth fixture available.
 */
test.describe("Fiscal Editorial visual smoke", () => {
	test.skip("dashboard shell uses fiscal-editorial data attribute", async ({
		page,
	}) => {
		await page.goto("/dashboard");
		await expect(
			page.locator("[data-design-system='fiscal-editorial-v3']"),
		).toBeVisible();
	});

	test.skip("sire-diff page renders diff viewer", async ({ page }) => {
		await page.goto("/cumplimiento/sire-diff");
		await expect(
			page.locator("[data-component='diff-viewer-v3']"),
		).toBeVisible();
	});
});
