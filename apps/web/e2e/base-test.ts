import { type BrowserContext, test as base } from "@playwright/test";

export { expect } from "@playwright/test";

export const DEMO_COMPANY = {
	companyId: "00000000-0000-0000-0000-000000000001",
	companyName: "ARKELYTHEX S.A.C.",
	ruc: "20546296564",
	countryCode: "pe",
	isDemoFallback: false,
} as const;

const DEMO_SESSION = {
	success: true,
	user: { id: "e2e-user", email: "demo@drenyra.pe", name: "Demo" },
	session: { token: "e2e-token", userId: "e2e-user" },
};

/**
 * Runs the SPA without a backend: authenticated session, active company,
 * and every other `/api/*` call answered with an empty success payload.
 * Specs that need specific data register their own `page.route` afterwards;
 * Playwright runs the most recently registered matching handler first.
 */
export async function installMockBackend(context: BrowserContext) {
	await context.addInitScript((company) => {
		window.localStorage.setItem(
			"arkelythex-active-company",
			JSON.stringify(company),
		);
	}, DEMO_COMPANY);
	await context.route(
		(url) => url.pathname.startsWith("/api/"),
		(route) => {
			const { pathname } = new URL(route.request().url());
			if (
				pathname.startsWith("/api/auth/session") ||
				pathname.startsWith("/api/auth/get-session")
			) {
				return route.fulfill({ json: DEMO_SESSION });
			}
			return route.fulfill({ json: { success: true, data: [] } });
		},
	);
}

export const test = base.extend<{ mockBackend: undefined }>({
	mockBackend: [
		async ({ context }, use) => {
			await installMockBackend(context);
			await use(undefined);
		},
		{ auto: true },
	],
});
