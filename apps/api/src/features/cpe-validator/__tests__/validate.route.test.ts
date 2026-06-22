import { Elysia } from "elysia";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { cpeValidatorRoutes } from "../api/routes";
import { VALID_CPE_XML } from "./support/valid-cpe-xml";

vi.mock("../../security/session-context", () => ({
	resolveSessionContext: vi.fn(),
}));

import { resolveSessionContext } from "../../security/session-context";

const mockResolve = resolveSessionContext as unknown as ReturnType<
	typeof vi.fn
>;

const BASE_BODY = {
	companyRuc: "20100070970",
	cpeNumber: "F001-00001234",
	xmlContent: VALID_CPE_XML,
	issueDate: "2026-02-15",
	totalAmount: 1000,
	skipCache: true,
};

async function get(path: string) {
	const app = new Elysia().use(cpeValidatorRoutes);
	return app.handle(new Request(`http://localhost${path}`));
}

async function post(body: Record<string, unknown>) {
	const app = new Elysia().use(cpeValidatorRoutes);
	return app.handle(
		new Request("http://localhost/api/cpe-validator/validate", {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify(body),
		}),
	);
}

describe("cpe-validator validate route", () => {
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

	afterEach(() => {
		delete process.env.SUNAT_CPE_VALIDATION_MODE;
	});

	it("returns 200 for valid payloads", async () => {
		process.env.SUNAT_CPE_VALIDATION_MODE = "simulation";

		const response = await post(BASE_BODY);
		const payload = await response.json();

		expect(response.status).toBe(200);
		expect(payload).toMatchObject({
			success: true,
			data: {
				isValid: true,
				incident: {
					category: "NONE",
				},
			},
		});
	});

	it("returns 400 with runbook metadata for observed/review-required payloads", async () => {
		process.env.SUNAT_CPE_VALIDATION_MODE = "replay";

		const response = await post({
			...BASE_BODY,
			cpeNumber: "F001-00007777",
		});
		const payload = await response.json();

		expect(response.status).toBe(400);
		expect(payload).toMatchObject({
			success: false,
			code: "SUNAT_OBSERVED",
			supportMessage:
				"Revisar tributos, totales y datos del comprobante antes de reenviar.",
			runbook: {
				id: "RB-CPE-INCIDENT-2026-02",
			},
			data: {
				incident: {
					isIncident: true,
					category: "SUNAT_OBSERVED",
					supportMessage:
						"Revisar tributos, totales y datos del comprobante antes de reenviar.",
				},
			},
		});
	});
	it("returns live validation cache statistics", async () => {
		process.env.SUNAT_CPE_VALIDATION_MODE = "simulation";

		await post({
			...BASE_BODY,
			cpeNumber: "F001-00009999",
		});

		const response = await get("/api/cpe-validator/cache-stats");
		const payload = await response.json();

		expect(response.status).toBe(200);
		expect(payload).toMatchObject({
			success: true,
			data: {
				maxSize: 1000,
			},
		});
		expect(payload.data.size).toBeGreaterThanOrEqual(1);
		expect(payload.data.utilizationPercent).toBeGreaterThan(0);
	});
});
