/**
 * Workflow API Route
 *
 * POST /analyze-task, /process-invoices, /multi-ruc-process, /reconcile endpoints
 *
 * @module ai-swarm/api/workflow
 */

import { Elysia, t } from "elysia";
import { z } from "zod";
import { fail } from "../../shared/api-response";
import {
	enforceGovernancePolicy,
	GovernanceSchema,
	type GovernanceInput,
} from "../../shared/governance";
import { ReconciliationAgent } from "../agents/reconciliation.agent";
import { hasOpenRouterKey } from "../config/openrouter.config";
import { OrchestratorService } from "../orchestrator/orchestrator.service";
import { CompleteInvoiceProcessingWorkflow } from "../workflows/complete-invoice-processing.workflow";
import { MultiRucProcessingWorkflow } from "../workflows/multi-ruc-processing.workflow";
import { enqueueSwarmAuditLog } from "./audit-log-bridge";
import { resolveOrganizationContextForRequest } from "./organization-context";

function toGovernanceInput(
	value: NonNullable<z.infer<typeof GovernanceSchema>>,
): GovernanceInput {
	return {
		...(value.objective !== undefined ? { objective: value.objective } : {}),
		...(value.estimatedAmountPen !== undefined
			? { estimatedAmountPen: value.estimatedAmountPen }
			: {}),
		...(value.riskScore !== undefined ? { riskScore: value.riskScore } : {}),
		...(value.approval !== undefined
			? {
					approval: {
						approvedBy: value.approval.approvedBy,
						reason: value.approval.reason,
						...(value.approval.approvedAt !== undefined
							? { approvedAt: value.approval.approvedAt }
							: {}),
					},
				}
			: {}),
	};
}

function resolveWorkflowOrganizationId(
	request: Request,
):
	| { ok: true; organizationId: number | null }
	| { ok: false; response: ReturnType<typeof fail> } {
	const organizationContext = resolveOrganizationContextForRequest({
		headers: request.headers,
	});

	if (!organizationContext.ok) {
		return {
			ok: false,
			response: fail(organizationContext.error, organizationContext.code, {
				details: organizationContext.details,
			}),
		};
	}

	return { ok: true, organizationId: organizationContext.organizationId };
}

/**
 * AI Swarm routes
 * @example
 * ```ts
 * console.log(aiSwarmRoutes);
 * ```
 */

export const workflowRoute = new Elysia({ prefix: "/api/ai-swarm" })
	/**
	 * POST /api/ai-swarm/analyze-task
	 *
	 * Preview execution strategy without running
	 */
	.post(
		"/analyze-task",
		async ({ body, request, set }) => {
			const organizationContext = resolveWorkflowOrganizationId(request);
			if (!organizationContext.ok) {
				set.status = 400;
				return organizationContext.response;
			}
			const organizationId = organizationContext.organizationId;
			const orchestrator = new OrchestratorService();
			const analysis = await orchestrator.analyzeTask(body);

			enqueueSwarmAuditLog({
				organizationId,
				agentName: "orchestrator-agent",
				decisionType: "TASK_ANALYSIS_COMPLETED",
				reasoning: "Analisis de estrategia ejecutado sin procesar documentos.",
				inputs: {
					fileCount: body.fileCount,
					totalSizeBytes: body.totalSizeBytes,
					taskType: body.taskType,
					priority: body.priority,
				},
				outputs: {
					shouldParallelize: analysis.shouldParallelize,
					batchSize: analysis.batchSize,
					estimatedCost: analysis.estimatedCost,
					estimatedTime: analysis.estimatedTime,
				},
			});

			return {
				success: true,
				data: analysis,
			};
		},
		{
			body: t.Object({
				fileCount: t.Number(),
				totalSizeBytes: t.Number(),
				taskType: t.Union([
					t.Literal("INVOICE"),
					t.Literal("BILL"),
					t.Literal("RECONCILIATION"),
					t.Literal("SIRE"),
				]),
				priority: t.Union([
					t.Literal("low"),
					t.Literal("medium"),
					t.Literal("high"),
					t.Literal("critical"),
				]),
			}),
			detail: {
				summary: "Analyze task execution strategy",
				description: `
Preview how the orchestrator will execute a task without actually running it.

Returns:
- Should parallelize: boolean
- Batch size: number
- Estimated cost: USD
- Estimated time: seconds
- Required agents: array
        `,
				tags: ["AI Swarm"],
			},
		},
	)

	/**
	 * POST /api/ai-swarm/process-invoices
	 *
	 * Complete end-to-end processing with all agents in parallel
	 */
	.post(
		"/process-invoices",
		async ({ body, set, request }) => {
			const organizationContext = resolveWorkflowOrganizationId(request);
			if (!organizationContext.ok) {
				set.status = 400;
				return organizationContext.response;
			}
			const organizationId = organizationContext.organizationId;
			const governance = await enforceGovernancePolicy({
				action: "process_invoices",
				priority: body.priority ?? "medium",
				...(body.governance !== undefined ? { governance: toGovernanceInput(body.governance) } : {}),
				set,
			});

			if (!governance.allowed) {
				enqueueSwarmAuditLog({
					organizationId,
					agentName: "governance-agent",
					decisionType: "PROCESS_INVOICES_BLOCKED",
					reasoning: "Bloqueado por politica de gobernanza.",
					inputs: {
						priority: body.priority ?? "medium",
						documentCount: body.documents.length,
					},
					outputs: {
						allowed: false,
						decision: governance.response.governance.decision,
					},
				});
				return governance.response;
			}

			if (!hasOpenRouterKey()) {
				set.status = 400;
				return {
					success: false,
					error: "OPENROUTER_API_KEY not configured.",
					hint: "Configura `OPENROUTER_API_KEY` en `apps/api/.env` para habilitar OCR + PCGE. Alternativa sin LLM: POST /api/ai-swarm/validate-invoices.",
				};
			}

			const workflow = new CompleteInvoiceProcessingWorkflow();
			const result = await workflow.execute({
				documents: body.documents,
				...(body.priority !== undefined ? { priority: body.priority } : {}),
			});

			enqueueSwarmAuditLog({
				organizationId,
				agentName: "orchestrator-agent",
				decisionType: "PROCESS_INVOICES_COMPLETED",
				reasoning: "Flujo end-to-end de facturas completado.",
				inputs: {
					priority: body.priority ?? "medium",
					documentCount: body.documents.length,
				},
				outputs: {
					totalProcessed: result.totalProcessed,
					totalSuccess: result.totalSuccess,
					totalFailed: result.totalFailed,
					totalCostUsd: result.execution.totalCostUsd,
				},
			});

			return {
				success: true,
				data: result,
				governance: governance.trace,
			};
		},
		{
			body: z.object({
				documents: z.array(
					z.object({
						id: z.string(),
						imageUrl: z.string(),
						filename: z.string(),
						mimeType: z.string(),
					}),
				),
				priority: z
					.union([
						z.literal("low"),
						z.literal("medium"),
						z.literal("high"),
						z.literal("critical"),
					])
					.optional(),
				governance: GovernanceSchema,
			}),
			detail: {
				summary: "Complete invoice processing (OCR + SUNAT + PCGE + Evidence)",
				description: `
Complete end-to-end invoice processing using multiple agents in parallel:

1. OCR Agent: Extract invoice data from image/PDF
2. SUNAT Agent: Validate against SUNAT regulations (parallel)
3. PCGE Agent: Classify into accounting entries (parallel)
4. Evidence Agent: Store document for audit trail (parallel)

The orchestrator automatically parallelizes based on volume:
- <5 documents: Sequential
- 5-20 documents: Parallel batch of 5
- >20 documents: Parallel batch of 10

Requires OPENROUTER_API_KEY for OCR and PCGE agents.
SUNAT validation works without API key (rule-based only).
        `,
				tags: ["AI Swarm"],
			},
		},
	)

	/**
	 * POST /api/ai-swarm/multi-ruc-process
	 *
	 * Process multiple companies (RUCs) in parallel
	 */
	.post(
		"/multi-ruc-process",
		async ({ body, set, request }) => {
			const organizationContext = resolveWorkflowOrganizationId(request);
			if (!organizationContext.ok) {
				set.status = 400;
				return organizationContext.response;
			}
			const organizationId = organizationContext.organizationId;
			const governance = await enforceGovernancePolicy({
				action: "multi_ruc_process",
				priority: body.priority ?? "medium",
				...(body.governance !== undefined ? { governance: toGovernanceInput(body.governance) } : {}),
				set,
			});

			if (!governance.allowed) {
				enqueueSwarmAuditLog({
					organizationId,
					agentName: "governance-agent",
					decisionType: "MULTI_RUC_BLOCKED",
					reasoning: "Bloqueado por politica de gobernanza.",
					inputs: {
						priority: body.priority ?? "medium",
						companyCount: body.companies.length,
					},
					outputs: {
						allowed: false,
						decision: governance.response.governance.decision,
					},
				});
				return governance.response;
			}

			if (!hasOpenRouterKey()) {
				set.status = 400;
				return {
					success: false,
					error: "OPENROUTER_API_KEY not configured.",
				};
			}

			const workflow = new MultiRucProcessingWorkflow();
			const result = await workflow.execute({
				companies: body.companies,
				...(body.priority !== undefined ? { priority: body.priority } : {}),
			});
			const report = workflow.generateReport(result);

			enqueueSwarmAuditLog({
				organizationId,
				agentName: "multi-ruc-orchestrator-agent",
				decisionType: "MULTI_RUC_COMPLETED",
				reasoning: "Procesamiento paralelo multi-RUC completado.",
				inputs: {
					priority: body.priority ?? "medium",
					companyCount: body.companies.length,
					totalDocuments: body.companies.reduce(
						(sum, company) => sum + company.documents.length,
						0,
					),
				},
				outputs: {
					totalCompanies: result.totalCompanies,
					successfulCompanies: result.successfulCompanies,
					failedCompanies: result.failedCompanies,
					totalDocuments: result.totalDocuments,
					totalCostUsd: result.execution.totalCostUsd,
				},
			});

			return {
				success: true,
				data: result,
				report,
				governance: governance.trace,
			};
		},
		{
			body: z.object({
				companies: z.array(
					z.object({
						ruc: z.string().length(11),
						companyName: z.string(),
						documents: z.array(
							z.object({
								id: z.string(),
								imageUrl: z.string(),
								filename: z.string(),
								mimeType: z.string(),
							}),
						),
					}),
				),
				priority: z
					.union([
						z.literal("low"),
						z.literal("medium"),
						z.literal("high"),
						z.literal("critical"),
					])
					.optional(),
				governance: GovernanceSchema,
			}),
			detail: {
				summary: "Process multiple companies (Multi-RUC) in parallel",
				description: `
Killer feature for accounting firms managing multiple clients.

Processes invoices for multiple companies (RUCs) in PARALLEL:
- Each company processes independently
- Automatic parallelization per company
- Consolidated reporting across all companies

Example: 10 companies with 5 invoices each
→ All 10 companies process in parallel
→ Each company's 5 invoices process sequentially
→ Total time: ~3-5 seconds (vs 30s sequential)

Returns consolidated report with:
- Total cost across all companies
- Success rate per company
- Processing time breakdown
        `,
				tags: ["AI Swarm"],
			},
		},
	)

	/**
	 * POST /api/ai-swarm/reconcile
	 *
	 * Bank reconciliation with AI
	 */
	.post(
		"/reconcile",
		async ({ body, set, request }) => {
			const organizationContext = resolveWorkflowOrganizationId(request);
			if (!organizationContext.ok) {
				set.status = 400;
				return organizationContext.response;
			}
			const organizationId = organizationContext.organizationId;
			const governance = await enforceGovernancePolicy({
				action: "reconcile",
				priority: body.priority ?? "medium",
				...(body.governance !== undefined ? { governance: toGovernanceInput(body.governance) } : {}),
				set,
			});

			if (!governance.allowed) {
				enqueueSwarmAuditLog({
					organizationId,
					agentName: "governance-agent",
					decisionType: "RECONCILIATION_BLOCKED",
					reasoning: "Bloqueado por politica de gobernanza.",
					inputs: {
						priority: body.priority ?? "medium",
						transactionCount: body.transactions.length,
						documentCount: body.documents.length,
					},
					outputs: {
						allowed: false,
						decision: governance.response.governance.decision,
					},
				});
				return governance.response;
			}

			if (!hasOpenRouterKey()) {
				set.status = 400;
				return {
					success: false,
					error: "OPENROUTER_API_KEY not configured.",
				};
			}

			const agent = new ReconciliationAgent();
			const result = await agent.reconcile(
				body.transactions.map((t) => ({
					id: t.id,
					date: t.date,
					description: t.description,
					amount: t.amount,
					type: t.type,
					...(t.reference !== undefined ? { reference: t.reference } : {}),
				})),
				body.documents,
			);

			if (!result.success) {
				set.status = 500;
				return {
					success: false,
					error: result.error?.message,
				};
			}

			const stats = agent.calculateStats(result.data!);

			enqueueSwarmAuditLog({
				organizationId,
				agentName: "bank-reconciliation-agent",
				decisionType: "RECONCILIATION_COMPLETED",
				reasoning: "Conciliacion bancaria completada.",
				inputs: {
					priority: body.priority ?? "medium",
					transactionCount: body.transactions.length,
					documentCount: body.documents.length,
				},
				outputs: {
					stats,
					metadata: result.metadata ?? null,
				},
				pluginIds: ["bcp-reconciliation-v1"],
			});

			return {
				success: true,
				data: result.data,
				stats,
				metadata: result.metadata,
				governance: governance.trace,
			};
		},
		{
			body: z.object({
				priority: z
					.union([
						z.literal("low"),
						z.literal("medium"),
						z.literal("high"),
						z.literal("critical"),
					])
					.optional(),
				transactions: z.array(
					z.object({
						id: z.string(),
						date: z.string(),
						description: z.string(),
						amount: z.number(),
						type: z.union([z.literal("debit"), z.literal("credit")]),
						reference: z.string().optional(),
					}),
				),
				documents: z.array(
					z.object({
						id: z.string(),
						ruc: z.string(),
						serie: z.string(),
						numero: z.string(),
						date: z.string(),
						total: z.number(),
						type: z.union([z.literal("invoice"), z.literal("bill")]),
					}),
				),
				governance: GovernanceSchema,
			}),
			detail: {
				summary: "Bank reconciliation with AI",
				description: `
Intelligently matches bank transactions with invoices/bills.

Handles complex scenarios:
- Exact matches (same amount, close dates)
- Partial payments (pagos a cuenta)
- Multiple invoices per transaction
- Manual review cases

Uses GPT-4 Turbo for intelligent reasoning.

Returns:
- Matched transactions with confidence scores
- Unmatched items for review
- Statistics (match rate, confidence, etc.)
        `,
				tags: ["AI Swarm"],
			},
		},
	);
