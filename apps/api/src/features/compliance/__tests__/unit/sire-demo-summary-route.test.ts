import { Elysia } from "elysia";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SireRegisterExportService as SIREService } from "../../../sire/services/sire-register-export.service";

const invoicesFindManyMock = vi.fn();
const billsFindManyMock = vi.fn();

vi.mock("@arkelythex/persistence/client", () => ({
	db: {
		query: {
			invoices: {
				findMany: invoicesFindManyMock,
			},
			bills: {
				findMany: billsFindManyMock,
			},
		},
	},
}));

describe("compliance sire demo summary route", () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("returns real summary counters for the requested demo period", async () => {
		const { complianceModule } = await import("../../index");
		const app = new Elysia().use(complianceModule);

		vi.spyOn(SIREService, "generateSalesRegister").mockResolvedValue(
			"20260300|1|15/03/2026|01|F001|00000001|00000001|6|20123456789|DEMO|0.00|100.00|0.00|18.00|0.00|0.00|0.00|0.00|0.00|0.00|0.00|0.00|118.00|PEN|1.000|||||1\n" +
				"20260300|2|16/03/2026|01|F001|00000002|00000002|6|20123456789|DEMO|0.00|200.00|0.00|36.00|0.00|0.00|0.00|0.00|0.00|0.00|0.00|0.00|236.00|PEN|1.000|||||1",
		);
		vi.spyOn(SIREService, "generatePurchasesRegister").mockResolvedValue(
			"20260300|1|15/03/2026|15/03/2026|01|F001||00000001|00000001|6|20123456789|DEMO|100.00|18.00|0.00|0.00|0.00|0.00|0.00|0.00|0.00|0.00|118.00|PEN|1.000|||||||||1|\n" +
				"20260300|2|16/03/2026|16/03/2026|01|F001||00000002|00000002|6|20123456789|DEMO|200.00|36.00|0.00|0.00|0.00|0.00|0.00|0.00|0.00|0.00|236.00|PEN|1.000|||||||||1|",
		);
		invoicesFindManyMock.mockResolvedValue([
			{
				invoiceNumber: "F001-0000101",
				totalAmount: "118.00",
				issueDate: new Date("2026-03-15T12:00:00.000Z"),
				sunatStatus: "OBSERVED",
				status: "SENT",
				customer: { legalName: "Cliente Demo Retail SAC" },
			},
		] as never);
		billsFindManyMock.mockResolvedValue([
			{
				billNumber: "B001-000145",
				totalAmount: "236.00",
				issueDate: new Date("2026-03-16T12:00:00.000Z"),
				status: "PAID",
				vendor: { legalName: "Proveedor Demo Norte SAC" },
			},
		] as never);

		const response = await app.handle(
			new Request(
				"http://localhost/api/compliance/sire-demo-summary?companyId=cmp-1&period=2026-03",
			),
		);
		const payload = await response.json();

		expect(response.status).toBe(200);
		expect(payload).toEqual({
			success: true,
			data: {
				source: "demo-seed",
				period: "2026-03",
				generatedAt: expect.any(String),
				sales: {
					recordCount: 2,
					warningCount: 0,
					isValid: true,
				},
				purchases: {
					recordCount: 2,
					warningCount: 0,
					isValid: true,
				},
				matches: 4,
				differences: 0,
				previewRows: [
					{
						icon: "file",
						id: "F001-0000101",
						provider: "Cliente Demo Retail SAC",
						sunatStatus: "Observado",
						internalStatus: "En Proceso",
						amount: "S/ 118.00",
						date: "15 MAR",
						isCritical: true,
					},
					{
						icon: "file",
						id: "B001-000145",
						provider: "Proveedor Demo Norte SAC",
						sunatStatus: "Registrado",
						internalStatus: "Registrado",
						amount: "S/ 236.00",
						date: "16 MAR",
					},
				],
			},
		});
	});
});
