import type { Context } from "elysia";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../auth.config", () => ({
	auth: {
		handler: vi.fn(),
	},
}));

vi.mock("../../handlers/session-company-context", () => ({
	enrichSessionUserWithCompanyContext: vi.fn(),
}));

import { auth } from "../../auth.config";
import { handleGetSession } from "../../handlers/session.handler";
import { enrichSessionUserWithCompanyContext } from "../../handlers/session-company-context";

describe("handleGetSession", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("returns the Better Auth session with enriched company context", async () => {
		vi.mocked(auth.handler).mockResolvedValue(
			new Response(
				JSON.stringify({
					session: { id: "session-1" },
					user: { id: "user-1", ruc: "20608451231" },
				}),
				{ status: 200 },
			),
		);
		vi.mocked(enrichSessionUserWithCompanyContext).mockResolvedValue({
			id: "user-1",
			legacyUserId: "00000000-0000-0000-0000-000000000111",
			ruc: "20608451231",
			countryCode: "pe",
			companyId: "cmp-1",
			activeCompanyId: "cmp-1",
			companyName: "NEBULA OPERACIONES LOGISTICAS S.A.C.",
			availableCompanies: [
				{
					companyId: "cmp-1",
					companyName: "NEBULA OPERACIONES LOGISTICAS S.A.C.",
					ruc: "20608451231",
					countryCode: "pe",
					membershipRole: "OWNER",
					isDefault: true,
				},
			],
		});

		const set = { status: 200 } as { status: number };
		const result = await handleGetSession({
			headers: {},
			set,
		} as Context);

		expect(enrichSessionUserWithCompanyContext).toHaveBeenCalledWith({
			id: "user-1",
			ruc: "20608451231",
		});
		expect(result).toEqual({
			success: true,
			data: {
				session: { id: "session-1" },
				user: {
					id: "user-1",
					legacyUserId: "00000000-0000-0000-0000-000000000111",
					ruc: "20608451231",
					countryCode: "pe",
					companyId: "cmp-1",
					activeCompanyId: "cmp-1",
					companyName: "NEBULA OPERACIONES LOGISTICAS S.A.C.",
					availableCompanies: [
						{
							companyId: "cmp-1",
							companyName: "NEBULA OPERACIONES LOGISTICAS S.A.C.",
							ruc: "20608451231",
							countryCode: "pe",
							membershipRole: "OWNER",
							isDefault: true,
						},
					],
				},
			},
		});
	});

	it("returns a null session envelope when Better Auth rejects the request", async () => {
		vi.mocked(auth.handler).mockResolvedValue(
			new Response(JSON.stringify({ error: { message: "Unauthorized" } }), {
				status: 401,
			}),
		);

		const set = { status: 200 } as { status: number };
		const result = await handleGetSession({
			headers: {},
			set,
		} as Context);

		expect(result).toEqual({
			success: true,
			data: {
				session: null,
				user: null,
			},
		});
		expect(set.status).toBe(200);
	});

	it("returns a null session envelope when Better Auth fails with 5xx", async () => {
		vi.mocked(auth.handler).mockResolvedValue(
			new Response(JSON.stringify({ message: "Database unavailable" }), {
				status: 500,
			}),
		);

		const set = { status: 200 } as { status: number };
		const result = await handleGetSession({
			headers: {},
			set,
		} as Context);

		expect(result).toEqual({
			success: true,
			data: {
				session: null,
				user: null,
			},
		});
		expect(set.status).toBe(200);
	});
});
