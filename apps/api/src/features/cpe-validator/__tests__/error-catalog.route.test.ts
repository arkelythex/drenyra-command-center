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

describe("cpe-validator error catalog route", () => {
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
	it("returns a stable support mapping for common SUNAT issues", async () => {
		const app = new Elysia().use(cpeValidatorRoutes);

		const response = await app.handle(
			new Request("http://localhost/api/cpe-validator/error-catalog"),
		);
		const payload = await response.json();

		expect(response.status).toBe(200);
		expect(payload).toMatchObject({
			success: true,
			data: {
				total: 4,
				items: expect.arrayContaining([
					expect.objectContaining({
						state: "OBSERVADO",
						code: "0101",
						incidentCategory: "SUNAT_OBSERVED",
					}),
					expect.objectContaining({
						state: "RECHAZADO",
						code: "2320",
						incidentCategory: "SUNAT_REJECTED",
					}),
				]),
			},
		});
	});
});
