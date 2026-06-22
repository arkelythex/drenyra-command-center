import { Elysia } from "elysia";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { cpeValidatorRoutes } from "../api/routes";

vi.mock("../../security/session-context", () => ({
	resolveSessionContext: vi.fn(),
}));

import { resolveSessionContext } from "../../security/session-context";

const mockResolve = resolveSessionContext as unknown as ReturnType<
	typeof vi.fn
>;

describe("cpe-validator rules meta route", () => {
	beforeEach(() => {
		mockResolve.mockResolvedValue({
			ok: true,
			context: {
				userId: "test-user",
				authUserId: "test-user",
				legacyUserId: null,
				role: "admin",
				companyId: "test-company",
			},
		});
	});
	it("returns explicit rules baseline and coverage", async () => {
		const app = new Elysia().use(cpeValidatorRoutes);

		const response = await app.handle(
			new Request("http://localhost/api/cpe-validator/rules-meta"),
		);
		const payload = await response.json();

		expect(response.status).toBe(200);
		expect(payload).toMatchObject({
			success: true,
			data: {
				source: "SUNAT CPE - Reglas de Validacion",
				lastOfficialReviewDate: "2026-02-09",
				coverage: {
					offlineUblStructure: "partial",
					fullXsdValidation: true,
				},
			},
		});
	});
});
