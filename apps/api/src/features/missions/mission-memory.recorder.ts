/**
 * Mission memory recorder — engram write hook for completed missions.
 *
 * When a mission is reconciled to COMPLETED, the recorder persists an
 * observation in the Drenyra Engram sidecar (arkelythex/drenyra-engram
 * v0.2.0): the mission's outcome becomes institutional memory, scoped to the
 * company RUC + fiscal period.
 *
 * Design rules:
 * - BEST-EFFORT: recording memory must never break the mission flow. The
 *   caller (MissionsService) catches and logs recorder failures.
 * - FAIL CLOSED on the flag: when DRENYRA_ENGRAM_ENABLED is not explicitly
 *   true, the factory returns a Noop recorder — nothing touches the sidecar.
 * - SCOPE-FIRST: the observation is company-scoped via the 11-digit RUC with
 *   the exact fiscal period (normalized YYYY-MM → YYYYMM); structural
 *   isolation, never cross-company data.
 * - NON-AUTHORIZING: the recorder only records what happened; it never
 *   approves or authorizes anything ("recordar no significa autorizar").
 *
 * No monetary fields exist in this module; Drenyra money values are BigInt
 * cents (repo-wide rule) and nothing here touches them.
 *
 * @module missions/mission-memory-recorder
 */

import {
	EngramClient,
	type EngramSaveInput,
	engramConfig,
	isEngramEnabled,
} from "@drenyra/memory";
import {
	resolveCompanyRuc,
	tryResolveOrganizationIdFromCompany,
} from "@drenyra/persistence/repositories/support/organization-resolver";

/** Input to record a completed mission as an engram observation. */
export interface MissionCompletionInput {
	missionId: string;
	companyId: string;
	intent: string;
	/** Fiscal period as stored on the mission (YYYY-MM); normalized to YYYYMM. */
	fiscalPeriod: string;
	/** Reconciliation reason (why the mission reached COMPLETED). */
	reason: string;
	/** Actor who reconciled the mission; "system" for automated paths. */
	actorId: string;
}

/**
 * MissionMemoryRecorder — the injectable write hook for mission outcomes.
 * Implementations must be best-effort and never throw into the mission flow
 * (the caller owns error handling).
 */
export interface MissionMemoryRecorder {
	recordCompletion(input: MissionCompletionInput): Promise<void>;
}

/**
 * Noop recorder — used when the engram adapter is disabled. Safe default:
 * nothing touches the sidecar, the mission flow is untouched.
 */
export class NoopMissionMemoryRecorder implements MissionMemoryRecorder {
	async recordCompletion(): Promise<void> {
		// Intentionally empty: engram is disabled (fail closed).
	}
}

/**
 * Engram-backed recorder. Records a `mission_result` observation scoped to
 * the company RUC + fiscal period when a mission completes.
 */
export class EngramMissionMemoryRecorder implements MissionMemoryRecorder {
	private readonly client: EngramClient;

	constructor(client: EngramClient) {
		this.client = client;
	}

	async recordCompletion(input: MissionCompletionInput): Promise<void> {
		const ruc = await resolveCompanyRuc(input.companyId);
		const period = normalizeEngramPeriod(input.fiscalPeriod);
		const organizationId = await tryResolveOrganizationIdFromCompany(
			input.companyId,
		);

		const saveInput: EngramSaveInput = {
			topicKey: `mission/${input.missionId}`,
			title: `Mission ${input.missionId} completed`,
			type: "mission_result",
			scope: {
				kind: "company",
				organizationId:
					organizationId === null ? "api" : String(organizationId),
				companyId: ruc,
				ruc,
				period,
			},
			content: {
				what: `Mission ${input.missionId} (${input.intent}) completed for RUC ${ruc}`,
				why: input.reason || "mission reconciled to COMPLETED",
				where: "apps/api features/missions",
				learned: `Completed via reconcile by ${input.actorId || "system"}`,
			},
			provenance: {
				actor: input.actorId || "system",
				timestamp: new Date().toISOString(),
				source: "api",
				session: input.missionId,
			},
		};

		await this.client.save(saveInput);
	}
}

/**
 * Factory: returns the Engram recorder when the adapter is enabled, the Noop
 * recorder otherwise (fail closed). The client is created lazily on first use
 * so a disabled environment never touches the sidecar.
 */
let cachedClient: EngramClient | null = null;

export function createMissionMemoryRecorder(): MissionMemoryRecorder {
	if (!isEngramEnabled()) {
		return new NoopMissionMemoryRecorder();
	}
	if (cachedClient === null) {
		cachedClient = new EngramClient(engramConfig());
	}
	return new EngramMissionMemoryRecorder(cachedClient);
}

/**
 * Normalize a mission fiscal period to the engram YYYYMM grammar.
 * Accepts "YYYY-MM" (mission storage shape) and "YYYYMM" (pass-through).
 * Anything else fails closed with INVALID_PERIOD — the recorder must never
 * write a malformed scope.
 */
export function normalizeEngramPeriod(fiscalPeriod: string): string {
	const compact = fiscalPeriod.replace("-", "");
	if (/^\d{6}$/.test(compact)) {
		return compact;
	}
	throw new Error(
		`INVALID_PERIOD: expected YYYY-MM or YYYYMM, got "${fiscalPeriod}"`,
	);
}
