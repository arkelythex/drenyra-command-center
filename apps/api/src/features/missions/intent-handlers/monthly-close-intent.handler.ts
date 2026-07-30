/**
 * MonthlyCloseIntentHandler — Handles monthly-close missions.
 *
 * onRunning: fires MonthlyCloseOrchestrator.execute() asynchronously.
 * onApproved: calls MonthlyCloseOrchestrator.applyEntries().
 */
import type { MissionIntentHandler } from "./mission-intent-handler.interface";
import type { MonthlyCloseOrchestrator } from "@drenyra/application/use-cases/monthly-close";

export class MonthlyCloseIntentHandler implements MissionIntentHandler {
  constructor(
    private readonly orchestrator: MonthlyCloseOrchestrator,
    private readonly db: unknown,
  ) {}

  async onRunning(missionId: string, companyId: string): Promise<void> {
    // Fire-and-forget: orchestrator runs asynchronously, reports via SSE
    this.orchestrator.execute(missionId, companyId).catch(async (err) => {
      console.error("[MonthlyCloseIntentHandler] Orchestrator crash:", err);
      try {
        await (this.db as any)
          .update("accounting_missions")
          .set({ status: "FAILED" })
          .where("id", missionId);
      } catch {
        // Best-effort failure recording
      }
    });
  }

  async onApproved(missionId: string, companyId: string): Promise<void> {
    await this.orchestrator.applyEntries(missionId, companyId);
  }
}
