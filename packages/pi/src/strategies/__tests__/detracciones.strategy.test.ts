import { describe, expect, it } from "vitest";
import type { AgentContext } from "../../types/agent-context";
import type { DetraccionInvoice } from "../detracciones.strategy";
import {
	createDetraccionesStrategy,
	SPOT_MIN_AMOUNT,
	SPOT_MIN_CASH_AMOUNT,
	SPOT_RATES,
} from "../detracciones.strategy";

const mockContext: AgentContext = {
	tenantId: "test",
	userId: "test",
	organizationId: "test",
	companyId: "test",
	ruc: "20123456789",
	traceId: "test",
};

function makeInv(
	overrides: Partial<DetraccionInvoice> = {},
): DetraccionInvoice {
	return {
		id: "INV-001",
		serie: "F001",
		numero: "1",
		tipoDocumento: "01",
		emisorRuc: "20123456789",
		receptorRuc: "20123456788",
		operationCode: "022",
		totalAmount: 10000,
		detraccionAmount: null,
		detraccionPercentage: null,
		detraccionDeposited: false,
		depositDate: null,
		paymentType: "CRED",
		emisionDate: "2026-03-15",
		...overrides,
	};
}

describe("createDetraccionesStrategy", () => {
	const strategy = createDetraccionesStrategy();

	it("should return correct metadata", () => {
		expect(strategy.id).toBe("detracciones");
		expect(strategy.name).toContain("SPOT");
		expect(strategy.minSeverity).toBe("low");
	});

	it("should return empty for non-array input", () => {
		expect(strategy.execute(null, mockContext)).toEqual([]);
		expect(strategy.execute({}, mockContext)).toEqual([]);
	});

	it("should return empty for empty array", () => {
		expect(strategy.execute([], mockContext)).toEqual([]);
	});

	it("should skip invoices below the SPOT threshold", () => {
		const inv = makeInv({
			operationCode: "022",
			totalAmount: 500, // below S/ 700
			paymentType: "CRED",
		});
		const anomalies = strategy.execute([inv], mockContext);
		expect(anomalies).toHaveLength(0);
	});

	it("should skip invoices with unknown operation code", () => {
		const inv = makeInv({
			operationCode: "999",
			totalAmount: 5000,
		});
		const anomalies = strategy.execute([inv], mockContext);
		expect(anomalies).toHaveLength(0);
	});

	it("should flag missing detraccion as high severity (under S/ 50K)", () => {
		const inv = makeInv({
			operationCode: "022",
			totalAmount: 10000,
			detraccionAmount: null,
		});
		const anomalies = strategy.execute([inv], mockContext);
		expect(anomalies).toHaveLength(1);
		expect(anomalies[0]?.metric).toBe("detraccion_missing");
		expect(anomalies[0]?.severity).toBe("high");
		expect(anomalies[0]?.confidence).toBe(0.95);
	});

	it("should flag missing detraccion over S/ 50K as critical", () => {
		const inv = makeInv({
			operationCode: "022",
			totalAmount: 75000,
			detraccionAmount: null,
		});
		const anomalies = strategy.execute([inv], mockContext);
		expect(anomalies).toHaveLength(1);
		expect(anomalies[0]?.severity).toBe("critical");
	});

	it("should flag wrong detraccion percentage as medium", () => {
		const inv = makeInv({
			operationCode: "022", // 15% rate
			totalAmount: 10000,
			detraccionAmount: 1000,
			detraccionPercentage: 10, // should be 15%
			detraccionDeposited: true,
		});
		const anomalies = strategy.execute([inv], mockContext);
		expect(anomalies).toHaveLength(1);
		expect(anomalies[0]?.metric).toBe("detraccion_wrong_percentage");
		expect(anomalies[0]?.severity).toBe("medium");
	});

	it("should NOT flag detraccion when percentage matches (within 1% tolerance)", () => {
		const rate = SPOT_RATES.get("022")!.rate; // 15
		const inv = makeInv({
			operationCode: "022",
			totalAmount: 10000,
			detraccionAmount: 1500,
			detraccionPercentage: rate, // 15 = correct
			detraccionDeposited: true,
			depositDate: "2026-03-18",
		});
		const anomalies = strategy.execute([inv], mockContext);
		expect(anomalies).toHaveLength(0);
	});

	it("should flag undeposited detraccion after deadline", () => {
		const inv = makeInv({
			operationCode: "022",
			totalAmount: 10000,
			detraccionAmount: 1500,
			detraccionPercentage: 15,
			detraccionDeposited: false,
			emisionDate: "2026-01-01", // more than 5 days ago
		});
		const anomalies = strategy.execute([inv], mockContext);
		const detAnomaly = anomalies.find(
			(a) => a.metric === "detraccion_not_deposited",
		);
		expect(detAnomaly).toBeDefined();
	});

	it("should handle cash payment type threshold", () => {
		const inv = makeInv({
			operationCode: "022",
			totalAmount: 750, // > 700
			paymentType: "CONT",
			detraccionAmount: null,
		});
		const anomalies = strategy.execute([inv], mockContext);
		expect(anomalies).toHaveLength(1); // SPOT applies
	});

	it("should handle mixed invoice batch", () => {
		const invoices: DetraccionInvoice[] = [
			// Below threshold — skip
			makeInv({ id: "INV-001", operationCode: "022", totalAmount: 300 }),
			// Missing — flag
			makeInv({
				id: "INV-002",
				operationCode: "022",
				totalAmount: 10000,
				detraccionAmount: null,
			}),
			// Compliant — skip
			makeInv({
				id: "INV-003",
				operationCode: "022",
				totalAmount: 8000,
				detraccionAmount: 1200,
				detraccionPercentage: 15,
				detraccionDeposited: true,
				depositDate: "2026-03-18",
			}),
		];
		const anomalies = strategy.execute(invoices, mockContext);
		expect(anomalies).toHaveLength(1);
		expect(anomalies[0]?.entityId).toBe("INV-002");
	});

	it("should include legal reference in context", () => {
		const inv = makeInv({
			operationCode: "022",
			totalAmount: 10000,
			detraccionAmount: null,
		});
		const anomalies = strategy.execute([inv], mockContext);
		const ctx = anomalies[0]?.context as Record<string, unknown>;
		expect(ctx?.legalReference).toContain("D.S. 155-2007-EF");
	});

	it("should include expected rate in missing detraccion context", () => {
		const inv = makeInv({
			operationCode: "022",
			totalAmount: 10000,
			detraccionAmount: null,
		});
		const anomalies = strategy.execute([inv], mockContext);
		expect(anomalies[0]?.context?.expectedRate).toBe(15);
	});

	it("should consider depositted detraccion within deadline as compliant", () => {
		const inv = makeInv({
			operationCode: "022",
			totalAmount: 10000,
			detraccionAmount: 1500,
			detraccionPercentage: 15,
			detraccionDeposited: true,
			depositDate: "2026-03-20", // within 5 days
			emisionDate: "2026-03-15",
		});
		const anomalies = strategy.execute([inv], mockContext);
		expect(anomalies).toHaveLength(0);
	});

	it("should export SPOT_RATES as Map", () => {
		expect(SPOT_RATES).toBeInstanceOf(Map);
		expect(SPOT_RATES.size).toBeGreaterThan(0);
	});

	it("should have correct rate for construction services (code 022)", () => {
		const entry = SPOT_RATES.get("022");
		expect(entry?.rate).toBe(15);
		expect(entry?.description).toContain("construcción");
	});
});
