import { describe, expect, it } from "vitest";
import type { AgentContext } from "../../types/agent-context";
import type { DuplicateInvoiceCheck } from "../duplicate-invoice.strategy";
import { createDuplicateInvoiceStrategy } from "../duplicate-invoice.strategy";

const mockContext: AgentContext = {
	tenantId: "test",
	userId: "test",
	organizationId: "test",
	companyId: "test",
	ruc: "20123456789",
	traceId: "test",
};

function makeInv(
	overrides: Partial<DuplicateInvoiceCheck> = {},
): DuplicateInvoiceCheck {
	return {
		id: `INV-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
		serie: `F${Math.random().toString(36).slice(2, 5).toUpperCase()}`,
		numero: `${Math.floor(Math.random() * 999) + 1}`,
		total: 1000,
		emisorRuc: "20123456789",
		emisionDate: "2026-01-15T10:00:00.000Z",
		moneda: "PEN",
		...overrides,
	};
}

describe("createDuplicateInvoiceStrategy", () => {
	const strategy = createDuplicateInvoiceStrategy();

	it("should return correct strategy metadata", () => {
		expect(strategy.id).toBe("duplicate-invoice");
		expect(strategy.name).toContain("Duplicate");
		expect(strategy.minSeverity).toBe("medium");
	});

	it("should detect definitive duplicate (same serie+numero+emisor)", () => {
		const baseInv = makeInv({ id: "INV-001", serie: "F001", numero: "1" });
		const dupInv = makeInv({ id: "INV-002", serie: "F001", numero: "1" });
		const anomalies = strategy.execute([baseInv, dupInv], mockContext);
		expect(anomalies).toHaveLength(1);
		expect(anomalies[0].severity).toBe("critical");
		expect(anomalies[0].confidence).toBe(0.99);
		expect(anomalies[0].metric).toBe("definitive_duplicate");
	});

	it("should not flag same serie+numero with different emisor", () => {
		const anomalies = strategy.execute(
			[
				makeInv({
					id: "A",
					emisorRuc: "20111111111",
					serie: "F001",
					numero: "1",
				}),
				makeInv({
					id: "B",
					emisorRuc: "20222222222",
					serie: "F001",
					numero: "1",
				}),
			],
			mockContext,
		);
		// Different emisor, no definitive duplicate
		// Same total + different emisor → no suspicious either
		expect(anomalies).toHaveLength(0);
	});

	it("should detect suspicious duplicate (same amount+emisor within 2h)", () => {
		const anomalies = strategy.execute(
			[
				makeInv({
					id: "A",
					total: 1000,
					emisionDate: "2026-01-15T10:00:00.000Z",
				}),
				makeInv({
					id: "B",
					total: 1000,
					emisionDate: "2026-01-15T11:00:00.000Z",
				}),
			],
			mockContext,
		);
		expect(anomalies).toHaveLength(1);
		expect(anomalies[0].severity).toBe("high");
		expect(anomalies[0].confidence).toBe(0.85);
		expect(anomalies[0].metric).toBe("suspicious_duplicate");
	});

	it("should detect suspicious duplicate within 7 days (medium)", () => {
		const anomalies = strategy.execute(
			[
				makeInv({
					id: "A",
					total: 1000,
					emisionDate: "2026-01-10T10:00:00.000Z",
				}),
				makeInv({
					id: "B",
					total: 1000,
					emisionDate: "2026-01-15T10:00:00.000Z",
				}),
			],
			mockContext,
		);
		expect(anomalies).toHaveLength(1);
		expect(anomalies[0].severity).toBe("medium");
		expect(anomalies[0].confidence).toBe(0.65);
	});

	it("should not flag different amounts", () => {
		const anomalies = strategy.execute(
			[
				makeInv({
					id: "A",
					total: 1000,
					emisionDate: "2026-01-15T10:00:00.000Z",
				}),
				makeInv({
					id: "B",
					total: 2000,
					emisionDate: "2026-01-15T11:00:00.000Z",
				}),
			],
			mockContext,
		);
		expect(anomalies).toHaveLength(0);
	});

	it("should not flag same amount but different emisor", () => {
		const anomalies = strategy.execute(
			[
				makeInv({ id: "A", total: 1000, emisorRuc: "20111111111" }),
				makeInv({ id: "B", total: 1000, emisorRuc: "20222222222" }),
			],
			mockContext,
		);
		expect(anomalies).toHaveLength(0);
	});

	it("should not flag invoices outside 7-day window", () => {
		const anomalies = strategy.execute(
			[
				makeInv({
					id: "A",
					total: 1000,
					emisionDate: "2026-01-01T10:00:00.000Z",
				}),
				makeInv({
					id: "B",
					total: 1000,
					emisionDate: "2026-01-15T10:00:00.000Z",
				}),
			],
			mockContext,
		);
		expect(anomalies).toHaveLength(0);
	});

	it("should handle empty array", () => {
		const anomalies = strategy.execute([], mockContext);
		expect(anomalies).toEqual([]);
	});

	it("should handle single invoice (no pair)", () => {
		const anomalies = strategy.execute([makeInv()], mockContext);
		expect(anomalies).toEqual([]);
	});

	it("should handle non-array input", () => {
		const anomalies = strategy.execute(null, mockContext);
		expect(anomalies).toEqual([]);
	});

	it("should detect definitive + suspicious separately", () => {
		const results = strategy.execute(
			[
				makeInv({ id: "A", serie: "F001", numero: "1", total: 500 }),
				makeInv({ id: "B", serie: "F001", numero: "1", total: 500 }), // definitive dup of A
				makeInv({ id: "C", serie: "F002", numero: "1", total: 1000 }),
				makeInv({
					id: "D",
					serie: "F002",
					numero: "2",
					total: 1000,
					emisionDate: "2026-01-15T12:00:00.000Z",
				}), // suspicious of C
			],
			mockContext,
		);
		expect(results).toHaveLength(2);
		const metrics = results.map((r) => r.metric);
		expect(metrics).toContain("definitive_duplicate");
		expect(metrics).toContain("suspicious_duplicate");
	});

	it("should include detection method in suspicious anomalies", () => {
		const anomalies = strategy.execute(
			[
				makeInv({
					id: "A",
					total: 1000,
					emisionDate: "2026-01-15T10:00:00.000Z",
				}),
				makeInv({
					id: "B",
					total: 1000,
					emisionDate: "2026-01-15T10:30:00.000Z",
				}),
			],
			mockContext,
		);
		expect(anomalies[0].detectionMethod).toBe(
			"suspicious_duplicate_rapid_reemission",
		);
	});

	it("should tolerate 1 PEN difference in amount", () => {
		const anomalies = strategy.execute(
			[
				makeInv({
					id: "A",
					total: 1000,
					emisionDate: "2026-01-15T10:00:00.000Z",
				}),
				makeInv({
					id: "B",
					total: 1001,
					emisionDate: "2026-01-15T11:00:00.000Z",
				}),
			],
			mockContext,
		);
		// diff of 1 is within tolerance
		expect(anomalies).toHaveLength(1);
	});
});
