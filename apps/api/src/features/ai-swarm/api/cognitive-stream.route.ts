/**
 * Cognitive Stream Route - Free-form AI chat with tool calling
 *
 * Separate from agent-stream (which handles Mastra workflows).
 * This handles Cognitive Hub interactions with streaming tokens + tool execution.
 *
 * @since Feb 2026
 * Split from 569 lines → 4 modules (constants, schemas, streaming endpoint, routes)
 */

import { Elysia } from "elysia";
import { authorizeOperation } from "../../security/rbac-guard";
import { enqueueSwarmAuditLog } from "./audit-log-bridge";
import { cognitiveApprovalPersistence } from "./cognitive-approval.persistence";
import { cognitiveApprovalStore } from "./cognitive-approval.store";
import { cognitiveStreamEndpoint } from "./cognitive-stream-endpoint.route";
import { cognitiveStreamRecoveryEndpoint } from "./cognitive-stream-recovery.route";
import {
	CognitiveApprovalDecisionSchema,
	CognitiveRunStateParamsSchema,
	CognitiveRunStateQuerySchema,
} from "./schemas/cognitive-stream.schema";

function parseOrganizationId(value: string): number | null {
	const parsed = Number.parseInt(value, 10);
	return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

/**
 * Cognitive Stream routes — mount point only.
 * Delegates streaming to cognitive-stream-endpoint.route.ts.
 */
export const cognitiveStreamRoute = new Elysia({ prefix: "/api/ai-swarm" })
	.get(
		"/cognitive-stream/runs/:runId/state",
		async ({ params, query, headers, set }) => {
			const authz = await authorizeOperation({
				headers: headers as Record<string, unknown>,
				operation: "cognitive:state:read",
				resource: "/api/ai-swarm/cognitive-stream/runs/:runId/state",
				requestedCompanyId: query.companyId,
			});
			if (!authz.ok) {
				set.status = authz.status;
				return { success: false, error: authz.error, code: authz.code };
			}

			const state = await cognitiveApprovalPersistence.getRunState(
				params.runId,
			);
			return { success: true, data: state };
		},
		{
			params: CognitiveRunStateParamsSchema,
			query: CognitiveRunStateQuerySchema,
		},
	)
	.use(cognitiveStreamEndpoint)
	.use(cognitiveStreamRecoveryEndpoint)
	.post(
		"/cognitive-stream/approval",
		async ({ body, set, headers }) => {
			const authz = await authorizeOperation({
				headers: headers as Record<string, unknown>,
				operation: "cognitive:approval:resolve",
				resource: "/api/ai-swarm/cognitive-stream/approval",
				requestedCompanyId: body.companyId,
			});
			if (!authz.ok) {
				set.status = authz.status;
				return { success: false, error: authz.error, code: authz.code };
			}

			const liveResolution = cognitiveApprovalStore.resolve(
				body.runId,
				body.toolCallId,
				body.approved,
				{
					pairingCode: body.pairingCode,
				},
			);
			const deliveredToLiveStream = liveResolution.ok;

			const persistedDecision =
				await cognitiveApprovalPersistence.resolveDecision({
					runId: body.runId,
					toolCallId: body.toolCallId,
					approved: body.approved,
					pairingCode: body.pairingCode,
					reason: body.reason,
					decidedBy: body.decidedBy ?? authz.actor.authUserId,
				});

			const pairingFailure =
				liveResolution.code === "pairing_required" ||
				persistedDecision.failureCode === "PAIRING_REQUIRED"
					? "PAIRING_REQUIRED"
					: liveResolution.code === "pairing_invalid" ||
							persistedDecision.failureCode === "PAIRING_INVALID"
						? "PAIRING_INVALID"
						: null;

			if (pairingFailure === "PAIRING_REQUIRED") {
				set.status = 400;
				return {
					success: false,
					error:
						"Se requiere código de pairing para aprobar esta herramienta crítica",
					code: "PAIRING_REQUIRED",
				};
			}

			if (pairingFailure === "PAIRING_INVALID") {
				set.status = 403;
				return {
					success: false,
					error: "El código de pairing no es válido para esta aprobación",
					code: "PAIRING_INVALID",
				};
			}

			if (!persistedDecision.found && !deliveredToLiveStream) {
				set.status = 404;
				return {
					success: false,
					error:
						"No se encontró una aprobación pendiente para runId/toolCallId",
				};
			}

			if (!persistedDecision.updated && !deliveredToLiveStream) {
				set.status = 409;
				return {
					success: false,
					error: "La aprobación ya fue resuelta o no está pendiente",
					code: "APPROVAL_NOT_PENDING",
				};
			}

			enqueueSwarmAuditLog({
				organizationId: parseOrganizationId(body.companyId),
				agentName: "cognitive_approval_gate",
				agentVersion: "2026.02",
				decisionType: body.approved ? "approval_granted" : "approval_rejected",
				reasoning: body.reason?.trim() || undefined,
				inputs: {
					traceId: body.runId,
					runId: body.runId,
					toolCallId: body.toolCallId,
					pairingRequired: Boolean(persistedDecision.record?.pairingRequired),
					resolvedBy: body.decidedBy ?? authz.actor.authUserId,
				},
				outputs: {
					approved: body.approved,
					persisted: persistedDecision.updated,
					deliveredToLiveStream,
					argsHash: persistedDecision.record?.argsHash ?? null,
					status:
						persistedDecision.record?.status ??
						(body.approved ? "approved" : "rejected"),
				},
			});

			return {
				success: true,
				data: {
					runId: body.runId,
					toolCallId: body.toolCallId,
					approved: body.approved,
					deliveredToLiveStream,
					liveResolution: liveResolution.code,
					persisted: persistedDecision.updated,
				},
			};
		},
		{ body: CognitiveApprovalDecisionSchema },
	);
