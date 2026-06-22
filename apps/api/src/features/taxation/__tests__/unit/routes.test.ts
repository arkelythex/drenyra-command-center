import { Elysia } from "elysia";
import { afterEach, describe, expect, it, vi } from "vitest";
import { taxationModule } from "../../index";

vi.mock("../../../security/session-context", () => ({
	resolveSessionContext: vi.fn().mockResolvedValue({
		ok: true,
		context: {
			userId: "test-user",
			authUserId: "test-user",
			legacyUserId: null,
			role: "admin",
			companyId: "cmp-1",
		},
	}),
}));

vi.mock("../../application/queries/get-pending-retentions.query", () => ({
	getPendingRetentions: vi.fn(),
}));
vi.mock("../../application/queries/get-retention-summary.query", () => ({
	getRetentionSummary: vi.fn(),
}));
vi.mock("../../application/commands/apply-retention.command", () => {
	class RetentionApplyError extends Error {
		httpStatus: number;
		errorCode: string;
		constructor(m: string, httpStatus: number, errorCode: string) {
			super(m);
			this.name = "RetentionApplyError";
			this.httpStatus = httpStatus;
			this.errorCode = errorCode;
		}
	}
	return {
		applyRetention: vi.fn(),
		RetentionApplyError,
	};
});
vi.mock("../../application/commands/declare-retention.command", () => ({
	declareRetention: vi.fn(),
}));
vi.mock("../../application/commands/mark-retention-paid.command", () => ({
	markRetentionPaid: vi.fn(),
}));
vi.mock("../../application/commands/cancel-retention.command", () => ({
	cancelRetention: vi.fn(),
}));

import { applyRetention } from "../../application/commands/apply-retention.command";
import { cancelRetention } from "../../application/commands/cancel-retention.command";
import { declareRetention } from "../../application/commands/declare-retention.command";
import { markRetentionPaid } from "../../application/commands/mark-retention-paid.command";
import { getPendingRetentions } from "../../application/queries/get-pending-retentions.query";
import { getRetentionSummary } from "../../application/queries/get-retention-summary.query";

describe("taxation routes", () => {
	const app = new Elysia().use(taxationModule);

	afterEach(() => {
		vi.clearAllMocks();
	});

	it("returns pending retentions envelope", async () => {
		vi.mocked(getPendingRetentions).mockResolvedValueOnce({
			items: [
				{
					retentionId: "ret-1",
					billId: "bill-1",
					supplierRuc: "20100070970",
					baseAmount: 1000,
					retentionAmount: 30,
					netToSupplier: 970,
					declarationPeriod: "2026-03",
					sunatDueDate: "2026-04-15",
					daysUntilDue: 10,
					isOverdue: false,
					status: "PENDING",
				},
			],
			totalRetentionAmount: 30,
			count: 1,
			hasOverdue: false,
		});

		const response = await app.handle(
			new Request(
				"http://localhost/api/taxation/retenciones?companyId=cmp-1&declarationPeriod=2026-03",
			),
		);

		expect(response.status).toBe(200);
		expect(getPendingRetentions).toHaveBeenCalledWith({
			companyId: "cmp-1",
			declarationPeriod: "2026-03",
		});

		const payload = await response.json();
		expect(payload).toMatchObject({
			success: true,
			data: {
				count: 1,
				totalRetentionAmount: 30,
			},
		});
	});

	it("returns retention summary envelope for PDT 626", async () => {
		vi.mocked(getRetentionSummary).mockResolvedValueOnce({
			declarationPeriod: "2026-03",
			sunatDueDate: "2026-04-15",
			totalRetentionAmount: 90,
			retentionCount: 3,
			byStatus: {
				PENDING: 2,
				DECLARED: 1,
				PAID: 0,
				CANCELLED: 0,
			},
		});

		const response = await app.handle(
			new Request(
				"http://localhost/api/taxation/retenciones/summary?companyId=cmp-1&declarationPeriod=2026-03",
			),
		);

		expect(response.status).toBe(200);
		expect(getRetentionSummary).toHaveBeenCalledWith({
			companyId: "cmp-1",
			declarationPeriod: "2026-03",
		});
	});

	it("creates a retention and returns 201", async () => {
		vi.mocked(applyRetention).mockResolvedValueOnce({
			retentionId: "ret-1",
			retentionAmountCents: 3000,
			netToSupplierCents: 97000,
			declarationPeriod: "2026-03",
			sunatDueDate: "2026-04-15",
		});

		const response = await app.handle(
			new Request("http://localhost/api/taxation/retenciones", {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({
					companyId: "cmp-1",
					billId: "bill-1",
					supplierRuc: "20100070970",
					baseAmountCents: 100000,
				}),
			}),
		);

		expect(response.status).toBe(201);
		expect(applyRetention).toHaveBeenCalledWith({
			companyId: "cmp-1",
			billId: "bill-1",
			supplierRuc: "20100070970",
			baseAmountCents: 100000,
		});
	});

	it("maps declare, pay and cancel retention routes", async () => {
		vi.mocked(declareRetention).mockResolvedValue();
		vi.mocked(markRetentionPaid).mockResolvedValue();
		vi.mocked(cancelRetention).mockResolvedValue();

		const declareResponse = await app.handle(
			new Request("http://localhost/api/taxation/retenciones/ret-1/declare", {
				method: "PATCH",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({ pdtReference: "PDT626-2026-03-001" }),
			}),
		);
		const payResponse = await app.handle(
			new Request("http://localhost/api/taxation/retenciones/ret-1/pay", {
				method: "PATCH",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({ bankTransactionId: "tx-123" }),
			}),
		);
		const cancelResponse = await app.handle(
			new Request("http://localhost/api/taxation/retenciones/ret-1/cancel", {
				method: "PATCH",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({ reason: "Factura anulada por proveedor" }),
			}),
		);

		expect(declareResponse.status).toBe(200);
		expect(payResponse.status).toBe(200);
		expect(cancelResponse.status).toBe(200);
		expect(declareRetention).toHaveBeenCalledWith({
			retentionId: "ret-1",
			pdtReference: "PDT626-2026-03-001",
		});
		expect(markRetentionPaid).toHaveBeenCalledWith({
			retentionId: "ret-1",
			bankTransactionId: "tx-123",
		});
		expect(cancelRetention).toHaveBeenCalledWith({
			retentionId: "ret-1",
			reason: "Factura anulada por proveedor",
		});
	});
});
