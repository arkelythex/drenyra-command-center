/**
 * Accessibility Smoke Tests
 *
 * Scans key authenticated pages with axe-core for WCAG 2.1 AA violations.
 * Uses fetch interception and localStorage to mock authentication state
 * so tests run without a backend server.
 *
 * Tags: @a11y, @smoke, @accessibility
 */
import { expect, test } from "@playwright/test";
import { expectNoViolations } from "../helpers/accessibility";

/**
 * Mock company context used across all authenticated page tests.
 */
const ACTIVE_COMPANY = {
	companyId: "00000000-0000-0000-0000-000000000001",
	companyName: "ARKELYTHEX S.A.C.",
	ruc: "20546296564",
	countryCode: "pe",
	isDemoFallback: false,
} as const;

/**
 * Install mock session state into the page context.
 *
 * Intercepts all fetch calls:
 *   - /api/auth/session → returns a mock authenticated user
 *   - Any other /api/ call → returns empty success response
 *
 * Also sets localStorage with the active company so the shell renders.
 */
function installSessionState(page: import("@playwright/test").Page) {
	return page.addInitScript((company: typeof ACTIVE_COMPANY) => {
		window.localStorage.setItem(
			"arkelythex-active-company",
			JSON.stringify(company),
		);

		const originalFetch = window.fetch.bind(window);
		window.fetch = ((input: RequestInfo | URL, init?: RequestInit) => {
			const url =
				typeof input === "string"
					? input
					: input instanceof URL
						? input.href
						: input.url;

			// Return a mock session for auth checks
			if (url.includes("/api/auth/session")) {
				return Promise.resolve(
					new Response(
						JSON.stringify({
							success: true,
							data: {
								session: { id: "session-e2e", userId: "user-e2e" },
								user: {
									id: "user-e2e",
									email: "admin@test.arkelythexfounders.com",
									name: "Admin Tester",
									role: "ADMIN",
									companyId: company.companyId,
									activeCompanyId: company.companyId,
									companyName: company.companyName,
									ruc: company.ruc,
									countryCode: company.countryCode,
								},
							},
						}),
						{
							status: 200,
							headers: { "Content-Type": "application/json" },
						},
					),
				);
			}

			// Return empty success for all other API calls
			if (url.includes("/api/")) {
				return Promise.resolve(
					new Response(JSON.stringify({ success: true, data: {} }), {
						status: 200,
						headers: { "Content-Type": "application/json" },
					}),
				);
			}

			// Pass through for non-API calls (CSS, JS, images, etc.)
			return originalFetch(input, init);
		}) as typeof window.fetch;
	}, ACTIVE_COMPANY);
}

test.describe("Accessibility — authenticated pages", () => {
	test.beforeEach(async ({ page }) => {
		installSessionState(page);
	});

	test("/drenyra workspace has no WCAG violations", {
		tag: ["@a11y", "@smoke", "@drenyra"],
	}, async ({ page }) => {
		await page.goto("/drenyra", { waitUntil: "networkidle" });

		// Wait for the page to actually render content
		await expect(page.locator("h1, h2, main, [role=main]").first()).toBeVisible(
			{
				timeout: 20_000,
			},
		);

		// Scan for WCAG 2.1 AA violations
		await expectNoViolations(page);
	});

	test("/tesoreria/banking (tesorería) has no WCAG violations", {
		tag: ["@a11y", "@smoke", "@tesoreria"],
	}, async ({ page }) => {
		await page.goto("/tesoreria/banking", { waitUntil: "networkidle" });

		await expect(page.locator("h1, h2, main, [role=main]").first()).toBeVisible(
			{
				timeout: 20_000,
			},
		);

		await expectNoViolations(page);
	});

	test("/settings/appearance has no WCAG violations", {
		tag: ["@a11y", "@smoke", "@settings"],
	}, async ({ page }) => {
		await page.goto("/settings/appearance", { waitUntil: "networkidle" });

		await expect(page.locator("h1, h2, main, [role=main]").first()).toBeVisible(
			{
				timeout: 20_000,
			},
		);

		await expectNoViolations(page);
	});
});
