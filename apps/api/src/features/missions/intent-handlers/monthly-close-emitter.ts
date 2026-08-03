/**
 * MissionEventStoreEmitter — MissionEventEmitter bridge.
 *
 * Implements the monthly-close pipeline's MissionEventEmitter interface
 * (emitStepProgress / emitBlockers / emitProposalCreated /
 * emitStateTransition) by appending mission events to the MissionEventStore —
 * the same event log the mission status machine uses, so SSE subscribers and
 * the recovery hook see the pipeline's progress exactly like any other
 * mission event.
 *
 * Non-authorizing: this only emits OBSERVATION events about pipeline
 * progress; it never approves, posts, or closes anything.
 */

import type {
	ClosingProposal,
	MissionBlocker,
	MissionEventEmitter,
	StepMetrics,
} from "@drenyra/application/use-cases/monthly-close";
import type { MissionEventStore } from "../sse/mission-event-store";

export class MissionEventStoreEmitter implements MissionEventEmitter {
	constructor(private readonly eventStore: MissionEventStore) {}

	async emitStepProgress(
		missionId: string,
		stepNumber: number,
		stepName: string,
		status: "STARTED" | "COMPLETED" | "FAILED",
		metrics?: StepMetrics,
	): Promise<void> {
		await this.eventStore.appendEvent(missionId, "STEP_PROGRESS", {
			stepNumber,
			stepName,
			status,
			metrics,
		});
	}

	async emitBlockers(
		missionId: string,
		blockers: MissionBlocker[],
	): Promise<void> {
		await this.eventStore.appendEvent(missionId, "BLOCKER_ADDED", { blockers });
	}

	async emitProposalCreated(
		missionId: string,
		proposal: ClosingProposal,
	): Promise<void> {
		await this.eventStore.appendEvent(missionId, "PROPOSAL_CREATED", {
			proposal,
		});
	}

	async emitStateTransition(
		missionId: string,
		fromStatus: string,
		toStatus: string,
	): Promise<void> {
		await this.eventStore.appendEvent(missionId, "STATE_TRANSITION", {
			fromStatus,
			toStatus,
		});
	}
}
