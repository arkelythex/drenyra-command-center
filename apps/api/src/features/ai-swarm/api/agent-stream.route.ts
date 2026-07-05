/**
 * Agent Stream API Route
 *
 * GET /agent-stream endpoint (SSE)
 *
 * @module ai-swarm/api/agent-stream
 */

import { randomUUID } from "node:crypto";
import { Elysia } from "elysia";
import { createLogger } from "../../../lib/logger";
import { fail } from "../../shared/api-response";
import { triggerWorkflowConsensusAlert } from "../alerts/workflow-alert-trigger";
import {
	DEFAULT_MASTRA_INVOICE_INPUT,
	type MastraInvoiceWorkflowInput,
	type MastraInvoiceWorkflowOutput,
	mapWorkflowStepToAgent,
	mastraInvoiceProcessingWorkflow,
} from "../workflows/mastra-invoice-processing.workflow";
import { enqueueSwarmAuditLog } from "./audit-log-bridge";
import { resolveOrganizationContextForRequest } from "./organization-context";
import {
	AGENT_LABELS,
	AGENT_MESSAGES,
	type AgentRuntimeStatus,
	AgentStreamQuerySchema,
} from "./schemas/agent-stream.schema";

const logger = createLogger({ module: "ai-swarm/agent-stream" });

function toSafeNumber(value: string | undefined): number | undefined {
	if (typeof value !== "string" || value.trim() === "") return undefined;
	const parsed = Number(value);
	return Number.isFinite(parsed) ? parsed : undefined;
}

function toSseChunk(event: string, payload: unknown): string {
	return `event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`;
}

function buildStreamInput(
	query: {
		documentId?: string;
		filename?: string;
		mimeType?: string;
		ruc?: string;
		serie?: string;
		numero?: string;
		fecha?: string;
		moneda?: "PEN" | "USD" | "EUR";
		subtotal?: string;
		igv?: string;
		total?: string;
	},
	generatedDocumentId: string,
): MastraInvoiceWorkflowInput {
	return {
		...DEFAULT_MASTRA_INVOICE_INPUT,
		documentId: query.documentId ?? generatedDocumentId,
		filename: query.filename ?? DEFAULT_MASTRA_INVOICE_INPUT.filename,
		mimeType: query.mimeType ?? DEFAULT_MASTRA_INVOICE_INPUT.mimeType,
		ruc: query.ruc ?? DEFAULT_MASTRA_INVOICE_INPUT.ruc,
		serie: query.serie ?? DEFAULT_MASTRA_INVOICE_INPUT.serie,
		numero: query.numero ?? DEFAULT_MASTRA_INVOICE_INPUT.numero,
		fecha: query.fecha ?? DEFAULT_MASTRA_INVOICE_INPUT.fecha,
		moneda: query.moneda ?? DEFAULT_MASTRA_INVOICE_INPUT.moneda,
		subtotal:
			toSafeNumber(query.subtotal) ?? DEFAULT_MASTRA_INVOICE_INPUT.subtotal,
		igv: toSafeNumber(query.igv) ?? DEFAULT_MASTRA_INVOICE_INPUT.igv,
		total: toSafeNumber(query.total) ?? DEFAULT_MASTRA_INVOICE_INPUT.total,
	};
}

function mapStepStatusToRuntimeStatus(status: string): AgentRuntimeStatus {
	if (status === "success") return "completed";
	return "failed";
}

/**
 * AI Swarm routes
 * @example
 * ```ts
 * console.log(aiSwarmRoutes);
 * ```
 */

export const agentStreamRoute = new Elysia({ prefix: "/api/ai-swarm" })
	/**
	 * GET /api/ai-swarm/agent-stream
	 *
	 * Streams real-time state from Mastra workflow (Lector -> Validador -> Arbitro)
	 */
	.get(
		"/agent-stream",
		async ({ query, request }) => {
			const encoder = new TextEncoder();
			const generatedDocumentId = `DOC-${randomUUID().slice(0, 8)}`;
			const streamInput = buildStreamInput(query, generatedDocumentId);
			const organizationContext = resolveOrganizationContextForRequest({
				queryOrgId: query.orgId,
				headers: request.headers,
			});

			if (!organizationContext.ok) {
				return Response.json(
					fail(organizationContext.error, organizationContext.code, {
						details: organizationContext.details,
					}),
					{ status: 400 },
				);
			}

			const organizationId = organizationContext.organizationId;

			const stream = new ReadableStream<Uint8Array>({
				async start(controller) {
					const run = await mastraInvoiceProcessingWorkflow.createRun();
					let isClosed = false;

					const emit = (event: string, payload: unknown) => {
						if (isClosed) return;
						controller.enqueue(encoder.encode(toSseChunk(event, payload)));
					};

					const close = () => {
						if (isClosed) return;
						isClosed = true;
						clearInterval(heartbeatId);
						unsubscribe();
						controller.close();
					};

					const unsubscribe = run.watch((workflowEvent) => {
						if (workflowEvent.type === "workflow-step-start") {
							const agentId = mapWorkflowStepToAgent(workflowEvent.payload.id);
							if (!agentId) return;

							emit("agent-status", {
								runId: run.runId,
								workflowId: run.workflowId,
								documentId: streamInput.documentId,
								agentId,
								agentLabel: AGENT_LABELS[agentId],
								status: "running" as AgentRuntimeStatus,
								message: AGENT_MESSAGES[agentId].start,
								timestamp: new Date().toISOString(),
							});
						}

						if (workflowEvent.type === "workflow-step-result") {
							const agentId = mapWorkflowStepToAgent(workflowEvent.payload.id);
							if (!agentId) return;

							const status = mapStepStatusToRuntimeStatus(
								workflowEvent.payload.status,
							);
							emit("agent-status", {
								runId: run.runId,
								workflowId: run.workflowId,
								documentId: streamInput.documentId,
								agentId,
								agentLabel: AGENT_LABELS[agentId],
								status,
								message:
									status === "completed"
										? AGENT_MESSAGES[agentId].complete
										: AGENT_MESSAGES[agentId].failed,
								timestamp: new Date().toISOString(),
							});

							enqueueSwarmAuditLog({
								organizationId,
								agentName: `${agentId}-agent`,
								decisionType:
									status === "completed"
										? "WORKFLOW_STEP_COMPLETED"
										: "WORKFLOW_STEP_FAILED",
								reasoning:
									status === "completed"
										? `${agentId} finalizo correctamente.`
										: `${agentId} reporto falla en workflow-step-result.`,
								inputs: {
									runId: run.runId,
									workflowId: run.workflowId,
									stepId: workflowEvent.payload.id,
									documentId: streamInput.documentId,
								},
								outputs: {
									status,
									stepStatus: workflowEvent.payload.status,
								},
							});
						}

						if (workflowEvent.type === "workflow-step-finish") {
							const agentId = mapWorkflowStepToAgent(workflowEvent.payload.id);
							if (!agentId) return;

							emit("agent-status", {
								runId: run.runId,
								workflowId: run.workflowId,
								documentId: streamInput.documentId,
								agentId,
								agentLabel: AGENT_LABELS[agentId],
								status: "completed" as AgentRuntimeStatus,
								message: AGENT_MESSAGES[agentId].complete,
								timestamp: new Date().toISOString(),
							});
						}
					});

					const heartbeatId = setInterval(() => {
						emit("heartbeat", {
							runId: run.runId,
							documentId: streamInput.documentId,
							timestamp: new Date().toISOString(),
						});
					}, 5000);

					request.signal.addEventListener("abort", close, { once: true });

					emit("workflow-start", {
						runId: run.runId,
						workflowId: run.workflowId,
						documentId: streamInput.documentId,
						filename: streamInput.filename,
						timestamp: new Date().toISOString(),
					});

					enqueueSwarmAuditLog({
						organizationId,
						agentName: "orchestrator-agent",
						decisionType: "WORKFLOW_STARTED",
						reasoning:
							"Inicio de workflow Mastra (Lector -> Validador -> Arbitro).",
						inputs: {
							runId: run.runId,
							workflowId: run.workflowId,
							documentId: streamInput.documentId,
						},
						outputs: {
							status: "started",
							filename: streamInput.filename,
						},
					});

					try {
						const workflowResult = await run.start({ inputData: streamInput });

						if (workflowResult.status === "success") {
							const result =
								workflowResult.result as MastraInvoiceWorkflowOutput;

							emit("workflow-complete", {
								runId: run.runId,
								workflowId: run.workflowId,
								documentId: streamInput.documentId,
								status: "success",
								result,
								timestamp: new Date().toISOString(),
							});

							enqueueSwarmAuditLog({
								organizationId,
								agentName: "arbitro-agent",
								decisionType: result.decision.toUpperCase(),
								reasoning: result.reason,
								inputs: {
									runId: run.runId,
									workflowId: run.workflowId,
									documentId: streamInput.documentId,
									decisionConfidence: result.confidence,
								},
								outputs: {
									decision: result.decision,
									confidence: result.confidence,
									validation: result.validation,
								},
							});

							// Await consensus alert with 2s guard before close() runs.
							// This ensures anomaly-alert is emitted while the stream is still open.
							// Any error or timeout is swallowed — alert failure must NOT block the SSE response.
							if (result.decision !== "approved") {
								if (organizationId === null) {
									emit("anomaly-alert-skipped", {
										runId: run.runId,
										documentId: streamInput.documentId,
										reason: "missing-organization-context",
										timestamp: new Date().toISOString(),
									});
								} else {
									try {
										const alertResult = await Promise.race([
											triggerWorkflowConsensusAlert(result, organizationId),
											new Promise<null>((resolve) =>
												setTimeout(() => resolve(null), 2_000),
											),
										]);
										if (alertResult?.shouldTriggerAlert) {
											emit("anomaly-alert", {
												runId: run.runId,
												documentId: streamInput.documentId,
												alertId: alertResult.alertId,
												severity: alertResult.severity,
												consensusScore: alertResult.consensusScore,
												threshold: alertResult.threshold,
												timestamp: new Date().toISOString(),
											});

											enqueueSwarmAuditLog({
												organizationId,
												agentName: "consensus-detector-agent",
												decisionType: "ANOMALY_ALERT_TRIGGERED",
												reasoning:
													"Consenso dinamico supero el umbral y genero alerta de anomalia.",
												inputs: {
													runId: run.runId,
													workflowId: run.workflowId,
													documentId: streamInput.documentId,
												},
												outputs: {
													alertId: alertResult.alertId,
													severity: alertResult.severity,
													consensusScore: alertResult.consensusScore,
													threshold: alertResult.threshold,
												},
											});
										}
									} catch (err: unknown) {
										logger.error(
											{
												error: err,
												runId: run.runId,
												workflowId: run.workflowId,
												documentId: streamInput.documentId,
											},
											"[consensus-alert] Failed to create alert",
										);
									}
								}
							}
						} else {
							emit("workflow-complete", {
								runId: run.runId,
								workflowId: run.workflowId,
								documentId: streamInput.documentId,
								status: workflowResult.status,
								error: "El workflow no finalizó en estado success.",
								timestamp: new Date().toISOString(),
							});

							enqueueSwarmAuditLog({
								organizationId,
								agentName: "orchestrator-agent",
								decisionType: "WORKFLOW_FAILED",
								reasoning: "El workflow no finalizo con status success.",
								inputs: {
									runId: run.runId,
									workflowId: run.workflowId,
									documentId: streamInput.documentId,
								},
								outputs: {
									status: workflowResult.status,
								},
							});
						}
					} catch (error) {
						emit("workflow-error", {
							runId: run.runId,
							workflowId: run.workflowId,
							documentId: streamInput.documentId,
							error:
								error instanceof Error
									? error.message
									: "Error desconocido en el stream",
							timestamp: new Date().toISOString(),
						});

						enqueueSwarmAuditLog({
							organizationId,
							agentName: "orchestrator-agent",
							decisionType: "WORKFLOW_ERROR",
							reasoning:
								error instanceof Error ? error.message : "Error desconocido",
							inputs: {
								runId: run.runId,
								workflowId: run.workflowId,
								documentId: streamInput.documentId,
							},
							outputs: {
								status: "error",
							},
						});
					} finally {
						close();
					}
				},
			});

			return new Response(stream, {
				headers: {
					"Content-Type": "text/event-stream",
					"Cache-Control": "no-cache, no-transform",
					Connection: "keep-alive",
					"X-Accel-Buffering": "no",
				},
			});
		},
		{
			query: AgentStreamQuerySchema,
			detail: {
				summary: "Agent status stream (SSE)",
				description: `
Emite eventos en tiempo real del workflow Mastra:
- workflow-start
- agent-status
- heartbeat
- workflow-complete
- workflow-error

Flujo ejecutado: Lector -> Validador -> Arbitro.
        `,
				tags: ["AI Swarm"],
			},
		},
	);
