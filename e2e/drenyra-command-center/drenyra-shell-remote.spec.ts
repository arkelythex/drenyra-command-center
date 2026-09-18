/**
 * Arkelythex shell — Drenyra Module Federation / dev redirect smoke test.
 *
 * Full Command Center E2E lives in the Drenyra product repo:
 * github.com/arkelythex/drenyra-command-center — e2e/drenyra-command-center/
 */
import { expect, test } from "../base-test";

const AUTH_SESSION = {
	success: true,
	data: {
		session: {
			id: "session-e2e",
			userId: "user-e2e",
			expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
		},
		user: {
			id: "user-e2e",
			email: "admin@test.com",
			name: "Admin Tester",
			role: "ADMIN",
		},
	},
};

async function mockAuthSession(page: import("@playwright/test").Page) {
	await page.route(
		(url) => {
			try {
				return new URL(url).pathname === "/api/auth/session";
			} catch {
				return false;
			}
		},
		async (route) => {
			await route.fulfill({
				status: 200,
				contentType: "application/json",
				body: JSON.stringify(AUTH_SESSION),
			});
		},
	);
}

test.describe("Drenyra shell integration", () => {
	test("dev /drenyra shows redirect to Drenyra product server", async ({
		page,
	}) => {
		await mockAuthSession(page);
		await page.goto("/drenyra");

		await expect(
			page.getByText(/Redirigiendo al servidor de desarrollo de Drenyra/i),
		).toBeVisible();
		await expect(page.getByRole("link", { name: /5174/ })).toBeVisible();
	});
});
