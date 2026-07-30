/**
 * CorrectionIntentHandler — Handles correction missions for closed periods.
 *
 * onRunning: generates compensating entries via CompensatingEntryGenerator,
 *            produces a ClosingProposal with entryType CORRECTION,
 *            routes through AccountingPR.
 * onApproved: posts compensating entries via TransactionalApplyUseCase
 *             to the CURRENT open period (not the closed one).
 */
import type { MissionIntentHandler } from "./mission-intent-handler.interface";

export class CorrectionIntentHandler implements MissionIntentHandler {
  constructor(
    private readonly compensatingGenerator: any,
    private readonly transactionalApply: any,
    private readonly db: any,
  ) {}

  async onRunning(missionId: string, companyId: string): Promise<void> {
    try {
      // Load mission to get correction metadata
      const rows = await this.db
        .select()
        .from("accounting_missions")
        .where("id", missionId)
        .limit(1);

      if (!rows || rows.length === 0) {
        throw new Error(`Mission ${missionId} not found`);
      }

      const mission = rows[0];
      const correctionIntent = mission.input as any;

      // Generate compensating entries
      const compensatingEntries = await this.compensatingGenerator.generate(
        correctionIntent?.entriesToReverse ?? [],
        mission.fiscalPeriod,
      );

      // Build a correction proposal
      const proposal = {
        id: crypto.randomUUID(),
        missionId,
        version: 1,
        fiscalPeriod: mission.fiscalPeriod,
        generatedAt: new Date().toISOString(),
        proposedEntries: compensatingEntries.map((ce: any) => ({
          id: crypto.randomUUID(),
          entryType: "CORRECTION" as const,
          description: ce.description,
          date: ce.date,
          lines: ce.lines,
          totalDebits: ce.totalDebits,
          totalCredits: ce.totalCredits,
          sourceEvidence: [],
          correctionOf: ce.correctionOf,
        })),
        entryCount: compensatingEntries.length,
        totalDebitCents: compensatingEntries.reduce((s: number, e: any) => s + e.totalDebits, 0),
        totalCreditCents: compensatingEntries.reduce((s: number, e: any) => s + e.totalCredits, 0),
        taxImpact: { igvPayableCents: 0, rentaPayableCents: 0, totalTaxLiabilityCents: 0 },
        financialImpact: { totalRevenueCents: 0, totalExpenseCents: 0, netIncomeCents: 0 },
        riskLevel: "MEDIUM" as const,
        unresolvedExceptions: [],
        requiredApprovals: ["admin"],
        sourceEvidence: [],
        evidenceHash: "",
      };

      // Store proposal and transition to AWAITING_APPROVAL
      await this.db
        .update("accounting_missions")
        .set({
          proposal,
          status: "AWAITING_APPROVAL",
        })
        .where("id", missionId);
    } catch (err) {
      console.error("[CorrectionIntentHandler] Error:", err);
      await this.db
        .update("accounting_missions")
        .set({ status: "FAILED" })
        .where("id", missionId);
    }
  }

  async onApproved(missionId: string, companyId: string): Promise<void> {
    await this.transactionalApply.execute(missionId, companyId);
  }
}
