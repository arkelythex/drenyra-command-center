import { Elysia } from "elysia";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
	resolveSessionContext: vi.fn(),
	listLocalSireRecords: vi.fn(),
}));

vi.mock("../../../security/session-context", () => ({
	resolveSessionContext: mocks.resolveSessionContext,
}));

vi.mock("../local-sire-records.repository", () => ({
	listLocalSireRecords: mocks.listLocalSireRecords,
}));

import { sireComparisonRoutes } from "../../routes";

const app = new Elysia().use(sireComparisonRoutes);

function get(path: string) {
	return app.handle(
		new Request(`http://localhost${path}`, {
			headers: { "x-company-id": "cmp_1" },
		}),
	);
}

describe("GET /api/sire/comparison/:period/local-records", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mocks.resolveSessionContext.mockResolvedValue({
			ok: true,
			context: {
				userId: "user-1",
				authUserId: "user-1",
				legacyUserId: null,
				role: "admin",
				companyId: "cmp_1",
			},
		});
	});

	it("returns the company's books for the period and register", async () => {
		const record = { serie: "F001", numero: "1", total: 118000 };
		mocks.listLocalSireRecords.mockResolvedValue([record]);

		const response = await get(
			"/api/sire/comparison/2025-01/local-records?companyId=cmp_1&kind=RCE",
		);

		expect(response.status).toBe(200);
		expect(await response.json()).toMatchObject({
			success: true,
			data: [record],
		});
		expect(mocks.listLocalSireRecords).toHaveBeenCalledWith(
			"cmp_1",
			"2025-01",
			"RCE",
		);
	});

	it("refuses another company's books", async () => {
		const response = await get(
			"/api/sire/comparison/2025-01/local-records?companyId=cmp_2&kind=RVIE",
		);

		expect(response.status).toBe(403);
		expect(mocks.listLocalSireRecords).not.toHaveBeenCalled();
	});

	it("rejects an unknown register", async () => {
		const response = await get(
			"/api/sire/comparison/2025-01/local-records?companyId=cmp_1&kind=PLE",
		);

		expect(response.status).toBe(422);
		expect(mocks.listLocalSireRecords).not.toHaveBeenCalled();
	});
});
