/**
 * MonthlyCloseIntentHandler — Handles monthly-close missions.
 *
 * onRunning: fires MonthlyCloseOrchestrator.execute() asynchronously.
 * onApproved: calls MonthlyCloseOrchestrator.applyEntries().
 */

import type { MonthlyCloseOrchestrator } from "@drenyra/application/use-cases/monthly-close";
import { and, eq } from "@drenyra/persistence/query";
import { accountingMissions } from "@drenyra/persistence/schema";
import type { FiscalMemoryRecorder } from "./fiscal-memory.recorder";
import type { MissionIntentHandler } from "./mission-intent-handler.interface";

export class MonthlyCloseIntentHandler implements MissionIntentHandler {
	constructor(
		private readonly orchestrator: MonthlyCloseOrchestrator,
		private readonly db: unknown,
		private readonly fiscalMemoryRecorder?: FiscalMemoryRecorder,
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
		// Best-effort institutional memory: record the approved proposal's
		// fiscal decision. Never breaks the flow — failures are warnings.
		await this.recordApprovedProposal(missionId, companyId);
	}

	/**
	 * Records the approved proposal as fiscal memory when a recorder is
	 * injected. The proposal is loaded from the mission; a missing proposal
	 * or a recorder failure is a warning, never an error in the mission.
	 */
	private async recordApprovedProposal(
		missionId: string,
		companyId: string,
	): Promise<void> {
		if (!this.fiscalMemoryRecorder) return;
		try {
			const mission = await (this.db as any)
				.select()
				.from(accountingMissions)
				.where(
					and(
						eq(accountingMissions.id, missionId),
						eq(accountingMissions.companyId, companyId),
					),
				)
				.limit(1);
			const proposal = mission?.[0]?.proposal;
			if (!proposal) {
				console.warn(
					`[engram] fiscal memory skipped for ${missionId}: no proposal on the mission`,
				);
				return;
			}
			await this.fiscalMemoryRecorder.recordApprovedProposal({
				missionId,
				companyId,
				proposal,
				approvedBy: "system",
			});
		} catch (error) {
			console.warn(
				`[engram] fiscal memory skipped for ${missionId}: ${
					error instanceof Error ? error.message : String(error)
				}`,
			);
		}
	}
}
