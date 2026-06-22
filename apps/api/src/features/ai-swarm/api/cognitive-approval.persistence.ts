import { sql } from "drizzle-orm";
import { logger } from "../../../lib/logger";
import {
	decryptJsonValue,
	encryptJsonValue,
} from "../../security/aes-256.service";
import type { ApprovalPairingMetadata } from "./cognitive-approval-pairing";
import { verifyApprovalPairingCode } from "./cognitive-approval-pairing";
import {
	decodeApprovalPayload,
	encodeApprovalPayload,
} from "./cognitive-approval-payload";

type ApprovalStatus = "pending" | "approved" | "rejected" | "expired";

interface DbLike {
	execute<T>(query: ReturnType<typeof sql>): Promise<T[]>;
}

interface ApprovalRow {
	id: string;
	run_id: string;
	tool_call_id: string;
	tool_name: string;
	tool_args: unknown;
	status: ApprovalStatus;
	decision_reason: string | null;
	decided_by: string | null;
	requested_at: string | Date;
	decided_at: string | Date | null;
	expires_at: string | Date | null;
}

/**
 * ApprovalRecord interface.
 *
 * @example
 * ```ts
 * const value: ApprovalRecord = {} as ApprovalRecord;
 * console.log(value);
 * ```
 */
export interface ApprovalRecord {
	id: string;
	runId: string;
	toolCallId: string;
	name: string;
	args: unknown;
	argsHash?: string | null;
	pairingRequired: boolean;
	pairingSessionId: string | null;
	pairingHint: string | null;
	pairingChallenge: string | null;
	status: ApprovalStatus;
	decisionReason: string | null;
	decidedBy: string | null;
	requestedAt: string;
	decidedAt: string | null;
	expiresAt: string | null;
}

/**
 * ApprovalRunState interface.
 *
 * @example
 * ```ts
 * const value: ApprovalRunState = {} as ApprovalRunState;
 * console.log(value);
 * ```
 */
export interface ApprovalRunState {
	runId: string;
	pendingApprovals: ApprovalRecord[];
	recentDecisions: ApprovalRecord[];
}

interface CreatePendingInput {
	runId: string;
	toolCallId: string;
	name: string;
	args: unknown;
	pairing: ApprovalPairingMetadata | null;
	requestedAt: string;
	expiresAt: string;
}

interface ResolveDecisionInput {
	runId: string;
	toolCallId: string;
	approved: boolean;
	pairingCode?: string;
	reason?: string;
	decidedBy?: string;
}

interface ResolveDecisionResult {
	found: boolean;
	updated: boolean;
	record: ApprovalRecord | null;
	failureCode?: "PAIRING_REQUIRED" | "PAIRING_INVALID" | "NOT_PENDING";
}

function ulid(): string {
	return `${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).slice(2, 10).toUpperCase()}`;
}

function toIso(value: string | Date | null): string | null {
	if (!value) return null;
	if (value instanceof Date) return value.toISOString();
	return value;
}

function toRecord(row: ApprovalRow): ApprovalRecord {
	const raw = decryptJsonValue(row.tool_args, {
		runId: row.run_id,
		toolCallId: row.tool_call_id,
	});
	const decoded = decodeApprovalPayload(raw);
	const pairing = decoded.pairing;

	return {
		id: row.id,
		runId: row.run_id,
		toolCallId: row.tool_call_id,
		name: row.tool_name,
		args: decoded.args,
		argsHash: decoded.argsHash,
		pairingRequired: pairing?.required === true,
		pairingSessionId: pairing?.sessionId ?? null,
		pairingHint: pairing?.hint ?? null,
		pairingChallenge: pairing?.challenge ?? null,
		status: row.status,
		decisionReason: row.decision_reason,
		decidedBy: row.decided_by,
		requestedAt: toIso(row.requested_at) ?? new Date().toISOString(),
		decidedAt: toIso(row.decided_at),
		expiresAt: toIso(row.expires_at),
	};
}

let dbPromise: Promise<DbLike | null> | null = null;
let dbUnavailableLogged = false;
let persistenceDisabled = false;
let persistenceDisabledLogged = false;

async function getDb(): Promise<DbLike | null> {
	if (!dbPromise) {
		dbPromise = import("@arkelythex/persistence/client")
			.then((module) => module.db as unknown as DbLike)
			.catch((error) => {
				if (!dbUnavailableLogged) {
					dbUnavailableLogged = true;
					logger.warn(
						{ error: error instanceof Error ? error.message : String(error) },
						"Cognitive approval DB persistence disabled",
					);
				}
				return null;
			});
	}

	return dbPromise;
}

async function withDb<T>(
	operation: (db: DbLike) => Promise<T>,
	fallback: T,
): Promise<T> {
	if (persistenceDisabled) return fallback;

	const db = await getDb();
	if (!db) return fallback;

	try {
		return await operation(db);
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		if (
			message.includes("cognitive_tool_approvals") &&
			(message.includes("does not exist") || message.includes("Failed query"))
		) {
			persistenceDisabled = true;
			if (!persistenceDisabledLogged) {
				persistenceDisabledLogged = true;
				logger.warn(
					{ error: message },
					"Cognitive approval persistence auto-disabled (table not available)",
				);
			}
			return fallback;
		}

		logger.warn(
			{ error: message },
			"Cognitive approval persistence operation failed",
		);
		return fallback;
	}
}

/**
 * cognitiveApprovalPersistence const.
 *
 * @example
 * ```ts
 * console.log(cognitiveApprovalPersistence);
 * ```
 */
export const cognitiveApprovalPersistence = {
	async createPending(input: CreatePendingInput): Promise<void> {
		const protectedPayload = encryptJsonValue(
			encodeApprovalPayload(input.args, input.pairing),
			{
				runId: input.runId,
				toolCallId: input.toolCallId,
			},
		);

		await withDb(async (db) => {
			await db.execute(sql`
          INSERT INTO cognitive_tool_approvals (
            id,
            run_id,
            tool_call_id,
            tool_name,
            tool_args,
            status,
            requested_at,
            expires_at
          ) VALUES (
            ${ulid()},
            ${input.runId},
            ${input.toolCallId},
            ${input.name},
            ${JSON.stringify(protectedPayload)}::jsonb,
            'pending',
            ${input.requestedAt}::timestamptz,
            ${input.expiresAt}::timestamptz
          )
          ON CONFLICT (run_id, tool_call_id) DO UPDATE SET
            tool_name = EXCLUDED.tool_name,
            tool_args = EXCLUDED.tool_args,
            status = 'pending',
            decision_reason = NULL,
            decided_by = NULL,
            decided_at = NULL,
            requested_at = EXCLUDED.requested_at,
            expires_at = EXCLUDED.expires_at
        `);
		}, undefined);
	},

	async resolveDecision(
		input: ResolveDecisionInput,
	): Promise<ResolveDecisionResult> {
		return withDb(
			async (db) => {
				const [existingRow] = await db.execute<ApprovalRow>(sql`
          SELECT *
          FROM cognitive_tool_approvals
          WHERE run_id = ${input.runId}
            AND tool_call_id = ${input.toolCallId}
          ORDER BY requested_at DESC
          LIMIT 1
        `);

				if (!existingRow) {
					return {
						found: false,
						updated: false,
						record: null,
					};
				}

				const existingRecord = toRecord(existingRow);
				const persistedPayload = decodeApprovalPayload(
					decryptJsonValue(existingRow.tool_args, {
						runId: existingRow.run_id,
						toolCallId: existingRow.tool_call_id,
					}),
				);
				const persistedPairing = persistedPayload.pairing;

				if (existingRecord.status !== "pending") {
					return {
						found: true,
						updated: false,
						record: existingRecord,
						failureCode: "NOT_PENDING",
					};
				}

				if (input.approved && existingRecord.pairingRequired) {
					if (
						!input.pairingCode?.trim() ||
						!existingRecord.pairingSessionId ||
						!persistedPairing?.codeHash
					) {
						return {
							found: true,
							updated: false,
							record: existingRecord,
							failureCode: "PAIRING_REQUIRED",
						};
					}

					const pairingValid = verifyApprovalPairingCode(
						input.pairingCode.trim(),
						{
							codeHash: persistedPairing.codeHash,
							sessionId: existingRecord.pairingSessionId,
						},
						{
							runId: input.runId,
							toolCallId: input.toolCallId,
						},
					);

					if (!pairingValid) {
						return {
							found: true,
							updated: false,
							record: existingRecord,
							failureCode: "PAIRING_INVALID",
						};
					}
				}

				const status: ApprovalStatus = input.approved ? "approved" : "rejected";
				const [updatedRow] = await db.execute<ApprovalRow>(sql`
          UPDATE cognitive_tool_approvals
          SET
            status = ${status},
            decision_reason = ${input.reason ?? null},
            decided_by = ${input.decidedBy ?? "human_operator"},
            decided_at = NOW()
          WHERE id = ${existingRow.id}
            AND status = 'pending'
          RETURNING *
        `);

				if (updatedRow) {
					return {
						found: true,
						updated: true,
						record: toRecord(updatedRow),
					};
				}

				return {
					found: true,
					updated: false,
					record: existingRecord,
					failureCode: "NOT_PENDING",
				};
			},
			{
				found: false,
				updated: false,
				record: null,
			},
		);
	},

	async markExpired(runId: string, toolCallId: string): Promise<void> {
		await withDb(async (db) => {
			await db.execute(sql`
          UPDATE cognitive_tool_approvals
          SET
            status = 'expired',
            decision_reason = COALESCE(decision_reason, 'Approval timeout'),
            decided_by = COALESCE(decided_by, 'system_timeout'),
            decided_at = NOW()
          WHERE run_id = ${runId}
            AND tool_call_id = ${toolCallId}
            AND status = 'pending'
        `);
		}, undefined);
	},

	async getRunState(runId: string): Promise<ApprovalRunState> {
		return withDb(
			async (db) => {
				const pendingRows = await db.execute<ApprovalRow>(sql`
          SELECT *
          FROM cognitive_tool_approvals
          WHERE run_id = ${runId}
            AND status = 'pending'
          ORDER BY requested_at DESC
        `);

				const recentRows = await db.execute<ApprovalRow>(sql`
          SELECT *
          FROM cognitive_tool_approvals
          WHERE run_id = ${runId}
            AND status <> 'pending'
          ORDER BY decided_at DESC NULLS LAST
          LIMIT 20
        `);

				return {
					runId,
					pendingApprovals: pendingRows.map(toRecord),
					recentDecisions: recentRows.map(toRecord),
				};
			},
			{
				runId,
				pendingApprovals: [],
				recentDecisions: [],
			},
		);
	},
};
