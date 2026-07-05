import { expect, test } from "../base-test";

const ACTIVE_COMPANY = {
	companyId: "00000000-0000-0000-0000-000000000001",
	companyName: "DRENYRA S.A.C.",
	ruc: "20546296564",
	countryCode: "pe",
	isDemoFallback: false,
};

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
			companyId: ACTIVE_COMPANY.companyId,
			activeCompanyId: ACTIVE_COMPANY.companyId,
			companyName: ACTIVE_COMPANY.companyName,
			ruc: ACTIVE_COMPANY.ruc,
			countryCode: "pe",
		},
	},
};

function isAppApiRequest(url: string): boolean {
	try {
		return new URL(url).pathname.startsWith("/api/");
	} catch {
		return false;
	}
}

async function installSessionState(page: import("@playwright/test").Page) {
	await page.addInitScript((company: typeof ACTIVE_COMPANY) => {
		window.localStorage.setItem(
			"drenyra-active-company",
			JSON.stringify(company),
		);
	}, ACTIVE_COMPANY);
}

async function mockAuthSession(page: import("@playwright/test").Page) {
	await page.route(
		(url) =>
			isAppApiRequest(url.toString()) &&
			new URL(url).pathname === "/api/auth/session",
		async (route) => {
			await route.fulfill({
				status: 200,
				contentType: "application/json",
				body: JSON.stringify(AUTH_SESSION),
			});
		},
	);
}

test.describe("SIRE Diff", () => {
	test.beforeEach(async ({ page }) => {
		await installSessionState(page);
		await mockAuthSession(page);
	});

	test("loads SIRE diff page shell", async ({ page }) => {
		await page.goto("/cumplimiento/sire-diff");
		await expect(
			page.getByRole("heading", { name: /SIRE Diff/i }),
		).toBeVisible();
		await expect(
			page.getByRole("button", { name: /Run three-way diff/i }),
		).toBeVisible();
	});

	test("shows expediente evidence link for selected period", async ({
		page,
	}) => {
		await page.goto("/cumplimiento/sire-diff");
		const link = page.getByRole("link", { name: /Open expediente evidence/i });
		await expect(link).toBeVisible();
		await expect(link).toHaveAttribute(
			"href",
			"/cumplimiento/expedientes?periodo=2026-03",
		);
	});
});
