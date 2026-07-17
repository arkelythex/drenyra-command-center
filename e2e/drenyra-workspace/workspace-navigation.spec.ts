/**
 * Drenyra Workspace Navigation — Smoke Tests
 *
 * Verifies that navigating to the Drenyra workspace via the app shell
 * renders the fiscal command center with company context.
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

		// Mock fetch for auth session and API calls
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

test.describe("Drenyra Workspace Navigation — smoke", () => {
	test.beforeEach(async ({ page }) => {
		await installSessionState(page);
	});

	test("navigates to /drenyra and renders the command center shell", {
		tag: ["@smoke", "@e2e", "@drenyra"],
	}, async ({ page }) => {
		await page.goto("/drenyra");

		// The CodexShell should render with company context
		await expect(page.getByText("ARKELYTHEX S.A.C.")).toBeVisible({
			timeout: 20_000,
		});

		// RUC should be visible somewhere in the shell
		await expect(page.getByText(/RUC\s*20546296564/)).toBeVisible({
			timeout: 10_000,
		});

		// The URL should stay on /drenyra without redirect to login
		await expect(page).toHaveURL(/\/drenyra/);
	});

	test("navigates to /drenyra/hub and renders the hub page", {
		tag: ["@smoke", "@e2e", "@drenyra"],
	}, async ({ page }) => {
		await page.goto("/drenyra/hub");

		// Verify the shell is present
		await expect(page.getByText("ARKELYTHEX S.A.C.")).toBeVisible({
			timeout: 20_000,
		});

		// Should stay on Drenyra hub without redirect to login
		await expect(page).toHaveURL(/\/drenyra\/hub/);
	});

	test("navigates directly to /drenyra/herramientas (tools page)", {
		tag: ["@smoke", "@e2e", "@drenyra"],
	}, async ({ page }) => {
		await page.goto("/drenyra/herramientas");

		// Shell renders with company context
		await expect(page.getByText("ARKELYTHEX S.A.C.")).toBeVisible({
			timeout: 20_000,
		});

		await expect(page).toHaveURL(/\/drenyra\/herramientas/);
	});
});
