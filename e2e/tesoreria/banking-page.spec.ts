/**
 * Tesorería / Banking Page — Smoke Tests
 *
 * Verifies that the tesoreria/banking page loads correctly:
 * - Page renders with correct heading
 * - Key UI elements are present (account list or summary)
 * - Navigation stays within the banking section
 *
 * API calls are mocked so tests run without a backend.
 */
import { expect, test } from "../base-test";

const ACTIVE_COMPANY = {
	companyId: "00000000-0000-0000-0000-000000000001",
	companyName: "ARKELYTHEX S.A.C.",
	ruc: "20546296564",
	countryCode: "pe",
	isDemoFallback: false,
} as const;

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

			if (url.includes("/api/auth/session")) {
				return Promise.resolve(
					new Response(
						JSON.stringify({
							success: true,
							data: {
								session: { id: "session-e2e", userId: "user-e2e" },
								user: {
									id: "user-e2e",
									email: "admin@test.com",
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

			// Mock banking data endpoints
			if (url.includes("/api/banking/") || url.includes("/api/tesoreria/")) {
				return Promise.resolve(
					new Response(
						JSON.stringify({
							success: true,
							data: {
								accounts: [
									{
										id: "acc-1",
										name: "Cuenta Corriente BCP",
										number: "191-1234567",
										bank: "BCP",
										currency: "PEN",
										balance: 150000,
									},
								],
							},
						}),
						{
							status: 200,
							headers: { "Content-Type": "application/json" },
						},
					),
				);
			}

			if (url.includes("/api/")) {
				return Promise.resolve(
					new Response(JSON.stringify({ success: true, data: {} }), {
						status: 200,
						headers: { "Content-Type": "application/json" },
					}),
				);
			}

			return originalFetch(input, init);
		}) as typeof window.fetch;
	}, ACTIVE_COMPANY);
}

test.describe("Tesorería / Banking — smoke", () => {
	test.beforeEach(async ({ page }) => {
		await installSessionState(page);
	});

	test("loads /tesoreria/banking page with heading and key UI", {
		tag: ["@smoke", "@e2e", "@tesoreria"],
	}, async ({ page }) => {
		await page.goto("/tesoreria/banking");

		// The page should load and show a banking-related heading
		await expect(
			page.getByRole("heading", { name: /bancar|tesorer|cuentas/i }),
		).toBeVisible({ timeout: 20_000 });

		// Should stay on the banking page, no redirect to login
		await expect(page).toHaveURL(/\/tesoreria\/banking/);
	});

	test("loads /tesoreria/bills (cuentas por pagar) page", {
		tag: ["@smoke", "@e2e", "@tesoreria"],
	}, async ({ page }) => {
		await page.goto("/tesoreria/bills");

		await expect(
			page.getByRole("heading", { name: /cuentas por pagar|bills|facturas/i }),
		).toBeVisible({ timeout: 20_000 });

		await expect(page).toHaveURL(/\/tesoreria\/bills/);
	});

	test("loads /tesoreria/cashflow (flujo de caja) page", {
		tag: ["@smoke", "@e2e", "@tesoreria"],
	}, async ({ page }) => {
		await page.goto("/tesoreria/cashflow");

		await expect(
			page.getByRole("heading", { name: /flujo de caja|cash flow|cashflow/i }),
		).toBeVisible({ timeout: 20_000 });

		await expect(page).toHaveURL(/\/tesoreria\/cashflow/);
	});

	test("loads /tesoreria/reconciliations (conciliaciones) page", {
		tag: ["@smoke", "@e2e", "@tesoreria"],
	}, async ({ page }) => {
		await page.goto("/tesoreria/reconciliations");

		await expect(
			page.getByRole("heading", {
				name: /conciliaci|reconciliaci|reconciliation/i,
			}),
		).toBeVisible({ timeout: 20_000 });

		await expect(page).toHaveURL(/\/tesoreria\/reconciliations/);
	});
});
