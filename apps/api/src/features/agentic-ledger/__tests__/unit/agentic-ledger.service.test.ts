import { beforeEach, describe, expect, it, vi } from "vitest";
import type { BankTransactionImporter } from "../../agentic-ledger.service";

const mockTransactionService = {
	importTransactions: vi.fn(),
} as BankTransactionImporter;

const { AgenticLedgerService } = await import("../../agentic-ledger.service");

describe("AgenticLedgerService", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("ingests normalized transactions and returns imported count", async () => {
		mockTransactionService.importTransactions.mockResolvedValue(2);

		const service = new AgenticLedgerService(mockTransactionService);
		const res = await service.ingestBank({
			companyId: "cmp-1",
			accountId: "acc-1",
			connector: "normalized",
			transactions: [
				{ date: "2026-01-01", description: "A", amount: 10, type: "CREDIT" },
				{ date: "2026-01-02", description: "B", amount: 20, type: "DEBIT" },
			],
		});

		expect(res).toEqual({ imported: 2, duplicates: 0, warnings: [] });
		expect(mockTransactionService.importTransactions).toHaveBeenCalledWith(
			"cmp-1",
			"acc-1",
			expect.arrayContaining([
				expect.objectContaining({
					description: "A",
					amount: 10,
					type: "CREDIT",
				}),
				expect.objectContaining({
					description: "B",
					amount: 20,
					type: "DEBIT",
				}),
			]),
		);
	});

	it("dedupes identical rows in a single upload (best-effort v1)", async () => {
		mockTransactionService.importTransactions.mockResolvedValue(1);

		const service = new AgenticLedgerService(mockTransactionService);
		const res = await service.ingestBank({
			companyId: "cmp-1",
			accountId: "acc-1",
			connector: "normalized",
			transactions: [
				{
					date: "2026-01-01",
					description: "A",
					amount: 10,
					type: "CREDIT",
					reference: "x",
				},
				{
					date: "2026-01-01",
					description: "A",
					amount: 10,
					type: "CREDIT",
					reference: "x",
				},
			],
		});

		expect(res.duplicates).toBe(1);
		expect(res.warnings).toEqual([]);
		expect(mockTransactionService.importTransactions).toHaveBeenCalledWith(
			"cmp-1",
			"acc-1",
			expect.any(Array),
		);
		const sent = mockTransactionService.importTransactions.mock.calls[0]?.[2];
		expect(sent).toHaveLength(1);
	});

	it("parses constrained CSV input when connector=csv", async () => {
		mockTransactionService.importTransactions.mockResolvedValue(1);

		const service = new AgenticLedgerService(mockTransactionService);
		const res = await service.ingestBank({
			companyId: "cmp-1",
			accountId: "acc-1",
			connector: "csv",
			csvText: "2026-01-31,DEPÓSITO,10,CREDIT,OP-123",
		});

		expect(res).toEqual({ imported: 1, duplicates: 0, warnings: [] });
		const sent = mockTransactionService.importTransactions.mock.calls[0]?.[2];
		expect(sent?.[0]).toEqual(
			expect.objectContaining({
				description: "DEPÓSITO",
				amount: 10,
				type: "CREDIT",
				reference: "OP-123",
			}),
		);
	});

	it("parses BCP CSV exports (header-based) when format=BCP", async () => {
		mockTransactionService.importTransactions.mockResolvedValue(1);

		const service = new AgenticLedgerService(mockTransactionService);
		const res = await service.ingestBank({
			companyId: "cmp-1",
			accountId: "acc-1",
			connector: "csv",
			format: "BCP",
			csvText: [
				"Fecha;Descripción;Cargo;Abono;Nro Operación",
				"31/01/2026;PAGO PROVEEDOR;118.00;;OP-123",
			].join("\n"),
		});

		expect(res).toEqual({ imported: 1, duplicates: 0, warnings: [] });
		const sent = mockTransactionService.importTransactions.mock.calls[0]?.[2];
		expect(sent?.[0]).toEqual(
			expect.objectContaining({
				description: "PAGO PROVEEDOR",
				amount: 118,
				type: "DEBIT",
				reference: "OP-123",
			}),
		);
	});

	it("parses INTERBANK-like CSV exports using Peru header heuristics", async () => {
		mockTransactionService.importTransactions.mockResolvedValue(1);

		const service = new AgenticLedgerService(mockTransactionService);
		const res = await service.ingestBank({
			companyId: "cmp-1",
			accountId: "acc-1",
			connector: "csv",
			format: "INTERBANK",
			csvText: [
				"Fecha Movimiento,Detalle,Importe,Referencia",
				"2026-01-31,PAGO SERVICIO,-50.25,OP-9",
			].join("\n"),
		});

		expect(res).toEqual({ imported: 1, duplicates: 0, warnings: [] });
		const sent = mockTransactionService.importTransactions.mock.calls[0]?.[2];
		expect(sent?.[0]).toEqual(
			expect.objectContaining({
				description: "PAGO SERVICIO",
				amount: 50.25,
				type: "DEBIT",
				reference: "OP-9",
			}),
		);
	});

	it("parses BBVA-like CSV exports using Peru header heuristics", async () => {
		mockTransactionService.importTransactions.mockResolvedValue(1);

		const service = new AgenticLedgerService(mockTransactionService);
		const res = await service.ingestBank({
			companyId: "cmp-1",
			accountId: "acc-1",
			connector: "csv",
			format: "BBVA",
			csvText: [
				"Fecha;Concepto;Monto;Referencia",
				"31/01/2026;COBRO CLIENTE;2500,00;BBVA-1",
			].join("\n"),
		});

		expect(res.imported).toBe(1);
		expect(res.warnings).toEqual([]);
		const sent = mockTransactionService.importTransactions.mock.calls[0]?.[2];
		expect(sent?.[0]).toEqual(
			expect.objectContaining({
				description: "COBRO CLIENTE",
				amount: 2500,
				type: "CREDIT",
				reference: "BBVA-1",
			}),
		);
	});

	it("parses SCOTIABANK-like CSV exports using Peru header heuristics (cargo/abono)", async () => {
		mockTransactionService.importTransactions.mockResolvedValue(1);

		const service = new AgenticLedgerService(mockTransactionService);
		const res = await service.ingestBank({
			companyId: "cmp-1",
			accountId: "acc-1",
			connector: "csv",
			format: "SCOTIABANK",
			csvText: [
				"Fecha\tDetalle\tCargo\tAbono\tOperacion",
				"31/01/2026\tPAGO\t100.00\t\tSCO-9",
			].join("\n"),
		});

		expect(res.imported).toBe(1);
		expect(res.warnings).toEqual([]);
		const sent = mockTransactionService.importTransactions.mock.calls[0]?.[2];
		expect(sent?.[0]).toEqual(
			expect.objectContaining({
				description: "PAGO",
				amount: 100,
				type: "DEBIT",
				reference: "SCO-9",
			}),
		);
	});

	it("throws if companyId/accountId missing", async () => {
		const service = new AgenticLedgerService(mockTransactionService);
		await expect(
			service.ingestBank({
				companyId: "",
				accountId: "acc-1",
				connector: "normalized",
			} as Parameters<AgenticLedgerService["ingestBank"]>[0]),
		).rejects.toThrow("companyId is required");
		await expect(
			service.ingestBank({
				companyId: "cmp-1",
				accountId: "",
				connector: "normalized",
			} as Parameters<AgenticLedgerService["ingestBank"]>[0]),
		).rejects.toThrow("accountId is required");
	});
});
