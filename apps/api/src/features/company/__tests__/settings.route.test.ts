import { Elysia } from "elysia";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { auth } from "../../auth/auth.config";
import { companySettingsRoute } from "../api/settings.route";

const dbMocks = vi.hoisted(() => {
	const findFirst = vi.fn();
	const returning = vi.fn();
	const where = vi.fn(() => ({ returning }));
	const set = vi.fn(() => ({ where }));
	const update = vi.fn(() => ({ set }));

	return {
		findFirst,
		returning,
		where,
		set,
		update,
	};
});

vi.mock("@drenyra/persistence/client", () => ({
	db: {
		query: {
			companies: {
				findFirst: dbMocks.findFirst,
			},
		},
		update: dbMocks.update,
	},
}));

const COMPANY_A = "00000000-0000-0000-0000-0000000000a1";
const COMPANY_B = "00000000-0000-0000-0000-0000000000b2";

function createApp() {
	return new Elysia().use(companySettingsRoute);
}

function sessionHeaders(companyId: string): HeadersInit {
	return {
		cookie: "better-auth.session_token=test-session",
		"x-auth-user-id": "auth-user-1",
		"x-user-role": "admin",
		"x-company-id": companyId,
	};
}

function mockSession(companyId: string): void {
	vi.spyOn(auth.api, "getSession").mockResolvedValue({
		session: { id: "sess-1" },
		user: {
			id: "auth-user-1",
			role: "admin",
			activeCompanyId: companyId,
		},
	} as never);
}

describe("companySettingsRoute", () => {
	const originalEnv = { ...process.env };

	beforeEach(() => {
		vi.restoreAllMocks();
		vi.clearAllMocks();
		process.env = {
			...originalEnv,
			NODE_ENV: "test",
			SECURITY_ENFORCE_TEST_SESSION: "true",
		};
	});

	afterEach(() => {
		vi.restoreAllMocks();
		process.env = { ...originalEnv };
	});

	it("rejects cross-tenant settings reads before querying the database", async () => {
		mockSession(COMPANY_A);
		const app = createApp();

		const response = await app.handle(
			new Request(`http://localhost/api/company/${COMPANY_B}/settings`, {
				headers: sessionHeaders(COMPANY_A),
			}),
		);

		expect(response.status).toBe(403);
		expect(await response.json()).toMatchObject({
			code: "TENANT_SCOPE_VIOLATION",
		});
		expect(dbMocks.findFirst).not.toHaveBeenCalled();
	});

	it("rejects cross-tenant settings writes before updating the database", async () => {
		mockSession(COMPANY_A);
		const app = createApp();

		const response = await app.handle(
			new Request(`http://localhost/api/company/${COMPANY_B}/settings`, {
				method: "PATCH",
				headers: {
					...sessionHeaders(COMPANY_A),
					"content-type": "application/json",
				},
				body: JSON.stringify({ language: "es" }),
			}),
		);

		expect(response.status).toBe(403);
		expect(await response.json()).toMatchObject({
			code: "TENANT_SCOPE_VIOLATION",
		});
		expect(dbMocks.update).not.toHaveBeenCalled();
	});

	it("returns settings for the authenticated company", async () => {
		mockSession(COMPANY_A);
		dbMocks.findFirst.mockResolvedValue({
			settingsLanguage: "es",
			settingsTimezone: "America/Lima",
			settingsCurrency: "PEN",
			businessName: "ARKELYTHEX DEMO SAC",
			ruc: "20100070970",
			settingsAutoClosePeriod: true,
			settingsShowAmountsInWords: false,
		});
		const app = createApp();

		const response = await app.handle(
			new Request(`http://localhost/api/company/${COMPANY_A}/settings`, {
				headers: sessionHeaders(COMPANY_A),
			}),
		);

		expect(response.status).toBe(200);
		expect(dbMocks.findFirst).toHaveBeenCalledTimes(1);
		expect(await response.json()).toMatchObject({
			language: "es",
			timezone: "America/Lima",
			currency: "PEN",
			companyName: "ARKELYTHEX DEMO SAC",
			companyRuc: "20100070970",
		});
	});
});
