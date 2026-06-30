import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../../governance-audit/artifact-event-audit.service", () => ({
	ArtifactEventAuditService: {
		record: vi.fn(),
	},
}));

import { ArtifactEventAuditService } from "../../../governance-audit/artifact-event-audit.service";
import { SireDiffCommitService } from "../../services/sire-diff-commit.service";
import { SireDiffLedgerService } from "../../services/sire-diff-ledger.service";

const mockRecord = ArtifactEventAuditService.record as ReturnType<typeof vi.fn>;

describe("SireDiffCommitService.commitResolutions", () => {
	beforeEach(() => {
		vi.spyOn(SireDiffLedgerService, "applyResolutions").mockResolvedValue({
			updatedInvoices: 1,
			updatedBills: 0,
			createdInvoices: 0,
			createdBills: 1,
		});
		mockRecord.mockResolvedValue({
			eventId: "evt_123",
			storedAt: "2026-03-15T12:00:00.000Z",
		});
	});

	afterEach(() => {
		vi.restoreAllMocks();
		vi.clearAllMocks();
	});

	it("applies ledger mutations then persists governance audit", async () => {
		const result = await SireDiffCommitService.commitResolutions({
			companyId: "cmp_test",
			period: "2026-03",
			artifactId: "art_1",
			traceId: "tr_1",
			sunatSource: "upload",
			summary: {
				matched: 1,
				mismatched: 1,
				missingOnLedger: 0,
				missingOnSunat: 0,
				critical: 1,
				totalDifference: 10,
			},
			rows: [
				{
					rowId: "r1",
					status: "MISMATCH",
					decision: "ACCEPT_SUNAT",
					sunatRecord: {
						documentType: "01",
						series: "F001",
						number: "1",
						issueDate: "2026-03-01",
						total: 110,
						currency: "PEN",
					},
				},
				{ rowId: "r2", status: "MATCH", decision: "KEEP_LOCAL" },
			],
			actorUserId: "user_1",
		});

		expect(result.committed).toBe(true);
		expect(result.ledgerMutation).toEqual({
			updatedInvoices: 1,
			updatedBills: 0,
			createdInvoices: 0,
			createdBills: 1,
		});
		expect(SireDiffLedgerService.applyResolutions).toHaveBeenCalledOnce();
		expect(mockRecord).toHaveBeenCalledWith(
			expect.objectContaining({
				actionId: "sire-diff-commit",
				artifactType: "sire.diff.v1",
			}),
		);
	});

	it("rejects commit when rows remain pending", async () => {
		await expect(
			SireDiffCommitService.commitResolutions({
				companyId: "cmp_test",
				period: "2026-03",
				artifactId: "art_1",
				traceId: "tr_1",
				sunatSource: "upload",
				summary: {
					matched: 0,
					mismatched: 1,
					missingOnLedger: 0,
					missingOnSunat: 0,
					critical: 1,
					totalDifference: 10,
				},
				rows: [{ rowId: "r1", status: "MISMATCH", decision: "PENDING" }],
				actorUserId: "user_1",
			}),
		).rejects.toThrow("pending");
	});
});
