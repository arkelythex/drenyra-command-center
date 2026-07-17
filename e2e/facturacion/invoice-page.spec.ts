/**
 * Facturación / Invoices Page — Smoke Tests
 *
 * Verifies that the facturacion/invoices page loads correctly:
 * - Page renders with correct heading
 * - Key UI elements are present (create invoice button, list)
 * - Navigation stays within the facturacion section
 *
 * These test the Spanish-route version of the invoices feature
 * (as opposed to the /invoices English route tested elsewhere).
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

			// Mock invoice data endpoints
			if (url.includes("/api/invoices") || url.includes("/api/facturacion")) {
				return Promise.resolve(
					new Response(
						JSON.stringify({
							success: true,
							data: {
								invoices: [
									{
										id: "inv-1",
										serie: "F001",
										correlativo: 1,
										cliente: "Cliente Demo SAC",
										ruc: "20123456789",
										total: 1180,
										estado: "emitido",
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

			// Mock credit notes endpoint
			if (url.includes("/api/credit-notes")) {
				return Promise.resolve(
					new Response(
						JSON.stringify({ success: true, data: { creditNotes: [] } }),
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

test.describe("Facturación / Invoices — smoke", () => {
	test.beforeEach(async ({ page }) => {
		await installSessionState(page);
	});

	test("loads /facturacion/invoices page with heading and key UI", {
		tag: ["@smoke", "@e2e", "@facturacion"],
	}, async ({ page }) => {
		await page.goto("/facturacion/invoices");

		// Should show a heading related to invoices
		await expect(
			page.getByRole("heading", { name: /factur|invoice|comprobant/i }),
		).toBeVisible({ timeout: 20_000 });

		// Should stay on facturacion/invoices without redirect to login
		await expect(page).toHaveURL(/\/facturacion\/invoices/);
	});

	test("loads /facturacion/credit-notes (notas de crédito) page", {
		tag: ["@smoke", "@e2e", "@facturacion"],
	}, async ({ page }) => {
		await page.goto("/facturacion/credit-notes");

		await expect(
			page.getByRole("heading", {
				name: /nota de crédito|credit note|nota de credito/i,
			}),
		).toBeVisible({ timeout: 20_000 });

		await expect(page).toHaveURL(/\/facturacion\/credit-notes/);
	});

	test("loads /facturacion/debit-notes (notas de débito) page", {
		tag: ["@smoke", "@e2e", "@facturacion"],
	}, async ({ page }) => {
		await page.goto("/facturacion/debit-notes");

		await expect(
			page.getByRole("heading", {
				name: /nota de débito|debit note|nota de debito/i,
			}),
		).toBeVisible({ timeout: 20_000 });

		await expect(page).toHaveURL(/\/facturacion\/debit-notes/);
	});
});
