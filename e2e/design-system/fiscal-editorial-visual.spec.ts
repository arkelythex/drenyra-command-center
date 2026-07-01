import { expect, test } from "@playwright/test";

/**
 * Visual regression — Fiscal Editorial v3.
 * Baseline capture: run locally with auth fixture (`E2E_AUTH_READY=1`).
 */
test.describe("Fiscal Editorial visual smoke @design-system", () => {
	test.skip("dashboard shell uses fiscal-editorial data attribute", async ({
		page,
	}) => {
		await page.goto("/dashboard");
		await expect(
			page.locator("[data-design-system='fiscal-editorial-v3']"),
		).toBeVisible();
	});

	test.skip("sire-diff page renders diff viewer (requires sire-diff route)", async ({
		page,
	}) => {
		await page.goto("/cumplimiento/sire-diff");
		await expect(
			page.locator("[data-component='diff-viewer-v3']"),
		).toBeVisible();
	});

	test("tokens CSS exposes fiscal editorial surface variables", async ({
		page,
	}) => {
		await page.goto("/");
		const background = await page.evaluate(() =>
			getComputedStyle(document.documentElement).getPropertyValue(
				"--background",
			),
		);
		expect(background.trim().length).toBeGreaterThan(0);
	});
});
