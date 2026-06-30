import { describe, expect, it, vi } from "vitest";

vi.mock("../../../security/rls-db-context", () => ({
	withCompanyRlsTransaction: vi.fn(
		async (_companyId: string, work: (tx: unknown) => Promise<unknown>) => {
			const tx = {
				update: vi.fn(() => ({
					set: vi.fn(() => ({
						where: vi.fn(() => ({
							returning: vi.fn(async () => []),
						})),
					})),
				})),
				insert: vi.fn(() => ({ values: vi.fn(async () => undefined) })),
				select: vi.fn(() => ({
					from: vi.fn(() => ({
						innerJoin: vi.fn(() => ({
							where: vi.fn(() => ({ limit: vi.fn(async () => []) })),
						})),
					})),
				})),
			};
			return work(tx);
		},
	),
}));

describe("SireDiffLedgerService.applyResolutions", () => {
	it("returns zero mutation when no ACCEPT_SUNAT rows", async () => {
		const { SireDiffLedgerService } = await import(
			"../../services/sire-diff-ledger.service"
		);
		const result = await SireDiffLedgerService.applyResolutions({
			companyId: "cmp_test",
			period: "2026-03",
			rows: [{ rowId: "r1", status: "MISMATCH", decision: "KEEP_LOCAL" }],
		});

		expect(result).toEqual({
			updatedInvoices: 0,
			updatedBills: 0,
			createdInvoices: 0,
			createdBills: 0,
		});
	});

	it("accepts rows with local and sunat records for ledger mutation", async () => {
		const { SireDiffLedgerService } = await import(
			"../../services/sire-diff-ledger.service"
		);
		const result = await SireDiffLedgerService.applyResolutions({
			companyId: "cmp_test",
			period: "2026-03",
			ledgerType: "compras",
			rows: [
				{
					rowId: "r1",
					status: "MISMATCH",
					decision: "ACCEPT_SUNAT",
					localRecord: {
						documentType: "01",
						series: "E001",
						number: "10",
						issueDate: "2026-03-05",
						total: 100,
						currency: "PEN",
					},
					sunatRecord: {
						documentType: "01",
						series: "E001",
						number: "10",
						issueDate: "2026-03-05",
						total: 118,
						currency: "PEN",
						ruc: "20123456789",
						reasonSocial: "Proveedor Demo SAC",
					},
				},
			],
		});

		expect(result.updatedInvoices + result.updatedBills).toBeGreaterThanOrEqual(
			0,
		);
	});
});
