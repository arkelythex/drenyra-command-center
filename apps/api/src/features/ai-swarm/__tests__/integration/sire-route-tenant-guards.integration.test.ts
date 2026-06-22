import { Elysia } from "elysia";
import { beforeEach, describe, expect, it, vi } from "vitest";

const sireReadinessRunMock = vi.hoisted(() =>
	vi.fn(async () => ({ igvCheck: { compliant: true } })),
);
const sireAdversarialAuditRunMock = vi.hoisted(() =>
	vi.fn(async () => ({ arbiterDecision: { compliant: true } })),
);

vi.mock("../../workflows/sire-readiness-subagents.service", () => ({
	SireReadinessSubagentsService: class {
		run = sireReadinessRunMock;
	},
}));

vi.mock("../../workflows/sire-adversarial-audit.service", () => ({
	SireAdversarialAuditService: class {
		run = sireAdversarialAuditRunMock;
	},
}));

import { sireRoute } from "../../api/sire.route";

const readinessBody = {
	companyId: "cmp-1",
	period: "2026-02",
	declaredIgvPen: 18,
	salesTotalPen: 118,
	rvieRecords: 1,
	rceRecords: 1,
	pleSalesRecords: 1,
	plePurchaseRecords: 1,
};

const adversarialBody = {
	...readinessBody,
	ruc: "20100070970",
};

function postJson(
	path: string,
	body: unknown,
	headers: Record<string, string> = {},
): Promise<Response> {
	const app = new Elysia().use(sireRoute);
	return app.handle(
		new Request(`http://localhost${path}`, {
			method: "POST",
			headers: { "content-type": "application/json", ...headers },
			body: JSON.stringify(body),
		}),
	);
}

describe("SIRE route tenant guards", () => {
	beforeEach(() => {
		sireReadinessRunMock.mockClear();
		sireAdversarialAuditRunMock.mockClear();
	});

	it("rejects readiness requests without request tenant context", async () => {
		const response = await postJson(
			"/api/ai-swarm/sire-readiness",
			readinessBody,
		);
		const payload = await response.json();

		expect(response.status).toBe(400);
		expect(payload.success).toBe(false);
		expect(payload.code).toBe("TENANT_CONTEXT_REQUIRED");
		expect(sireReadinessRunMock).not.toHaveBeenCalled();
	});

	it("rejects readiness requests when body.companyId conflicts with header tenant", async () => {
		const response = await postJson(
			"/api/ai-swarm/sire-readiness",
			readinessBody,
			{ "x-company-id": "cmp-2" },
		);
		const payload = await response.json();

		expect(response.status).toBe(400);
		expect(payload.success).toBe(false);
		expect(payload.code).toBe("TENANT_CONTEXT_CONFLICT");
		expect(sireReadinessRunMock).not.toHaveBeenCalled();
	});

	it("allows readiness requests when body.companyId matches header tenant", async () => {
		const response = await postJson(
			"/api/ai-swarm/sire-readiness",
			readinessBody,
			{ "x-company-id": "cmp-1" },
		);
		const payload = await response.json();

		expect(response.status).toBe(200);
		expect(payload.success).toBe(true);
		expect(sireReadinessRunMock).toHaveBeenCalledTimes(1);
		expect(sireReadinessRunMock.mock.calls[0]?.[0]).toMatchObject({
			companyId: "cmp-1",
		});
	});

	it("rejects adversarial audit when body.companyId conflicts with header tenant", async () => {
		const response = await postJson(
			"/api/ai-swarm/sire-adversarial-audit",
			adversarialBody,
			{ "x-company-id": "cmp-2" },
		);
		const payload = await response.json();

		expect(response.status).toBe(400);
		expect(payload.success).toBe(false);
		expect(payload.code).toBe("TENANT_CONTEXT_CONFLICT");
		expect(sireAdversarialAuditRunMock).not.toHaveBeenCalled();
	});
});
