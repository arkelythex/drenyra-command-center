/**
 * MissionRuntime — persistent mission execution runtime.
 *
 * Wraps the MonthlyCloseOrchestrator with persistence, event emission,
 * state transitions, and recovery. Every step transition is persisted
 * to the mission_events table and the accounting_missions state.
 *
 * M4: Adds intermediate states (WAITING_FOR_EVIDENCE, BLOCKED_BY_GATE, RETRYING),
 * event emission through SSE, and recovery after restart.
 */

import type { MissionEventStore } from "./sse/mission-event-store";
import type { MissionsService } from "./missions.service";
import type { MonthlyCloseOrchestrator } from "@drenyra/application/use-cases/monthly-close";
import { AccountingMissionStatus } from "@drenyra/mission-protocol";

export class MissionRuntime {
	constructor(
		private readonly missionsService: MissionsService,
		private readonly eventStore: MissionEventStore,
		private readonly orchestrator: MonthlyCloseOrchestrator,
	) {}

	/**
	 * Execute a mission: transition to RUNNING, run the intent pipeline,
	 * and emit events for each step.
	 */
	async executeMission(missionId: string, companyId: string): Promise<void> {
		await this.emitEvent(missionId, "STATE_TRANSITION", {
			status: AccountingMissionStatus.RUNNING,
			progress: 0,
			currentStep: "initializing",
		});

		try {
			const result = await this.orchestrator.execute(missionId, companyId);

			if (result.status === "COMPLETED") {
				await this.emitEvent(missionId, "COMPLETED", {
					status: AccountingMissionStatus.COMPLETED,
					progress: 10000,
				});
			} else if (result.status === "BLOCKED") {
				await this.emitEvent(missionId, "BLOCKER_ADDED", {
					status: AccountingMissionStatus.BLOCKED_BY_GATE,
					progress: 0,
					blockers: result.blockers ?? [],
				});
			} else {
				await this.emitEvent(missionId, "FAILED", {
					status: AccountingMissionStatus.FAILED,
					progress: 0,
					error: "Unknown failure",
				});
			}
		} catch (err) {
			const isTransient = this.isTransientError(err);
			if (isTransient) {
				await this.emitEvent(missionId, "STATE_TRANSITION", {
					status: AccountingMissionStatus.RETRYING,
					progress: 0,
					error: String(err),
				});
				// In a full implementation, this would queue a retry
				// For now, mark as UNKNOWN for manual reconciliation
				await this.emitEvent(missionId, "UNKNOWN", {
					status: AccountingMissionStatus.UNKNOWN,
					error: String(err),
				});
			} else {
				await this.emitEvent(missionId, "FAILED", {
					status: AccountingMissionStatus.FAILED,
					error: String(err),
				});
			}
		}
	}

	/**
	 * Emit mission snapshot as an SSE event and persist to event store.
	 */
	private async emitEvent(
		missionId: string,
		eventType: string,
		partial: Record<string, unknown>,
	): Promise<void> {
		const snapshot = await this.missionsService.getMission(missionId, "");
		if (!snapshot) return;

		const merged = { ...snapshot, ...partial };
		await this.eventStore.appendEvent(missionId, eventType, merged as any);
	}

	/**
	 * Recover all incomplete missions after server restart.
	 * Scans for RUNNING, WAITING_FOR_EVIDENCE, BLOCKED_BY_GATE, RETRYING, UNKNOWN.
	 */
	async recoverAfterRestart(): Promise<{ recovered: number; failed: number }> {
		const recoverableStatuses = [
			AccountingMissionStatus.RUNNING,
			AccountingMissionStatus.WAITING_FOR_EVIDENCE,
			AccountingMissionStatus.BLOCKED_BY_GATE,
			AccountingMissionStatus.RETRYING,
			AccountingMissionStatus.UNKNOWN,
		];

		const db = (this.missionsService as any).db;
		const missions = await db
			.select()
			.from(require("@drenyra/persistence/schema").accountingMissions)
			.where(
				require("@drenyra/persistence/schema").inArray(
					"status",
					recoverableStatuses,
				),
			);

		let recovered = 0;
		let failed = 0;

		for (const mission of missions) {
			try {
				await this.emitEvent(mission.id, "STATE_TRANSITION", {
					status: AccountingMissionStatus.RECOVERING,
					progress: mission.progress,
					currentStep: mission.currentStep ?? "recovering",
				});

				// For UNKNOWN, reconcile to RUNNING
				if (mission.status === AccountingMissionStatus.UNKNOWN) {
					await this.missionsService.reconcileMission(
						mission.id,
						mission.companyId,
						"system",
						{
							resolution: "RUNNING",
							reason: "Server restart recovery",
							expectedMissionVersion: mission.version,
						},
					);
					await this.emitEvent(mission.id, "RECONCILED", {
						status: AccountingMissionStatus.RUNNING,
					});
				}

				// Re-run the orchestrator for RUNNING missions
				if (
					mission.status === AccountingMissionStatus.RUNNING ||
					mission.status === AccountingMissionStatus.UNKNOWN
				) {
					this.executeMission(mission.id, mission.companyId).catch((err) => {
						console.error(
							`[MissionRuntime] Recovery failed for ${mission.id}:`,
							err,
						);
						failed++;
					});
					recovered++;
				}
			} catch (err) {
				console.error(
					`[MissionRuntime] Recovery error for ${mission.id}:`,
					err,
				);
				failed++;
			}
		}

		return { recovered, failed };
	}

	private isTransientError(err: unknown): boolean {
		const msg = String(err).toLowerCase();
		return (
			msg.includes("timeout") ||
			msg.includes("unavailable") ||
			msg.includes("retry") ||
			msg.includes("econnrefused") ||
			msg.includes("network")
		);
	}
}
