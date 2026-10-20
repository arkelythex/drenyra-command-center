/**
 * MonthlyCloseMissionStore — persistence port for the monthly-close pipeline.
 *
 * The orchestrator lives in the application layer and cannot import the
 * persistence package, so it records mission outcomes through this port.
 * Every method is scoped by companyId: an implementation must never read or
 * change a mission that belongs to another company.
 */

import type { ClosingProposal, MissionBlocker } from "../types/pipeline-types";

/** The mission fields the pipeline needs to run. */
export interface MonthlyCloseMissionRecord {
	id: string;
	companyId: string;
	fiscalPeriod: string;
}

export interface MonthlyCloseMissionStore {
	/** Load a mission of this company, or null when it does not exist there. */
	load(
		missionId: string,
		companyId: string,
	): Promise<MonthlyCloseMissionRecord | null>;

	/** RUNNING → BLOCKED, keeping the blockers that stopped the run. */
	markBlocked(
		missionId: string,
		companyId: string,
		blockers: MissionBlocker[],
	): Promise<void>;

	/** RUNNING → FAILED, keeping the reason. */
	markFailed(
		missionId: string,
		companyId: string,
		reason: string,
	): Promise<void>;

	/** RUNNING → AWAITING_APPROVAL, persisting the sealed proposal. */
	markAwaitingApproval(
		missionId: string,
		companyId: string,
		proposal: ClosingProposal,
	): Promise<void>;
}
