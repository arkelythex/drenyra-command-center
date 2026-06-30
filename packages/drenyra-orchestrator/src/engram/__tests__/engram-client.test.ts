import { describe, expect, it } from "vitest";
import {
	EngramHttpClient,
	gateEvidenceToEngramPayload,
} from "../../engram/engram-client";
import {
	createInMemoryGateEvidenceRecorder,
	gateResultToEvidenceRecord,
} from "../../phase/gate-evidence-recorder";

describe("engram-client", () => {
	it("maps gate evidence to engram payload", () => {
		const record = gateResultToEvidenceRecord(
			{
				gateId: "test-gate",
				gateName: "Test Gate",
				passed: true,
				severity: "info",
				evaluatedAt: new Date("2026-06-30T12:00:00Z"),
			},
			{
				ruc: "20123456789",
				periodo: "2026-06",
				currentPhase: "conciliacion",
				targetPhase: "cierre",
				phaseState: {
					phaseId: "conciliacion",
					status: "in_progress",
					gateResults: [],
				},
				periodState: {
					ruc: "20123456789",
					periodo: "2026-06",
					currentPhase: "conciliacion",
					status: "in_progress",
					phaseHistory: [],
					metadata: {},
					createdAt: new Date(),
					updatedAt: new Date(),
				},
			},
		);

		const payload = gateEvidenceToEngramPayload(record, "cmp-1");
		expect(payload.tier).toBe("T2_STRONG");
		expect(payload.ruc).toBe("20123456789");
		expect(payload.companyId).toBe("cmp-1");
		expect(payload.phase).toBe("validate");
	});

	it("posts evidence via HTTP client", async () => {
		const calls: Array<{ method: string; path: string; body?: unknown }> = [];
		const client = new EngramHttpClient({
			baseUrl: "http://engram.test",
			fetchImpl: async (input, init) => {
				calls.push({
					method: init?.method ?? "GET",
					path: String(input),
					body: init?.body ? JSON.parse(String(init.body)) : undefined,
				});
				return new Response(JSON.stringify({ status: "ok" }), { status: 201 });
			},
		});

		await client.saveEvidence({
			id: "ev-1",
			operationId: "op-1",
			phase: "validate",
			tier: "T2_STRONG",
			timestamp: new Date().toISOString(),
			actor: "system",
			action: "gate",
			input: {},
			output: {},
			tenantId: "cmp-1",
			ruc: "20123456789",
			companyId: "cmp-1",
			traceId: "tr-1",
		});

		expect(calls[0]?.method).toBe("POST");
		expect(calls[0]?.path).toContain("/api/v1/evidence");
	});

	it("still supports in-memory recorder", async () => {
		const recorder = createInMemoryGateEvidenceRecorder();
		await recorder.record({
			ruc: "20123456789",
			periodo: "2026-06",
			phaseId: "cierre",
			gateId: "g1",
			gateName: "Gate",
			passed: true,
			severity: "info",
			summary: "ok",
			tier: "T2_STRONG",
			evaluatedAt: new Date().toISOString(),
		});
		expect(recorder.entries).toHaveLength(1);
	});
});
