import { describe, it, expect, beforeEach } from "vitest";
import { approvalStore } from "../src/approval-store";
import {
	generateRecommendation,
	resetRecIdCounter,
} from "../src/recommendation-engine";

function makeRec(
	overrides?: Partial<ReturnType<typeof generateRecommendation>>,
) {
	resetRecIdCounter();
	const base = generateRecommendation({
		pipelineRunId: "pipe-001",
		tipoAccion: "contabilizar-igv",
		ruc: "20123456789",
		periodo: "2026-07",
		descripcion: "Test recommendation",
		monto: 1000,
		confianza: 0.9,
		fuentes: [],
	});
	return { ...base, ...overrides };
}

beforeEach(() => {
	approvalStore.clear();
});

describe("approval-store", () => {
	it("saves and retrieves a recommendation", () => {
		const rec = makeRec();
		approvalStore.save(rec);

		const retrieved = approvalStore.get("REC-001");
		expect(retrieved).toBeDefined();
		expect(retrieved?.id).toBe("REC-001");
		expect(retrieved?.status).toBe("pending");
	});

	it("approves a pending recommendation", () => {
		const rec = makeRec();
		approvalStore.save(rec);

		const approved = approvalStore.approve("REC-001", "contador@drenyra");
		expect(approved).toBeDefined();
		expect(approved?.status).toBe("approved");
		expect(approved?.aprobadoPor).toBe("contador@drenyra");
		expect(approved?.aprobadoEn).toBeDefined();
	});

	it("rejects a pending recommendation", () => {
		const rec = makeRec();
		approvalStore.save(rec);

		const rejected = approvalStore.reject(
			"REC-001",
			"contador@drenyra",
			"período incorrecto",
		);
		expect(rejected).toBeDefined();
		expect(rejected?.status).toBe("rejected");
		expect(rejected?.motivoRechazo).toBe("período incorrecto");
	});

	it("returns undefined when approving unknown recommendation", () => {
		const result = approvalStore.approve("REC-999", "contador@drenyra");
		expect(result).toBeUndefined();
	});

	it("lists only pending recommendations", () => {
		const rec1 = makeRec({ id: "REC-001" });
		approvalStore.save(rec1);

		resetRecIdCounter();
		const rec2 = makeRec({ id: "REC-002" });
		rec2.status = "approved";
		approvalStore.save(rec2);

		const pending = approvalStore.list({ status: "pending" });
		expect(pending).toHaveLength(1);
		expect(pending[0]?.id).toBe("REC-001");
	});

	it("filters by RUC", () => {
		const rec1 = makeRec({ id: "REC-001", ruc: "20123456789" });
		const rec2 = makeRec({ id: "REC-002", ruc: "20987654321" });
		approvalStore.save(rec1);
		approvalStore.save(rec2);

		const filtered = approvalStore.list({ ruc: "20123456789" });
		expect(filtered).toHaveLength(1);
	});

	it("provides summary statistics", () => {
		const rec1 = makeRec({ id: "REC-001" });
		const rec2 = makeRec({ id: "REC-002" });
		approvalStore.save(rec1);
		approvalStore.save(rec2);
		approvalStore.approve("REC-001", "user@test");

		const summary = approvalStore.getSummary();
		expect(summary.total).toBe(2);
		expect(summary.approved).toBe(1);
		expect(summary.pending).toBe(1);
	});

	it("tracks approval history", () => {
		const rec = makeRec();
		approvalStore.save(rec);
		approvalStore.approve("REC-001", "contador@drenyra");

		const history = approvalStore.getHistory();
		expect(history).toHaveLength(1);
		expect(history[0]?.action).toBe("approve");
		expect(history[0]?.userId).toBe("contador@drenyra");
	});
});
