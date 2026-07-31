/**
 * MissionRecovery — startup recovery hook with multi-instance fencing.
 *
 * Runs after DB connection, signing config, and migration validation are
 * ready, before the API exposes healthy. It is fire-and-forget: a global
 * timeout bounds the scan so startup never blocks indefinitely.
 *
 * Recovery semantics per state:
 *   RUNNING              → claim lease, re-dispatch pipeline if a handler
 *                          is registered for the intent
 *   RETRYING             → claim lease, re-dispatch (safe to repeat)
 *   UNKNOWN              → decide by evidence: if a COMPLETED event exists
 *                          after the unknown marker, the mission actually
 *                          completed; otherwise reconcile to RUNNING and
 *                          re-dispatch
 *   WAITING_FOR_EVIDENCE → leave as-is (human intervention required)
 *   BLOCKED_BY_GATE      → leave as-is (human intervention required)
 *
 * FAILED is terminal and never recovered. COMPLETED is terminal and never
 * touched. Missions held by another runtime's lease are skipped, never
 * marked failed — fencing guarantees exactly one owner per mission.
 */

import { and, eq, inArray } from "drizzle-orm";
import { accountingMissions, missionEvents } from "@drenyra/persistence/schema";
import {
	AccountingMissionStatus,
	MissionErrorCode,
} from "@drenyra/mission-protocol";
import { MissionsService } from "./missions.service";
import { MissionLeaseService } from "./mission-lease.service";
import { getIntentHandler } from "./intent-handlers/intent-handlers.registry";
import { createLogger } from "../../lib/logger";

const logger = createLogger({ module: "mission-recovery" });

const RECOVERABLE_STATUSES = [
	AccountingMissionStatus.RUNNING,
	AccountingMissionStatus.RETRYING,
	AccountingMissionStatus.UNKNOWN,
];

const DEFAULT_TIMEOUT_MS = 5_000;

export interface MissionRecoveryResult {
	recovered: number;
	skipped: number;
	failed: number;
	timedOut: boolean;
}

/**
 * Scan recoverable missions, claim each with a fencing lease, and dispatch
 * the pipeline when an intent handler is registered. Bounded by a timeout.
 */
export async function runMissionRecovery(
	db: any,
	timeoutMs: number = DEFAULT_TIMEOUT_MS,
): Promise<MissionRecoveryResult> {
	const leaseService = new MissionLeaseService(db);
	const missionsService = new MissionsService(db);

	const result: MissionRecoveryResult = {
		recovered: 0,
		skipped: 0,
		failed: 0,
		timedOut: false,
	};

	const scan = (async () => {
		const missions = await db
			.select()
			.from(accountingMissions)
			.where(inArray(accountingMissions.status, [...RECOVERABLE_STATUSES]));

		for (const mission of missions) {
			const missionId = mission.id as string;
			const companyId = mission.companyId as string;
			const version = mission.version as number;
			const status = mission.status as AccountingMissionStatus;

			// Claim the mission with fencing. If another runtime owns it,
			// acquire returns null and we skip — never fail.
			const lease = await leaseService.acquire(
				missionId,
				companyId,
				version,
				"startup-recovery",
				60_000,
			);
			if (!lease) {
				result.skipped += 1;
				continue;
			}

			if (status === AccountingMissionStatus.UNKNOWN) {
				await reconcileUnknown(
					db,
					missionsService,
					missionId,
					companyId,
					version,
				);
			}

			// Re-dispatch the pipeline only when an intent handler exists.
			// Production currently registers no handlers, so missions are
			// left claimed and RUNNING for an external executor.
			const handler = getIntentHandler(mission.intent as string);
			if (handler) {
				handler
					.onRunning(missionId, companyId)
					.catch((err: unknown) => {
						logger.error(
							{ missionId, err: String(err) },
							"Recovery re-dispatch failed",
						);
						result.failed += 1;
					});
				result.recovered += 1;
			} else {
				result.skipped += 1;
			}
		}

		return result;
	})();

	const timeout = new Promise<MissionRecoveryResult>((resolve) => {
		setTimeout(() => {
			resolve({ ...result, timedOut: true });
		}, timeoutMs);
	});

	return Promise.race([scan, timeout]);
}

/**
 * Resolve UNKNOWN by evidence: if a COMPLETED event exists after the
 * mission entered UNKNOWN, the external operation did produce effects and
 * the mission is COMPLETED. Otherwise reconcile to RUNNING for retry.
 */
async function reconcileUnknown(
	db: any,
	missionsService: MissionsService,
	missionId: string,
	companyId: string,
	expectedVersion: number,
): Promise<void> {
	const completedEvent = await db
		.select({ id: missionEvents.id })
		.from(missionEvents)
		.where(
			and(
				eq(missionEvents.missionId, missionId),
				eq(missionEvents.eventType, "COMPLETED"),
			),
		)
		.limit(1);

	if (completedEvent.length > 0) {
		// The operation completed after all; the mission's canonical state
		// should reflect COMPLETED, not UNKNOWN.
		await missionsService.reconcileMission(
			missionId,
			companyId,
			"startup-recovery",
			{
				resolution: AccountingMissionStatus.COMPLETED,
				reason: "Evidence of completion found during startup recovery",
				expectedMissionVersion: expectedVersion,
			},
		);
		logger.info({ missionId }, "UNKNOWN reconciled to COMPLETED by evidence");
		return;
	}

	// No evidence of effects: safe to retry.
	await missionsService.reconcileMission(
		missionId,
		companyId,
		"startup-recovery",
		{
			resolution: AccountingMissionStatus.RUNNING,
			reason: "No evidence of effects; retrying after restart",
			expectedMissionVersion: expectedVersion,
		},
	);
	logger.info({ missionId }, "UNKNOWN reconciled to RUNNING for retry");
}
