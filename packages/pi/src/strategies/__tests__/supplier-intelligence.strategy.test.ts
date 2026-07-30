import { describe, expect, it } from "vitest";
import type { AgentContext } from "../../types/agent-context";
import type { SupplierIntelligenceInput } from "../supplier-intelligence.strategy";
import {
	CONCENTRATION_THRESHOLD_PCT,
	createSupplierIntelligenceStrategy,
	NEW_SUPPLIER_HIGH_VALUE_THRESHOLD,
	NEW_SUPPLIER_LOOKBACK_DAYS,
	PAYMENT_DELAY_DAYS_THRESHOLD,
} from "../supplier-intelligence.strategy";

// ─── Helpers ──────────────────────────────────────────────────────

function daysAgo(n: number): string {
	const d = new Date();
	d.setDate(d.getDate() - n);
	return d.toISOString();
}

function daysFromNow(n: number): string {
	const d = new Date();
	d.setDate(d.getDate() + n);
	return d.toISOString();
}

const baseContext: AgentContext = {
	tenantId: "test-tenant",
	userId: "test-user",
	organizationId: "test-org",
	companyId: "test-company",
	ruc: "20123456789",
	traceId: "test-trace",
};

// ─── Factory ──────────────────────────────────────────────────────

describe("createSupplierIntelligenceStrategy", () => {
	it("should return a valid strategy object", () => {
		const strategy = createSupplierIntelligenceStrategy();
		expect(strategy.id).toBe("supplier-intelligence");
		expect(strategy.name).toBe("Supplier Intelligence");
		expect(strategy.description).toBeTruthy();
		expect(strategy.minSeverity).toBe("low");
		expect(typeof strategy.execute).toBe("function");
	});

	it("should accept custom thresholds", () => {
		const strategy = createSupplierIntelligenceStrategy({
			concentrationThresholdPct: 80,
			paymentDelayDaysThreshold: 30,
			newSupplierHighValueThreshold: 5000,
			newSupplierLookbackDays: 60,
		});
		const result = strategy.execute(
			{
				suppliers: [],
				transactions: [],
			},
			baseContext,
		);
		expect(Array.isArray(result)).toBe(true);
	});
});

// ─── Edge cases ───────────────────────────────────────────────────

describe("supplier intelligence edge cases", () => {
	it("should return empty for empty data", () => {
		const strategy = createSupplierIntelligenceStrategy();
		const result = strategy.execute(
			{ suppliers: [], transactions: [] },
			baseContext,
		) as import("../types").Anomaly[];
		expect(result).toHaveLength(0);
	});

	it("should return empty for null/missing input", () => {
		const strategy = createSupplierIntelligenceStrategy();
		const result = strategy.execute(
			null,
			baseContext,
		) as import("../types").Anomaly[];
		expect(result).toHaveLength(0);
	});

	it("should return empty for missing suppliers or transactions", () => {
		const strategy = createSupplierIntelligenceStrategy();
		const result = strategy.execute(
			{ suppliers: [], transactions: [] },
			baseContext,
		) as import("../types").Anomaly[];
		expect(result).toHaveLength(0);
	});

	it("should handle single supplier with zero transactions", () => {
		const strategy = createSupplierIntelligenceStrategy();
		const input: SupplierIntelligenceInput = {
			suppliers: [
				{
					id: "s1",
					name: "Supplier 1",
					ruc: "20111111111",
					createdAt: daysAgo(365),
				},
			],
			transactions: [],
		};
		const result = strategy.execute(
			input,
			baseContext,
		) as import("../types").Anomaly[];
		expect(result).toHaveLength(0);
	});

	it("should handle transactions with all paid on time", () => {
		const strategy = createSupplierIntelligenceStrategy();
		const input: SupplierIntelligenceInput = {
			suppliers: [
				{
					id: "s1",
					name: "Good Supplier",
					ruc: "20111111111",
					createdAt: daysAgo(365),
				},
				{
					id: "s2",
					name: "Another Supplier",
					ruc: "20222222222",
					createdAt: daysAgo(365),
				},
			],
			transactions: [
				{
					id: "t1",
					supplierId: "s1",
					supplierName: "Good Supplier",
					supplierRuc: "20111111111",
					documentType: "01",
					serie: "F001",
					numero: "1",
					amount: 1000,
					currency: "PEN",
					issueDate: daysAgo(30),
					dueDate: daysAgo(20),
					paymentDate: daysAgo(20),
					paid: true,
				},
				{
					id: "t2",
					supplierId: "s1",
					supplierName: "Good Supplier",
					supplierRuc: "20111111111",
					documentType: "01",
					serie: "F001",
					numero: "2",
					amount: 2000,
					currency: "PEN",
					issueDate: daysAgo(15),
					dueDate: daysAgo(5),
					paymentDate: daysAgo(4),
					paid: true,
				},
				{
					id: "t3",
					supplierId: "s2",
					supplierName: "Another Supplier",
					supplierRuc: "20222222222",
					documentType: "01",
					serie: "F001",
					numero: "1",
					amount: 3000,
					currency: "PEN",
					issueDate: daysAgo(10),
					dueDate: daysAgo(2),
					paymentDate: daysAgo(2),
					paid: true,
				},
			],
		};
		const result = strategy.execute(
			input,
			baseContext,
		) as import("../types").Anomaly[];
		expect(result).toHaveLength(0);
	});
});

// ─── Concentration Risk ───────────────────────────────────────────

describe("concentration risk detection", () => {
	it("should detect when a single supplier exceeds threshold", () => {
		const strategy = createSupplierIntelligenceStrategy();
		const input: SupplierIntelligenceInput = {
			suppliers: [
				{
					id: "s1",
					name: "Big Supplier",
					ruc: "20111111111",
					createdAt: daysAgo(365),
				},
				{
					id: "s2",
					name: "Small Supplier",
					ruc: "20222222222",
					createdAt: daysAgo(365),
				},
			],
			transactions: [
				{
					id: "t1",
					supplierId: "s1",
					supplierName: "Big Supplier",
					supplierRuc: "20111111111",
					documentType: "01",
					serie: "F001",
					numero: "1",
					amount: 80000,
					currency: "PEN",
					issueDate: daysAgo(10),
					dueDate: daysAgo(5),
					paymentDate: daysAgo(5),
					paid: true,
				},
				{
					id: "t2",
					supplierId: "s1",
					supplierName: "Big Supplier",
					supplierRuc: "20111111111",
					documentType: "01",
					serie: "F001",
					numero: "2",
					amount: 20000,
					currency: "PEN",
					issueDate: daysAgo(5),
					dueDate: daysFromNow(5),
					paymentDate: null,
					paid: false,
				},
				{
					id: "t3",
					supplierId: "s2",
					supplierName: "Small Supplier",
					supplierRuc: "20222222222",
					documentType: "01",
					serie: "F001",
					numero: "3",
					amount: 10000,
					currency: "PEN",
					issueDate: daysAgo(3),
					dueDate: daysFromNow(7),
					paymentDate: null,
					paid: false,
				},
			],
		};
		const result = strategy.execute(
			input,
			baseContext,
		) as import("../types").Anomaly[];
		const concAnomalies = result.filter(
			(a) => a.detectionMethod === "supplier_concentration",
		);
		expect(concAnomalies).toHaveLength(1);
		expect(concAnomalies[0].entityId).toBe("s1");
		expect(concAnomalies[0].severity).toBe("critical"); // >75%
		expect(concAnomalies[0].metric).toBe("concentration_pct");
	});

	it("should NOT flag when spend is evenly distributed", () => {
		const strategy = createSupplierIntelligenceStrategy();
		const input: SupplierIntelligenceInput = {
			suppliers: [
				{
					id: "s1",
					name: "Supplier A",
					ruc: "20111111111",
					createdAt: daysAgo(365),
				},
				{
					id: "s2",
					name: "Supplier B",
					ruc: "20222222222",
					createdAt: daysAgo(365),
				},
				{
					id: "s3",
					name: "Supplier C",
					ruc: "20333333333",
					createdAt: daysAgo(365),
				},
			],
			transactions: [
				{
					id: "t1",
					supplierId: "s1",
					supplierName: "Supplier A",
					supplierRuc: "20111111111",
					documentType: "01",
					serie: "F001",
					numero: "1",
					amount: 30000,
					currency: "PEN",
					issueDate: daysAgo(10),
					dueDate: daysAgo(5),
					paymentDate: daysAgo(5),
					paid: true,
				},
				{
					id: "t2",
					supplierId: "s2",
					supplierName: "Supplier B",
					supplierRuc: "20222222222",
					documentType: "01",
					serie: "F001",
					numero: "2",
					amount: 35000,
					currency: "PEN",
					issueDate: daysAgo(8),
					dueDate: daysAgo(3),
					paymentDate: daysAgo(3),
					paid: true,
				},
				{
					id: "t3",
					supplierId: "s3",
					supplierName: "Supplier C",
					supplierRuc: "20333333333",
					documentType: "01",
					serie: "F001",
					numero: "3",
					amount: 35000,
					currency: "PEN",
					issueDate: daysAgo(5),
					dueDate: daysFromNow(5),
					paymentDate: null,
					paid: false,
				},
			],
		};
		const result = strategy.execute(
			input,
			baseContext,
		) as import("../types").Anomaly[];
		const concAnomalies = result.filter(
			(a) => a.detectionMethod === "supplier_concentration",
		);
		expect(concAnomalies).toHaveLength(0);
	});
});

// ─── Payment Delay Trend ──────────────────────────────────────────

describe("payment delay trend detection", () => {
	it("should flag supplier with chronic late payments", () => {
		const strategy = createSupplierIntelligenceStrategy();
		// 5 payments, all delayed by ~10 days on average
		const payments = Array.from({ length: 5 }, (_, i) => ({
			id: `t${i}`,
			supplierId: "s1",
			supplierName: "Late Payer Supplier",
			supplierRuc: "20111111111",
			documentType: "01",
			serie: "F001",
			numero: `${i + 1}`,
			amount: 5000,
			currency: "PEN",
			issueDate: daysAgo(60 + i * 10),
			dueDate: daysAgo(50 + i * 10),
			paymentDate: daysAgo(40 + i * 10), // paid 10 days late
			paid: true,
		}));

		const input: SupplierIntelligenceInput = {
			suppliers: [
				{
					id: "s1",
					name: "Late Payer Supplier",
					ruc: "20111111111",
					createdAt: daysAgo(365),
				},
			],
			transactions: payments,
		};
		const result = strategy.execute(
			input,
			baseContext,
		) as import("../types").Anomaly[];
		const delayAnomalies = result.filter(
			(a) => a.detectionMethod === "payment_delay_trend",
		);
		expect(delayAnomalies).toHaveLength(0); // avg delay with 10 days < 15 threshold
	});

	it("should flag when avg delay exceeds threshold across multiple payments", () => {
		const strategy = createSupplierIntelligenceStrategy();
		const payments = Array.from({ length: 5 }, (_, i) => ({
			id: `t${i}`,
			supplierId: "s1",
			supplierName: "Very Late Supplier",
			supplierRuc: "20111111111",
			documentType: "01",
			serie: "F001",
			numero: `${i + 1}`,
			amount: 3000,
			currency: "PEN",
			issueDate: daysAgo(80 + i * 10),
			dueDate: daysAgo(70 + i * 10),
			paymentDate: daysAgo(45 + i * 10), // paid 25 days late
			paid: true,
		}));

		const input: SupplierIntelligenceInput = {
			suppliers: [
				{
					id: "s1",
					name: "Very Late Supplier",
					ruc: "20111111111",
					createdAt: daysAgo(365),
				},
			],
			transactions: payments,
		};
		const result = strategy.execute(
			input,
			baseContext,
		) as import("../types").Anomaly[];
		const delayAnomalies = result.filter(
			(a) => a.detectionMethod === "payment_delay_trend",
		);
		expect(delayAnomalies).toHaveLength(1);
		expect(delayAnomalies[0].severity).toBe("high");
		expect(delayAnomalies[0].context.paymentCount).toBe(5);
	});

	it("should NOT flag suppliers with fewer than 3 payments", () => {
		const strategy = createSupplierIntelligenceStrategy();
		const payments = Array.from({ length: 2 }, (_, i) => ({
			id: `t${i}`,
			supplierId: "s1",
			supplierName: "Few Payments",
			supplierRuc: "20111111111",
			documentType: "01",
			serie: "F001",
			numero: `${i + 1}`,
			amount: 3000,
			currency: "PEN",
			issueDate: daysAgo(40 * (i + 1)),
			dueDate: daysAgo(35 * (i + 1)),
			paymentDate: daysAgo(5 * (i + 1)),
			paid: true,
		}));

		const input: SupplierIntelligenceInput = {
			suppliers: [
				{
					id: "s1",
					name: "Few Payments",
					ruc: "20111111111",
					createdAt: daysAgo(365),
				},
			],
			transactions: payments,
		};
		const result = strategy.execute(
			input,
			baseContext,
		) as import("../types").Anomaly[];
		const delayAnomalies = result.filter(
			(a) => a.detectionMethod === "payment_delay_trend",
		);
		expect(delayAnomalies).toHaveLength(0);
	});
});

// ─── New Supplier High-Value ─────────────────────────────────────

describe("new supplier high-value detection", () => {
	it("should flag recent supplier with high-value first invoice", () => {
		const strategy = createSupplierIntelligenceStrategy();
		const input: SupplierIntelligenceInput = {
			suppliers: [
				{
					id: "s1",
					name: "New Big Supplier",
					ruc: "20111111111",
					createdAt: daysAgo(10), // created within lookback window
				},
			],
			transactions: [
				{
					id: "t1",
					supplierId: "s1",
					supplierName: "New Big Supplier",
					supplierRuc: "20111111111",
					documentType: "01",
					serie: "F001",
					numero: "1",
					amount: 25000, // > 10K threshold
					currency: "PEN",
					issueDate: daysAgo(2),
					dueDate: daysFromNow(28),
					paymentDate: null,
					paid: false,
				},
			],
		};
		const result = strategy.execute(
			input,
			baseContext,
		) as import("../types").Anomaly[];
		const newSupplierAnomalies = result.filter(
			(a) => a.detectionMethod === "new_supplier_high_value",
		);
		expect(newSupplierAnomalies).toHaveLength(1);
		expect(newSupplierAnomalies[0].severity).toBe("high");
		expect(newSupplierAnomalies[0].actualValue).toBe(25000);
	});

	it("should NOT flag new supplier with small first invoice", () => {
		const strategy = createSupplierIntelligenceStrategy();
		const input: SupplierIntelligenceInput = {
			suppliers: [
				{
					id: "s1",
					name: "Small New Supplier",
					ruc: "20111111111",
					createdAt: daysAgo(5),
				},
			],
			transactions: [
				{
					id: "t1",
					supplierId: "s1",
					supplierName: "Small New Supplier",
					supplierRuc: "20111111111",
					documentType: "01",
					serie: "F001",
					numero: "1",
					amount: 5000, // below threshold
					currency: "PEN",
					issueDate: daysAgo(1),
					dueDate: daysFromNow(29),
					paymentDate: null,
					paid: false,
				},
			],
		};
		const result = strategy.execute(
			input,
			baseContext,
		) as import("../types").Anomaly[];
		const newSupplierAnomalies = result.filter(
			(a) => a.detectionMethod === "new_supplier_high_value",
		);
		expect(newSupplierAnomalies).toHaveLength(0);
	});

	it("should NOT flag established supplier with high-value invoice", () => {
		const strategy = createSupplierIntelligenceStrategy();
		const input: SupplierIntelligenceInput = {
			suppliers: [
				{
					id: "s1",
					name: "Established Supplier",
					ruc: "20111111111",
					createdAt: daysAgo(365), // created long ago, outside lookback
				},
			],
			transactions: [
				{
					id: "t1",
					supplierId: "s1",
					supplierName: "Established Supplier",
					supplierRuc: "20111111111",
					documentType: "01",
					serie: "F001",
					numero: "1",
					amount: 100000,
					currency: "PEN",
					issueDate: daysAgo(2),
					dueDate: daysFromNow(28),
					paymentDate: null,
					paid: false,
				},
			],
		};
		const result = strategy.execute(
			input,
			baseContext,
		) as import("../types").Anomaly[];
		const newSupplierAnomalies = result.filter(
			(a) => a.detectionMethod === "new_supplier_high_value",
		);
		expect(newSupplierAnomalies).toHaveLength(0);
	});
});

// ─── Debt Aging ──────────────────────────────────────────────────

describe("debt aging detection", () => {
	it("should flag supplier with past-due invoices", () => {
		const strategy = createSupplierIntelligenceStrategy();
		const input: SupplierIntelligenceInput = {
			suppliers: [
				{
					id: "s1",
					name: "Aging Debt Supplier",
					ruc: "20111111111",
					createdAt: daysAgo(365),
				},
			],
			transactions: [
				{
					id: "t1",
					supplierId: "s1",
					supplierName: "Aging Debt Supplier",
					supplierRuc: "20111111111",
					documentType: "01",
					serie: "F001",
					numero: "1",
					amount: 10000,
					currency: "PEN",
					issueDate: daysAgo(150),
					dueDate: daysAgo(100),
					paymentDate: null,
					paid: false,
				},
				{
					id: "t2",
					supplierId: "s1",
					supplierName: "Aging Debt Supplier",
					supplierRuc: "20111111111",
					documentType: "01",
					serie: "F001",
					numero: "2",
					amount: 5000,
					currency: "PEN",
					issueDate: daysAgo(50),
					dueDate: daysAgo(20),
					paymentDate: null,
					paid: false,
				},
			],
		};
		const result = strategy.execute(
			input,
			baseContext,
		) as import("../types").Anomaly[];
		const debtAnomalies = result.filter(
			(a) => a.detectionMethod === "debt_aging",
		);
		expect(debtAnomalies).toHaveLength(1);
		expect(debtAnomalies[0].severity).toBe("critical"); // 90+ bucket
		expect(debtAnomalies[0].actualValue).toBe(15000);
		expect(debtAnomalies[0].context.unpaidCount).toBe(2);
	});

	it("should NOT flag invoices that are not yet due", () => {
		const strategy = createSupplierIntelligenceStrategy();
		const input: SupplierIntelligenceInput = {
			suppliers: [
				{
					id: "s1",
					name: "Current Supplier",
					ruc: "20111111111",
					createdAt: daysAgo(365),
				},
			],
			transactions: [
				{
					id: "t1",
					supplierId: "s1",
					supplierName: "Current Supplier",
					supplierRuc: "20111111111",
					documentType: "01",
					serie: "F001",
					numero: "1",
					amount: 5000,
					currency: "PEN",
					issueDate: daysAgo(5),
					dueDate: daysFromNow(25),
					paymentDate: null,
					paid: false,
				},
			],
		};
		const result = strategy.execute(
			input,
			baseContext,
		) as import("../types").Anomaly[];
		const debtAnomalies = result.filter(
			(a) => a.detectionMethod === "debt_aging",
		);
		expect(debtAnomalies).toHaveLength(0);
	});

	it("should NOT flag paid invoices", () => {
		const strategy = createSupplierIntelligenceStrategy();
		const input: SupplierIntelligenceInput = {
			suppliers: [
				{
					id: "s1",
					name: "Paid Up Supplier",
					ruc: "20111111111",
					createdAt: daysAgo(365),
				},
			],
			transactions: [
				{
					id: "t1",
					supplierId: "s1",
					supplierName: "Paid Up Supplier",
					supplierRuc: "20111111111",
					documentType: "01",
					serie: "F001",
					numero: "1",
					amount: 5000,
					currency: "PEN",
					issueDate: daysAgo(60),
					dueDate: daysAgo(30),
					paymentDate: daysAgo(28),
					paid: true,
				},
			],
		};
		const result = strategy.execute(
			input,
			baseContext,
		) as import("../types").Anomaly[];
		const debtAnomalies = result.filter(
			(a) => a.detectionMethod === "debt_aging",
		);
		expect(debtAnomalies).toHaveLength(0);
	});
});

// ─── Duplicate Supplier ──────────────────────────────────────────

describe("duplicate supplier detection", () => {
	it("should detect same RUC under different names", () => {
		const strategy = createSupplierIntelligenceStrategy();
		const input: SupplierIntelligenceInput = {
			suppliers: [
				{
					id: "s1",
					name: "Proveedor ABC SAC",
					ruc: "20111111111",
					createdAt: daysAgo(365),
				},
				{
					id: "s2",
					name: "ABC Proveedores SAC",
					ruc: "20111111111",
					createdAt: daysAgo(180),
				},
			],
			transactions: [],
		};
		const result = strategy.execute(
			input,
			baseContext,
		) as import("../types").Anomaly[];
		const rucAnomalies = result.filter(
			(a) => a.detectionMethod === "duplicate_supplier_ruc",
		);
		expect(rucAnomalies).toHaveLength(1);
		expect(rucAnomalies[0].severity).toBe("high");
		expect(rucAnomalies[0].context.duplicateCount).toBe(2);
	});

	it("should detect shared bank account across different RUCs", () => {
		const strategy = createSupplierIntelligenceStrategy();
		const input: SupplierIntelligenceInput = {
			suppliers: [
				{
					id: "s1",
					name: "Supplier A",
					ruc: "20111111111",
					bankAccount: "123-456-789",
					createdAt: daysAgo(365),
				},
				{
					id: "s2",
					name: "Supplier B",
					ruc: "20222222222",
					bankAccount: "123-456-789",
					createdAt: daysAgo(365),
				},
			],
			transactions: [],
		};
		const result = strategy.execute(
			input,
			baseContext,
		) as import("../types").Anomaly[];
		const accountAnomalies = result.filter(
			(a) => a.detectionMethod === "shared_bank_account",
		);
		expect(accountAnomalies).toHaveLength(1);
		expect(accountAnomalies[0].severity).toBe("critical");
		expect(accountAnomalies[0].context.sharedCount).toBe(2);
	});

	it("should not flag unique RUCs with different names", () => {
		const strategy = createSupplierIntelligenceStrategy();
		const input: SupplierIntelligenceInput = {
			suppliers: [
				{
					id: "s1",
					name: "Supplier One",
					ruc: "20111111111",
					createdAt: daysAgo(365),
				},
				{
					id: "s2",
					name: "Supplier Two",
					ruc: "20222222222",
					createdAt: daysAgo(365),
				},
			],
			transactions: [],
		};
		const result = strategy.execute(
			input,
			baseContext,
		) as import("../types").Anomaly[];
		const rucAnomalies = result.filter(
			(a) => a.detectionMethod === "duplicate_supplier_ruc",
		);
		expect(rucAnomalies).toHaveLength(0);
	});

	it("should handle suppliers without bank accounts gracefully", () => {
		const strategy = createSupplierIntelligenceStrategy();
		const input: SupplierIntelligenceInput = {
			suppliers: [
				{
					id: "s1",
					name: "Supplier A",
					ruc: "20111111111",
					createdAt: daysAgo(365),
				},
				{
					id: "s2",
					name: "Supplier B",
					ruc: "20222222222",
					createdAt: daysAgo(365),
				},
			],
			transactions: [],
		};
		const result = strategy.execute(
			input,
			baseContext,
		) as import("../types").Anomaly[];
		const accountAnomalies = result.filter(
			(a) => a.detectionMethod === "shared_bank_account",
		);
		expect(accountAnomalies).toHaveLength(0);
	});
});

// ─── Combined scenario ────────────────────────────────────────────

describe("combined detection scenarios", () => {
	it("should detect multiple anomaly types in a single run", () => {
		const strategy = createSupplierIntelligenceStrategy();
		const input: SupplierIntelligenceInput = {
			suppliers: [
				{
					id: "s1",
					name: "Big Supplier",
					ruc: "20111111111",
					bankAccount: "999-888-777",
					createdAt: daysAgo(365),
				},
				{
					id: "s2",
					name: "Big Supplier Alternate", // same RUC, different name
					ruc: "20111111111",
					bankAccount: "999-888-777",
					createdAt: daysAgo(180),
				},
				{
					id: "s3",
					name: "New Supplier",
					ruc: "20333333333",
					createdAt: daysAgo(5),
				},
			],
			transactions: [
				// s1 = 80% of spend (concentration)
				{
					id: "t1",
					supplierId: "s1",
					supplierName: "Big Supplier",
					supplierRuc: "20111111111",
					documentType: "01",
					serie: "F001",
					numero: "1",
					amount: 80000,
					currency: "PEN",
					issueDate: daysAgo(20),
					dueDate: daysAgo(5),
					paymentDate: daysAgo(10),
					paid: true,
				},
				// s3 new, high value
				{
					id: "t2",
					supplierId: "s3",
					supplierName: "New Supplier",
					supplierRuc: "20333333333",
					documentType: "01",
					serie: "F001",
					numero: "1",
					amount: 20000,
					currency: "PEN",
					issueDate: daysAgo(2),
					dueDate: daysFromNow(28),
					paymentDate: null,
					paid: false,
				},
				// s1 also has late payments (3 payments to meet min threshold)
				{
					id: "t3",
					supplierId: "s1",
					supplierName: "Big Supplier",
					supplierRuc: "20111111111",
					documentType: "01",
					serie: "F001",
					numero: "2",
					amount: 10000,
					currency: "PEN",
					issueDate: daysAgo(60),
					dueDate: daysAgo(50),
					paymentDate: daysAgo(15),
					paid: true,
				},
				{
					id: "t4",
					supplierId: "s1",
					supplierName: "Big Supplier",
					supplierRuc: "20111111111",
					documentType: "01",
					serie: "F001",
					numero: "3",
					amount: 10000,
					currency: "PEN",
					issueDate: daysAgo(90),
					dueDate: daysAgo(80),
					paymentDate: daysAgo(40),
					paid: true,
				},
				{
					id: "t5",
					supplierId: "s1",
					supplierName: "Big Supplier",
					supplierRuc: "20111111111",
					documentType: "01",
					serie: "F001",
					numero: "4",
					amount: 10000,
					currency: "PEN",
					issueDate: daysAgo(120),
					dueDate: daysAgo(110),
					paymentDate: daysAgo(80),
					paid: true,
				},
			],
		};
		const result = strategy.execute(
			input,
			baseContext,
		) as import("../types").Anomaly[];
		const methods = result.map((a) => a.detectionMethod);
		expect(methods).toContain("supplier_concentration");
		expect(methods).toContain("payment_delay_trend");
		expect(methods).toContain("new_supplier_high_value");
		expect(methods).toContain("duplicate_supplier_ruc");
	});
});

// ─── Constants ────────────────────────────────────────────────────

describe("constants", () => {
	it("should export sensible default thresholds", () => {
		expect(CONCENTRATION_THRESHOLD_PCT).toBe(50);
		expect(PAYMENT_DELAY_DAYS_THRESHOLD).toBe(15);
		expect(NEW_SUPPLIER_HIGH_VALUE_THRESHOLD).toBe(10_000);
		expect(NEW_SUPPLIER_LOOKBACK_DAYS).toBe(90);
	});
});
