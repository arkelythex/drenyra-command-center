/**
 * TransactionalApplyUseCase — Atomic application of an approved ClosingProposal.
 *
 * Design §7.1: Single database transaction that:
 * 1. Loads mission + proposal
 * 2. SELECT FOR UPDATE on period (race prevention)
 * 3. Posts all journal entries via JournalEntryPostingService
 * 4. Updates period via PeriodCloseService
 * 5. Resolves close gates
 * 6. Updates mission to COMPLETED
 * 7. Generates cryptographic receipt
 * 8. COMMIT (any failure rolls back)
 */
import { accountingPeriods, accountingMissions, missionReceipts, closeGates } from "@drenyra/persistence/schema";
import { eq, and } from "drizzle-orm";
import { createHash } from "node:crypto";
import type { DrizzleClient } from "@drenyra/persistence";
import type { ClosingProposal, ApplyResult } from "../types/pipeline-types";
import { JournalEntryPostingService } from "./journal-entry-posting.service";
import { PeriodCloseService } from "./period-close.service";

// ─── Receipt Content ─────────────────────────────────────────────────────────

interface CloseReceiptContent {
  missionId: string;
  companyId: string;
  actorId: string;
  decision: string;
  proposalVersion: number;
  evidenceHash: string;
  previousStatus: string;
  newStatus: string;
  payloadHash: string;
  timestamp: string;
  fiscalPeriod: string;
  postedEntryIds: string[];
  periodFinalStatus: string;
  gatesResolved: number;
  totalDebitCents: number;
  totalCreditCents: number;
}

// ─── Errors ─────────────────────────────────────────────────────────────────

export class ApplyError extends Error {
  constructor(
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "ApplyError";
  }
}

// ─── Use Case ────────────────────────────────────────────────────────────────

export class TransactionalApplyUseCase {
  constructor(
    private readonly db: DrizzleClient,
    private readonly journalEntryPosting: JournalEntryPostingService,
    private readonly periodClose: PeriodCloseService,
  ) {}

  /**
   * Apply an approved ClosingProposal atomically.
   */
  async execute(missionId: string, companyId: string): Promise<ApplyResult> {
    // ─── 1. Load mission + proposal ──────────────────────────────────
    const mission = await this.loadMission(missionId);
    const proposal = mission.proposal as ClosingProposal | null;

    if (!proposal) {
      throw new ApplyError("NO_PROPOSAL", "No proposal to apply");
    }

    return this.db.transaction(async (tx) => {
      // ─── 2. Period guard: SELECT FOR UPDATE ───────────────────────
      const [y, m] = proposal.fiscalPeriod.split("-").map(Number);
      const [period] = await tx
        .select()
        .from(accountingPeriods)
        .where(
          and(
            eq(accountingPeriods.companyId, companyId as any),
            eq(accountingPeriods.year, y),
            eq(accountingPeriods.month, m),
          ),
        )
        .for("update")
        .limit(1);

      if (!period || period.status !== "abierto") {
        throw new ApplyError(
          "PERIOD_ALREADY_CLOSED",
          `Period ${proposal.fiscalPeriod} is '${period?.status ?? "not found"}', cannot apply`,
        );
      }

      // ─── 3. Post all journal entries ──────────────────────────────
      const postedEntryIds: string[] = [];
      for (const proposed of proposal.proposedEntries) {
        const entryNumber = await this.journalEntryPosting.nextEntryNumber(
          tx, companyId, proposal.fiscalPeriod,
        );

        const posted = await this.journalEntryPosting.post(tx, {
          companyId,
          entryNumber,
          periodKey: proposal.fiscalPeriod,
          date: proposed.date,
          gloss: proposed.description,
          status: "mayorizado",
          lines: proposed.lines.map((l) => ({
            accountCode: l.accountCode,
            description: l.description,
            debitCents: l.debitCents,
            creditCents: l.creditCents,
          })),
        });

        postedEntryIds.push(posted.id);
      }

      // ─── 4. Update period status ──────────────────────────────────
      await this.periodClose.closeFinal(tx, {
        companyId,
        year: y,
        month: m,
      });

      // ─── 5. Resolve close gates ───────────────────────────────────
      const gatesResolved = await tx
        .update(closeGates)
        .set({ status: "PASSED", updatedAt: new Date() } as any)
        .where(
          and(
            eq(closeGates.companyId, companyId as any),
            eq(closeGates.period, proposal.fiscalPeriod),
          ),
        );

      // ─── 6. Update mission to COMPLETED ───────────────────────────
      await tx
        .update(accountingMissions)
        .set({
          status: "COMPLETED",
          updatedAt: new Date(),
        } as any)
        .where(eq(accountingMissions.id, missionId));

      // ─── 7. Generate cryptographic receipt ────────────────────────
      const payloadHash = createHash("sha256")
        .update(JSON.stringify({
          postedEntryIds,
          fiscalPeriod: proposal.fiscalPeriod,
        }))
        .digest("hex");

      const receiptContent: CloseReceiptContent = {
        missionId,
        companyId,
        actorId: "system",
        decision: "APPLY",
        proposalVersion: proposal.version,
        evidenceHash: proposal.evidenceHash,
        previousStatus: "APPROVED",
        newStatus: "COMPLETED",
        payloadHash,
        timestamp: new Date().toISOString(),
        fiscalPeriod: proposal.fiscalPeriod,
        postedEntryIds,
        periodFinalStatus: "cerrado_final",
        gatesResolved: 0, // will be set after the update
        totalDebitCents: proposal.totalDebitCents,
        totalCreditCents: proposal.totalCreditCents,
      };

      const receiptHash = generateReceiptHash(receiptContent);
      const receiptId = receiptHash.substring(0, 36).replace(
        /(.{8})(.{4})(.{4})(.{4})(.{12})/,
        "$1-$2-$3-$4-$5",
      );

      await tx.insert(missionReceipts).values({
        missionId,
        companyId,
        actorId: "system",
        decision: "APPLY",
        proposalVersion: proposal.version,
        evidenceHash: proposal.evidenceHash,
        previousStatus: "APPROVED",
        newStatus: "COMPLETED",
        payloadHash,
        receiptHash,
      } as any);

      return {
        success: true,
        receiptHash,
        postedEntryIds,
      };
    });
  }

  // ─── Private ────────────────────────────────────────────────────────

  private async loadMission(missionId: string): Promise<any> {
    const rows = await this.db
      .select()
      .from(accountingMissions)
      .where(eq(accountingMissions.id, missionId))
      .limit(1);

    if (!rows || rows.length === 0) {
      throw new ApplyError("MISSION_NOT_FOUND", `Mission ${missionId} not found`);
    }

    return rows[0];
  }
}

// ─── Receipt hash (replicates mission-domain pattern) ────────────────────────

function sortedStringify(obj: Record<string, unknown>): string {
  const sortedKeys = Object.keys(obj).sort();
  const sorted: Record<string, unknown> = {};
  for (const key of sortedKeys) {
    sorted[key] = obj[key];
  }
  return JSON.stringify(sorted);
}

function generateReceiptHash(content: CloseReceiptContent): string {
  return createHash("sha256")
    .update(sortedStringify(content as unknown as Record<string, unknown>))
    .digest("hex");
}
