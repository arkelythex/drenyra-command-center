import { describe, expect, it } from "vitest";
import type { AgentContext } from "../../types/agent-context";
import type { SireFilingRecord } from "../sire-filing.strategy";
import {
	createSireFilingStrategy,
	SIRE_DEADLINE_DAYS,
} from "../sire-filing.strategy";

const mockContext: AgentContext = {
	tenantId: "test",
	userId: "test",
	organizationId: "test",
	companyId: "test",
	ruc: "20123456789",
	traceId: "test",
};

function today(): string {
	return new Date().toISOString().split("T")[0];
}

function daysAgo(n: number): string {
	const d = new Date();
	d.setDate(d.getDate() - n);
	return d.toISOString().split("T")[0];
}

function makeRecord(
	overrides: Partial<SireFilingRecord> = {},
): SireFilingRecord {
	return {
		id: "CPE-001",
		serie: "F001",
		numero: "1",
		tipoDocumento: "01",
		emisorRuc: "20123456789",
		emisionDate: daysAgo(10),
		filingDate: null,
		total: 1500,
		cdrReceived: false,
		...overrides,
	};
}

describe("createSireFilingStrategy", () => {
	const strategy = createSireFilingStrategy();

	it("should return correct metadata", () => {
		expect(strategy.id).toBe("sire-filing");
		expect(strategy.name).toContain("SIRE");
		expect(strategy.minSeverity).toBe("low");
	});

	it("should return empty for non-array input", () => {
		expect(strategy.execute(null, mockContext)).toEqual([]);
		expect(strategy.execute("bad", mockContext)).toEqual([]);
		expect(strategy.execute(123, mockContext)).toEqual([]);
	});

	it("should return empty for empty array", () => {
		expect(strategy.execute([], mockContext)).toEqual([]);
	});

	it("should not flag records within the 7-day filing window", () => {
		const record = makeRecord({ emisionDate: daysAgo(3) });
		const anomalies = strategy.execute([record], mockContext);
		expect(anomalies).toHaveLength(0);
	});

	it("should not flag filed records with CDR received", () => {
		const record = makeRecord({
			emisionDate: daysAgo(20),
			filingDate: daysAgo(19),
			cdrReceived: true,
			cdrDate: daysAgo(19),
		});
		const anomalies = strategy.execute([record], mockContext);
		expect(anomalies).toHaveLength(0);
	});

	it("should flag unfiled records past the 7-day window as medium", () => {
		// 10 days = past 7-day window but < 30
		const anomalies = strategy.execute([makeRecord()], mockContext);
		expect(anomalies).toHaveLength(1);
		expect(anomalies[0]?.severity).toBe("medium");
		expect(anomalies[0]?.metric).toBe("sire_filing_overdue");
		expect(anomalies[0]?.entityType).toBe("cpe");
	});

	it("should flag overdue > 7 days as high", () => {
		const record = makeRecord({ emisionDate: daysAgo(20) });
		const anomalies = strategy.execute([record], mockContext);
		expect(anomalies).toHaveLength(1);
		expect(anomalies[0]?.severity).toBe("high");
	});

	it("should flag overdue > 30 days as critical", () => {
		const record = makeRecord({ emisionDate: daysAgo(45) });
		const anomalies = strategy.execute([record], mockContext);
		expect(anomalies).toHaveLength(1);
		expect(anomalies[0]?.severity).toBe("critical");
	});

	it("should flag filed-but-no-CDR as cdr_pending", () => {
		const record = makeRecord({
			emisionDate: daysAgo(15),
			filingDate: daysAgo(14),
			cdrReceived: false,
		});
		const anomalies = strategy.execute([record], mockContext);
		expect(anomalies).toHaveLength(1);
		expect(anomalies[0]?.context?.overdueType).toBe("cdr_pending");
		expect(anomalies[0]?.confidence).toBeLessThan(0.95);
	});

	it("should skip records with invalid emisionDate", () => {
		const record = makeRecord({ emisionDate: "invalid-date" });
		const anomalies = strategy.execute([record], mockContext);
		expect(anomalies).toHaveLength(0);
	});

	it("should handle multiple records with mixed states", () => {
		const records: SireFilingRecord[] = [
			makeRecord({ id: "CPE-001", emisionDate: daysAgo(3) }), // ok — within window
			makeRecord({ id: "CPE-002", emisionDate: daysAgo(15) }), // overdue
			makeRecord({
				id: "CPE-003",
				emisionDate: daysAgo(60),
				filingDate: daysAgo(59),
				cdrReceived: true,
			}), // ok — filed with CDR
		];
		const anomalies = strategy.execute(records, mockContext);
		expect(anomalies).toHaveLength(1);
		expect(anomalies[0]?.entityId).toBe("CPE-002");
	});

	it("should set not_filed type for records never submitted", () => {
		const anomalies = strategy.execute([makeRecord()], mockContext);
		expect(anomalies[0]?.context?.overdueType).toBe("not_filed");
		expect(anomalies[0]?.detectionMethod).toBe("sire_filing_deadline");
	});

	it("should include legal reference in context", () => {
		const anomalies = strategy.execute([makeRecord()], mockContext);
		const ctx = anomalies[0]?.context as Record<string, unknown>;
		expect(ctx?.legalReference).toContain("R.S. 000155-2021/SUNAT");
	});

	it("should include total amount in reasoning", () => {
		const record = makeRecord({ total: 5500 });
		const anomalies = strategy.execute([record], mockContext);
		expect(anomalies[0]?.reasoning).toContain("5500.00");
	});

	it("should use custom deadlineDays when provided", () => {
		const custom = createSireFilingStrategy({ deadlineDays: 3 });
		// 5 days > 3 day custom deadline
		const record = makeRecord({ emisionDate: daysAgo(5) });
		const anomalies = custom.execute([record], mockContext);
		expect(anomalies).toHaveLength(1);
	});

	it("should use custom criticalOverdueDays when provided", () => {
		const custom = createSireFilingStrategy({
			deadlineDays: 7,
			criticalOverdueDays: 10,
		});
		// 20 days overdue > 10 custom threshold
		const record = makeRecord({ emisionDate: daysAgo(27) });
		const anomalies = custom.execute([record], mockContext);
		expect(anomalies[0]?.severity).toBe("critical");
	});

	it("should export SIRE_DEADLINE_DAYS constant", () => {
		expect(SIRE_DEADLINE_DAYS).toBe(7);
	});
});
