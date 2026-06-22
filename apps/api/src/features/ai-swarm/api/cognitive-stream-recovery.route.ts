/**
 * Cognitive Stream Recovery Endpoint
 *
 * POST /cognitive-stream/runs/:runId/recover
 * Recovers a failed or degraded agent run and triggers resumption.
 *
 * @module ai-swarm/api/cognitive-stream-recovery
 */

import { Elysia } from "elysia";
import type { SecurityOperation } from "../../security/rbac-policy";
import { authorizeOperation } from "../../security/rbac-guard";
import { logger } from "../../../lib/logger";
import {
	RecoverRunParamsSchema,
	RecoverRunBodySchema,
} from "./schemas/cognitive-stream.schema";

/**
 * Recovery endpoint — mounted via .use() inside cognitive-stream.route.ts
 * so the effective path becomes /api/ai-swarm/cognitive-stream/runs/:runId/recover.
 */
export const cognitiveStreamRecoveryEndpoint = new Elysia({
	name: "cognitive-stream-recovery",
}).post(
	"/cognitive-stream/runs/:runId/recover",
	async ({ params, body, set, headers }) => {
		const { runId } = params;
		const { inputData, inputType } = body;

		// ------------------------------------------------------------------
		// 0. Bootstrap DB client for company lookup
		// ------------------------------------------------------------------
		const { db } = await import("@arkelythex/persistence/client");
		const { agentRunStates } = await import(
			"@arkelythex/persistence/schema"
		);
		const { eq } = await import("@arkelythex/persistence/query");

		// Look up the run's companyId for tenant-scoped authorization
		const runState = await db
			.select({ companyId: agentRunStates.companyId })
			.from(agentRunStates)
			.where(eq(agentRunStates.runId, runId))
			.limit(1)
			.then((rows) => rows[0] ?? null);

		// ------------------------------------------------------------------
		// 1. Authorize operation with tenant scoping
		// ------------------------------------------------------------------
		const authz = await authorizeOperation({
			headers: headers as Record<string, unknown>,
			operation: "cognitive:recover" as SecurityOperation,
			resource: "/api/ai-swarm/cognitive-stream/runs/:runId/recover",
			requestedCompanyId: runState?.companyId,
		});
		if (!authz.ok) {
			set.status = authz.status;
			return { success: false, error: authz.error, code: authz.code };
		}

		// ------------------------------------------------------------------
		// 2. Bootstrap session store + recovery
		// ------------------------------------------------------------------
		let sessionStore: import("@arkelythex/ai/session").SessionStore;
		try {
			const { PostgresSessionStore } = await import(
				"@arkelythex/ai/session"
			);
			sessionStore = new PostgresSessionStore(db);
		} catch (_err) {
			set.status = 503;
			return {
				success: false,
				error: "Session store unavailable — cannot recover run",
				code: "SESSION_STORE_UNAVAILABLE",
			};
		}

		const { SessionRecovery, SessionRecoveryError } = await import(
			"@arkelythex/ai/session"
		);
		const recovery = new SessionRecovery(sessionStore);

		// ------------------------------------------------------------------
		// 3. Check recoverability
		// ------------------------------------------------------------------
		const check = await recovery.checkRecoverable(runId);
		if (!check.recoverable) {
			switch (check.reason) {
				case "not_found":
					set.status = 404;
					return {
						success: false,
						error: `Run state not found: ${runId}`,
						code: "NOT_FOUND",
					};
				case "still_running":
					set.status = 409;
					return {
						success: false,
						error: `Run ${runId} is still running and cannot be recovered`,
						code: "STILL_RUNNING",
					};
				case "already_completed":
					set.status = 409;
					return {
						success: false,
						error: `Run ${runId} already completed and cannot be recovered`,
						code: "ALREADY_COMPLETED",
					};
				default:
					set.status = 400;
					return {
						success: false,
						error: check.reason ?? `Run ${runId} is not recoverable`,
						code: "NOT_RECOVERABLE",
					};
			}
		}

		// ------------------------------------------------------------------
		// 4. Perform recovery (verifies checksum, appends RECOVERY_STARTED event)
		// ------------------------------------------------------------------
		try {
			const recovered = await recovery.recover(runId, inputData, inputType);

			// Attempt to fetch stored input for potential orchestrator resumption
			let storedInput: import("@arkelythex/ai/session").RunInput | null = null;
			try {
				storedInput = await sessionStore.getInput(runId);
			} catch {
				// Non-blocking — recovery context is still valid without input
				logger.warn({ runId }, "Recovery: unable to fetch stored input for orchestrator");
			}

			// Recovery context includes the last completed phase so the caller
			// can skip completed phases on resumption.
			// NOTE: Full orchestrator resumption (processInvoice with recovered
			// runId) will be wired when Phase 3.3 (recoverRun) lands.

			return {
				success: true,
				data: {
					runId,
					status: "recovering",
					recoveryContext: {
						lastCompletedPhase: recovered.context.lastCompletedPhase,
						previousWorkflowState: recovered.context.previousWorkflowState,
						previousStatus: recovered.context.previousStatus,
						skippedPhases: recovered.context.skippedPhases,
					},
					storedInputAvailable: storedInput !== null,
				},
			};
		} catch (_err) {
			if (_err instanceof SessionRecoveryError) {
				switch (_err.code) {
					case "checksum_mismatch":
						set.status = 409;
						return {
							success: false,
							error: _err.message,
							code: "CHECKSUM_MISMATCH",
						};
					case "no_input_data":
						set.status = 400;
						return {
							success: false,
							error: _err.message,
							code: "NO_INPUT_DATA",
						};
					default:
						set.status = 500;
						return {
							success: false,
							error: _err.message,
							code: "RECOVERY_FAILED",
						};
				}
			}
			set.status = 500;
			return {
				success: false,
				error: _err instanceof Error ? _err.message : String(_err),
				code: "INTERNAL_ERROR",
			};
		}
	},
	{
		params: RecoverRunParamsSchema,
		body: RecoverRunBodySchema,
	},
);
