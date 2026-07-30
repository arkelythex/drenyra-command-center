import { describe, expect, it, vi } from "vitest";
import { TransactionalApplyUseCase } from "../transactional-apply.use-case";
import { JournalEntryPostingService } from "../journal-entry-posting.service";
import { PeriodCloseService } from "../period-close.service";
import type { ClosingProposal } from "../../types/pipeline-types";

function makeProposal(overrides?: Partial<ClosingProposal>): ClosingProposal {
  return {
    id: "prop-001", missionId: "mission-001", version: 1, fiscalPeriod: "2026-06",
    generatedAt: new Date().toISOString(),
    proposedEntries: [{
      id: "entry-001", entryType: "DEPRECIATION", description: "Depreciación mensual", date: "2026-06-30",
      lines: [
        { accountCode: "681", accountName: "Depreciación", description: "Gasto", debitCents: 50000, creditCents: 0 },
        { accountCode: "391", accountName: "Dep. Acumulada", description: "Contra", debitCents: 0, creditCents: 50000 },
      ],
      totalDebits: 50000, totalCredits: 50000, sourceEvidence: ["ev-001"],
    }],
    entryCount: 1, totalDebitCents: 50000, totalCreditCents: 50000,
    taxImpact: { igvPayableCents: 0, rentaPayableCents: 0, totalTaxLiabilityCents: 0 },
    financialImpact: { totalRevenueCents: 0, totalExpenseCents: 50000, netIncomeCents: -50000 },
    riskLevel: "LOW", unresolvedExceptions: [], requiredApprovals: ["user-1", "user-2"],
    sourceEvidence: [{ id: "ev-001", type: "snapshot", hash: "abc123", uri: "file://ev-001" }],
    evidenceHash: "abc123def456", accountingPrId: "pr-001",
    ...overrides,
  };
}

/** Return a thenable (awaitable) chain that resolves to result.
 *  If hasFor, .for("update") is available and .limit() resolves to result. */
function selectChain(result: any, hasFor = false) {
  const chain = Promise.resolve(result) as any;
  chain.from = vi.fn().mockReturnValue(chain);
  chain.where = vi.fn().mockReturnValue(chain);
  if (hasFor) {
    chain.for = vi.fn().mockReturnValue({ limit: vi.fn().mockResolvedValue(result) });
  }
  chain.limit = vi.fn().mockResolvedValue(result);
  chain.then = (resolve: any) => Promise.resolve(result).then(resolve);
  return chain;
}

function createMocks(overrides?: { mission?: any; periodStatus?: string; selectResult?: any[] }) {
  const jp = new JournalEntryPostingService();
  const pc = new PeriodCloseService();

  let selectCallCount = 0;
  const mockDb = {
    select: vi.fn().mockImplementation(() => {
      // First call is loadMission
      return selectChain(overrides?.selectResult ?? [overrides?.mission ?? {
        id: "mission-001", companyId: "c-001", fiscalPeriod: "2026-06",
        status: "APPROVED", proposal: makeProposal(), evidenceHash: "abc123def456",
      }]);
    }),
    transaction: vi.fn().mockImplementation(async (cb: (tx: any) => Promise<any>) => {
      let txSelectCount = 0;
      const tx = {
        select: vi.fn().mockImplementation(() => {
          txSelectCount++;
          // First select: period guard (has FOR UPDATE)
          if (txSelectCount === 1) {
            return selectChain([{ id: "per-001", status: overrides?.periodStatus ?? "abierto" }], true);
          }
          // Subsequent: nextEntryNumber queries (journalEntries)
          return selectChain([]);
        }),
        insert: vi.fn().mockReturnValue({
          values: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([{ id: crypto.randomUUID() }]),
          }),
        }),
        update: vi.fn().mockReturnValue({
          set: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue(undefined),
          }),
        }),
      };
      return cb(tx);
    }),
  };

  return { mockDb, journalPosting: jp, periodClose: pc };
}

describe("TransactionalApplyUseCase", () => {
  it("should successfully apply an approved proposal and return receipt", async () => {
    const { mockDb, journalPosting, periodClose } = createMocks();
    const useCase = new TransactionalApplyUseCase(mockDb as any, journalPosting, periodClose);
    const result = await useCase.execute("mission-001", "c-001");
    expect(result.success).toBe(true);
    expect(result.receiptHash).toHaveLength(64);
    expect(result.postedEntryIds.length).toBe(1);
  });

  it("should throw when mission has no proposal", async () => {
    const { mockDb, journalPosting, periodClose } = createMocks({
      mission: { id: "mission-001", companyId: "c-001", fiscalPeriod: "2026-06", status: "APPROVED", proposal: null },
    });
    const useCase = new TransactionalApplyUseCase(mockDb as any, journalPosting, periodClose);
    await expect(useCase.execute("mission-001", "c-001")).rejects.toThrow("No proposal to apply");
  });

  it("should throw when period is not abierto", async () => {
    const { mockDb, journalPosting, periodClose } = createMocks({ periodStatus: "cerrado_final" });
    const useCase = new TransactionalApplyUseCase(mockDb as any, journalPosting, periodClose);
    await expect(useCase.execute("mission-001", "c-001")).rejects.toThrow(/cannot apply/);
  });

  it("should generate a receipt hash of 64 hex characters", async () => {
    const { mockDb, journalPosting, periodClose } = createMocks();
    const useCase = new TransactionalApplyUseCase(mockDb as any, journalPosting, periodClose);
    const result = await useCase.execute("mission-001", "c-001");
    expect(result.receiptHash).toMatch(/^[0-9a-f]{64}$/);
  });

  it("should throw when mission is not found", async () => {
    const { mockDb, journalPosting, periodClose } = createMocks({ selectResult: [] });
    const useCase = new TransactionalApplyUseCase(mockDb as any, journalPosting, periodClose);
    await expect(useCase.execute("mission-999", "c-001")).rejects.toThrow(/not found/);
  });
});
