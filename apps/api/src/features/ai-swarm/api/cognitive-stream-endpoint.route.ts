/**
 * Cognitive Stream — Streaming handler.
 * Extracted from cognitive-stream.route.ts to reduce file size.
 */
import { randomUUID } from "node:crypto";
import { getOpenRouterModelForTier } from "@drenyra/ai/model-registry";
import { OpenRouterService } from "@drenyra/infrastructure/ai/openrouter";
import {
	getOpenRouterTools,
	streamWithToolExecution,
} from "@drenyra/infrastructure/ai/tool-bridge";
import { Elysia } from "elysia";
import { logSecurityAccess } from "../../security/access-log.service";
import { guardDestructivePrompt } from "../../security/destructive-action-guard";
import { authorizeOperation } from "../../security/rbac-guard";
import { enqueueSwarmAuditLog } from "./audit-log-bridge";
import { cognitiveApprovalPersistence } from "./cognitive-approval.persistence";
import { cognitiveApprovalStore } from "./cognitive-approval.store";
import { createApprovalPairing } from "./cognitive-approval-pairing";
import { ARKELYTHEX_SYSTEM_PROMPT } from "./cognitive-stream.constants";
import { CognitiveStreamRequestSchema } from "./schemas/cognitive-stream.schema";

function readHeader(headers: Record<string, unknown>, key: string): string {
	const direct = headers[key];
	if (typeof direct === "string" && direct.trim()) return direct.trim();
	const lower = headers[key.toLowerCase()];
	if (typeof lower === "string" && lower.trim()) return lower.trim();
	return "";
}

function parseOrganizationId(value: string): number | null {
	const parsed = Number.parseInt(value, 10);
	return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

export const cognitiveStreamEndpoint = new Elysia({
	name: "cognitive-stream",
}).post(
	"/cognitive-stream",
	async ({ body, set, headers }) => {
		const {
			companyId,
			messages,
			modelTier = "fast",
			tools = true,
			runId: requestedRunId,
		} = body;

		const authz = await authorizeOperation({
			headers: headers as Record<string, unknown>,
			operation: "cognitive:stream",
			resource: "/api/ai-swarm/cognitive-stream",
			requestedCompanyId: companyId,
		});
		if (!authz.ok) {
			set.status = authz.status;
			return { success: false, error: authz.error, code: authz.code };
		}

		const runId = requestedRunId?.trim() || randomUUID();
		const isResume = Boolean(requestedRunId?.trim());
		const overrideEnabled =
			readHeader(headers as Record<string, unknown>, "x-admin-override") ===
			"true";

		const destructiveGuard = guardDestructivePrompt(
			messages,
			authz.actor.role,
			overrideEnabled,
		);
		if (!destructiveGuard.allowed) {
			await logSecurityAccess({
				action: "cognitive:stream",
				resource: "/api/ai-swarm/cognitive-stream",
				result: "DENY",
				userId: authz.actor.authUserId,
				ipAddress: readHeader(
					headers as Record<string, unknown>,
					"x-forwarded-for",
				),
				userAgent: readHeader(headers as Record<string, unknown>, "user-agent"),
				details: {
					reason: destructiveGuard.reason,
					code: destructiveGuard.code,
					blockedKeyword: destructiveGuard.blockedKeyword,
				},
			});

			set.status = 403;
			return {
				success: false,
				error: destructiveGuard.reason,
				code: destructiveGuard.code,
				requiresAdminOverride: destructiveGuard.requiresAdminOverride,
				blockedKeyword: destructiveGuard.blockedKeyword,
			};
		}

		if (!process.env.OPENROUTER_API_KEY?.trim()) {
			set.status = 400;
			return {
				success: false,
				error: "OPENROUTER_API_KEY no está configurada",
			};
		}

		const openrouter = new OpenRouterService({
			apiKey: process.env.OPENROUTER_API_KEY!,
			budgetLimit: parseFloat(process.env.OPENROUTER_BUDGET || "1000"),
			enableAutoRouting: true,
		});

		const model = getOpenRouterModelForTier(modelTier);
		const approvalTimeoutMs = parseInt(
			process.env.COGNITIVE_APPROVAL_TIMEOUT_MS || "120000",
			10,
		);
		const requirePairingForCriticalApprovals =
			(
				process.env.COGNITIVE_APPROVAL_REQUIRE_PAIRING || "true"
			).toLowerCase() !== "false";

		const stream = new ReadableStream({
			async start(controller) {
				const encoder = new TextEncoder();
				const emit = (event: string, data: unknown) => {
					controller.enqueue(
						encoder.encode(
							`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`,
						),
					);
				};

				try {
					emit("run_started", {
						runId,
						model,
						modelTier,
						resumed: isResume,
						timestamp: new Date().toISOString(),
					});

					const messagesWithSystem =
						messages[0]?.role === "system"
							? messages
							: [
									{
										role: "system" as const,
										content: ARKELYTHEX_SYSTEM_PROMPT,
									},
									...messages,
								];

					const request = {
						model,
						messages: messagesWithSystem,
						tools: tools ? getOpenRouterTools() : undefined,
						temperature: 0.4,
					};

					for await (const event of streamWithToolExecution(
						openrouter,
						request,
						{
							maxToolIterations: 5,
							approvalHandler: async (approval) => {
								const requestedAt = new Date().toISOString();
								const expiresAt = new Date(
									Date.now() + approvalTimeoutMs,
								).toISOString();
								const pairing = requirePairingForCriticalApprovals
									? createApprovalPairing(runId, approval.toolCallId)
									: null;

								if (pairing) {
									emit("approval_required", {
										runId,
										name: approval.name,
										args: approval.args,
										toolCallId: approval.toolCallId,
										pairingRequired: true,
										pairingSessionId: pairing.metadata.sessionId,
										pairingHint: pairing.metadata.hint,
										pairingChallenge: pairing.metadata.challenge,
										pairingCode: pairing.code,
									});
								}

								await cognitiveApprovalPersistence.createPending({
									runId,
									toolCallId: approval.toolCallId,
									name: approval.name,
									args: approval.args,
									pairing: pairing?.metadata ?? null,
									requestedAt,
									expiresAt,
								});

								const decision = await cognitiveApprovalStore.createAndWait(
									{
										runId,
										toolCallId: approval.toolCallId,
										name: approval.name,
										args: approval.args,
										requestedAt,
										pairingRequired: pairing?.metadata.required ?? false,
										pairingSessionId: pairing?.metadata.sessionId,
										pairingHint: pairing?.metadata.hint,
										pairingChallenge: pairing?.metadata.challenge,
										pairingCodeHash: pairing?.metadata.codeHash,
									},
									approvalTimeoutMs,
								);

								if (decision.resolution === "timeout") {
									await cognitiveApprovalPersistence.markExpired(
										runId,
										approval.toolCallId,
									);
									enqueueSwarmAuditLog({
										organizationId: parseOrganizationId(companyId),
										agentName: "cognitive_approval_gate",
										agentVersion: "2026.02",
										decisionType: "approval_timeout",
										reasoning:
											"Timeout waiting for human decision on critical tool",
										inputs: {
											traceId: runId,
											runId,
											toolCallId: approval.toolCallId,
											toolName: approval.name,
											timeoutMs: approvalTimeoutMs,
										},
										outputs: { resolution: "timeout" },
									});
								}

								return decision.approved;
							},
						},
					)) {
						emit(event.type, { runId, ...event });
					}

					controller.close();
				} catch (error: unknown) {
					emit("error", {
						runId,
						message: error instanceof Error ? error.message : String(error),
					});
					controller.close();
				} finally {
					cognitiveApprovalStore.clearRun(runId);
				}
			},
		});

		set.headers["Content-Type"] = "text/event-stream";
		set.headers["Cache-Control"] = "no-cache";
		set.headers.Connection = "keep-alive";
		set.headers["X-Accel-Buffering"] = "no";

		return new Response(stream);
	},
	{ body: CognitiveStreamRequestSchema },
);
