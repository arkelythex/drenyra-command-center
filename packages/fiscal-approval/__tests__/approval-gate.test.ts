import { describe, it, expect, beforeEach } from "vitest";
import { createApprovalGate } from "../src/approval-gate";
import { approvalStore } from "../src/approval-store";
import {
	generateRecommendation,
	resetRecIdCounter,
} from "../src/recommendation-engine";

function makeRec() {
	resetRecIdCounter();
	return generateRecommendation({
		pipelineRunId: "pipe-001",
		tipoAccion: "contabilizar-igv",
		ruc: "20123456789",
		periodo: "2026-07",
		descripcion: "Contabilizar IGV",
		monto: 18234.5,
		confianza: 0.92,
		fuentes: [],
	});
}

beforeEach(() => {
	approvalStore.clear();
});

describe("approval-gate", () => {
	it("returns pending verdict for new recommendation", async () => {
		const rec = makeRec();
		approvalStore.save(rec);

		const gate = createApprovalGate(rec, { store: approvalStore });
		const verdict = await gate.check(null, {
			scope: {
				organizationId: "org-1",
				companyId: "cmp-1",
				companyRuc: "20123456789",
				period: "2026-07",
			},
			previousGates: new Map(),
		});

		expect(verdict.passed).toBe(false);
		expect(verdict.severity).toBe("BLOCKING");
		expect(
			verdict.reasons.some((r: string) => r.includes("waiting for approval")),
		).toBe(true);
	});

	it("passes when recommendation is approved", async () => {
		const rec = makeRec();
		approvalStore.save(rec);
		approvalStore.approve("REC-001", "contador@drenyra");

		const gate = createApprovalGate(rec, { store: approvalStore });
		const verdict = await gate.check(null, {
			scope: {
				organizationId: "org-1",
				companyId: "cmp-1",
				companyRuc: "20123456789",
				period: "2026-07",
			},
			previousGates: new Map(),
		});

		expect(verdict.passed).toBe(true);
		expect(verdict.severity).toBe("INFO");
		expect(verdict.reasons.some((r: string) => r.includes("approved"))).toBe(
			true,
		);
	});

	it("blocks when recommendation is rejected", async () => {
		const rec = makeRec();
		approvalStore.save(rec);
		approvalStore.reject("REC-001", "contador@drenyra", "período incorrecto");

		const gate = createApprovalGate(rec, { store: approvalStore });
		const verdict = await gate.check(null, {
			scope: {
				organizationId: "org-1",
				companyId: "cmp-1",
				companyRuc: "20123456789",
				period: "2026-07",
			},
			previousGates: new Map(),
		});

		expect(verdict.passed).toBe(false);
		expect(verdict.severity).toBe("BLOCKING");
		expect(verdict.reasons.some((r: string) => r.includes("rejected"))).toBe(
			true,
		);
	});

	it("self-saves recommendation if not already in store", async () => {
		const rec = makeRec();
		// Don't save to store first — gate should save it

		const gate = createApprovalGate(rec, { store: approvalStore });
		await gate.check(null, {
			scope: {
				organizationId: "org-1",
				companyId: "cmp-1",
				companyRuc: "20123456789",
				period: "2026-07",
			},
			previousGates: new Map(),
		});

		const saved = approvalStore.get("REC-001");
		expect(saved).toBeDefined();
	});

	it("times out after configured hours", async () => {
		const rec = makeRec();
		// Set creation time far in the past
		const pastDate = new Date(Date.now() - 25 * 60 * 60 * 1000);
		rec.creado = pastDate.toISOString();
		approvalStore.save(rec);

		const gate = createApprovalGate(rec, {
			store: approvalStore,
			config: {
				timeoutHoras: 24,
				escalateAfter: 12,
				minConfidence: 0.7,
				maxPendingPerUser: 10,
			},
		});
		const verdict = await gate.check(null, {
			scope: {
				organizationId: "org-1",
				companyId: "cmp-1",
				companyRuc: "20123456789",
				period: "2026-07",
			},
			previousGates: new Map(),
		});

		expect(verdict.passed).toBe(false);
		expect(verdict.reasons.some((r: string) => r.includes("timed out"))).toBe(
			true,
		);
	});
});
