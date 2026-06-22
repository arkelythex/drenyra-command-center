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

const BASE_BODY = {
	companyRuc: "20100070970",
	cpeNumber: "F001-00001234",
	issueDate: "2026-02-19",
	totalAmount: 1000,
};

async function post(body: unknown) {
	const app = new Elysia().use(cpeValidatorRoutes);
	return app.handle(
		new Request("http://localhost/api/cpe-validator/fallback/probe", {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify(body),
		}),
	);
}

describe("cpe-validator fallback probe route", () => {
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
	it("returns visual fallback trace for normal mode", async () => {
		const response = await post({ ...BASE_BODY, mode: "normal" });
		const payload = await response.json();

		expect(response.status).toBe(200);
		expect(payload.success).toBe(true);
		expect(payload.data.source).toBe("visual_subagent");
		expect(payload.data.trace.steps).toContain("txt-local-parse");
	});

	it("returns HITL payload when mode=hitl", async () => {
		const response = await post({ ...BASE_BODY, mode: "hitl" });
		const payload = await response.json();

		expect(response.status).toBe(200);
		expect(payload.success).toBe(true);
		expect(payload.data.hitl.required).toBe(true);
		expect(payload.data.hitl.channel).toBe("whatsapp");
	});
});
