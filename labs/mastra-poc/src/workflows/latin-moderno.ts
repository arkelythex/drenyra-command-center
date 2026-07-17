/**
 * LatinModernoOrchestrator — Sobre Mastra Workflow
 *
 * Reemplaza las ~1,500 líneas de LatinModernoOrchestrator + Supervisor + TaskDecomposer + ResultMerger
 * por un workflow declarativo de Mastra con steps.
 *
 * Flujo completo:
 *   1. Decompose Intent → determinar qué Latin Agents se necesitan
 *   2. Execute en paralelo los agents seleccionados
 *   3. Merge resultados
 *   4. Escalar al Supervisor si hay conflictos o baja confianza
 *   5. Log de evidencia
 */

import { Step, Workflow } from "@mastra/core";
import { z } from "zod";
import { type LatinAgentId, latinAgents } from "../agents/latin-agents";
import { evidenceGraph } from "../evidence-graph";
import { ApprovalGateMiddleware } from "../middleware/approval-gate";

// ─── Schemas ──────────────────────────────────────────────

export const TenantSchema = z.object({
	companyId: z.string(),
	ruc: z.string().length(11),
	userId: z.string(),
	organizationId: z.string().optional(),
});

export const SupervisorTriggerSchema = z.object({
	sessionId: z.string(),
	intent: z.string(),
	tenant: TenantSchema,
	contextData: z.record(z.unknown()).optional(),
});

type SupervisorTrigger = z.infer<typeof SupervisorTriggerSchema>;

// ─── Step 1: Decompose Intent ────────────────────────────

/**
 * Determina qué Latin Agents se necesitan según el intent.
 * Usa keyword matching + scoring (igual que el custom actual,
 * pero como un Step declarativo de Mastra).
 */
const decomposeIntent = new Step({
	name: "decomposeIntent",
	inputSchema: z.object({
		intent: z.string(),
	}),
	outputSchema: z.object({
		requiredAgents: z.array(z.string()),
		tasks: z.array(
			z.object({
				agentId: z.string(),
				intent: z.string(),
				priority: z.number(),
			}),
		),
	}),
	execute: async ({ context }) => {
		const { intent } = context.trigger as unknown as SupervisorTrigger;
		const intentLower = intent.toLowerCase();

		// Mapeo intent → Latin Agents
		const agentMap: Record<string, LatinAgentId[]> = {
			"analisis|evaluar|clasificar|anomalia|detectar|revisar": ["cerno"],
			"compliance|cumplimiento|validar|sunat|sire|ubl|cpe|detraccion|retencion":
				["custos"],
			"integrar|conectar|banco|api|ose|extracto": ["necto"],
			"regla|pcge|asiento|contable|plan de cuentas|tipo cambio": ["regula"],
			"reporte|insight|tendencia|recomendacion|dashboard|kpi": ["lumen"],
			"fusionar|conciliar|correlacionar|combinar|consolidar": ["fusio"],
			"exportar|pdf|documentar|imprimir|resumen|generar": ["scripta"],
			"almacenar|guardar|documento|archivo|evidencia|cargar": ["capsa"],
		};

		const requiredAgents = new Set<LatinAgentId>();
		for (const [keywords, agents] of Object.entries(agentMap)) {
			const patterns = keywords.split("|");
			for (const pattern of patterns) {
				if (intentLower.includes(pattern)) {
					agents.forEach((a) => requiredAgents.add(a));
					break;
				}
			}
		}

		// Si no se detectó nada, usar defaults fiscales
		if (requiredAgents.size === 0) {
			requiredAgents.add("cerno");
			requiredAgents.add("custos");
		}

		const tasks = Array.from(requiredAgents).map((agentId, i) => ({
			agentId,
			intent,
			priority: i < 2 ? 1 : 2,
		}));

		return {
			requiredAgents: Array.from(requiredAgents),
			tasks,
		};
	},
});

// ─── Step 2: Execute parallel domain agents ──────────────

const executeDomainAgents = new Step({
	name: "executeDomainAgents",
	inputSchema: z.object({
		tasks: z.array(
			z.object({
				agentId: z.string(),
				intent: z.string(),
				priority: z.number(),
			}),
		),
		tenant: TenantSchema,
		sessionId: z.string(),
	}),
	outputSchema: z.object({
		results: z.array(
			z.object({
				agentId: z.string(),
				status: z.string(),
				data: z.unknown().optional(),
				confidence: z.number(),
				durationMs: z.number(),
			}),
		),
	}),
	execute: async ({ context }) => {
		const contextData = context as unknown as {
			tasks: Array<{ agentId: string; intent: string }>;
			tenant: z.infer<typeof TenantSchema>;
			sessionId: string;
		};

		const startTime = Date.now();
		const approvalGate = new ApprovalGateMiddleware();

		const results = await Promise.all(
			contextData.tasks.map(async (task) => {
				const agent = latinAgents[task.agentId as LatinAgentId];
				if (!agent) {
					return {
						agentId: task.agentId,
						status: "error",
						data: { error: `Agent not found: ${task.agentId}` },
						confidence: 0,
						durationMs: 0,
					};
				}

				const agentStart = Date.now();

				try {
					// Approval gate check
					const approval = await approvalGate.check({
						type: task.intent,
						description: `Domain agent execution: ${task.agentId}`,
						approvalLevel: "auto",
						payload: { intent: task.intent },
						agentId: task.agentId,
						tenant: contextData.tenant,
					});

					if (!approval.ok) {
						return {
							agentId: task.agentId,
							status: "blocked",
							data: { error: approval.error },
							confidence: 0,
							durationMs: Date.now() - agentStart,
						};
					}

					// Ejecutar agente
					const result = await agent.execute({
						prompt: task.intent,
						context: {
							sessionId: contextData.sessionId,
							tenant: contextData.tenant,
						},
					});

					// Log evidence
					evidenceGraph.append({
						sessionId: contextData.sessionId,
						traceId: `trace-${contextData.sessionId}`,
						agentId: task.agentId,
						actionType: "domain-agent-execute",
						input: task.intent,
						output: result,
						confidence: 0.85,
						metadata: {
							durationMs: Date.now() - agentStart,
						},
					});

					return {
						agentId: task.agentId,
						status: "completed",
						data: result,
						confidence: 0.85,
						durationMs: Date.now() - agentStart,
					};
				} catch (error) {
					return {
						agentId: task.agentId,
						status: "error",
						data: {
							error: error instanceof Error ? error.message : String(error),
						},
						confidence: 0,
						durationMs: Date.now() - agentStart,
					};
				}
			}),
		);

		return {
			results,
			totalDurationMs: Date.now() - startTime,
		} as unknown as {
			results: Array<{
				agentId: string;
				status: string;
				data?: unknown;
				confidence: number;
				durationMs: number;
			}>;
		};
	},
});

// ─── Step 3: Merge & handle escalations ──────────────────

const mergeAndEscalate = new Step({
	name: "mergeAndEscalate",
	inputSchema: z.object({
		results: z.array(z.any()),
	}),
	outputSchema: z.object({
		merged: z.boolean(),
		data: z.unknown(),
		confidence: z.number(),
		conflicts: z.array(z.any()),
		errors: z.array(z.any()),
	}),
	execute: async ({ context }) => {
		const { results } = context as unknown as {
			results: Array<{
				agentId: string;
				status: string;
				data?: unknown;
				confidence: number;
				durationMs: number;
			}>;
		};

		const errors = results.filter((r) => r.status === "error");
		const completed = results.filter((r) => r.status === "completed");

		// Si hay errores o confianza baja, escalar
		if (errors.length > 0) {
			console.warn(
				"[Supervisor] Escalation — errors detected:",
				errors.map((e) => e.agentId),
			);

			return {
				merged: false,
				data: {
					partial: completed.map((r) => ({ agent: r.agentId, data: r.data })),
					errors: errors.map((e) => ({ agent: e.agentId, error: e.data })),
				},
				confidence: 0.2,
				conflicts: errors,
				errors,
				recommendation: "REVIEW_REQUIRED",
			};
		}

		const avgConfidence =
			completed.reduce((s, r) => s + r.confidence, 0) / (completed.length || 1);

		if (avgConfidence < 0.4) {
			console.warn("[Supervisor] Low confidence across agents:", avgConfidence);

			return {
				merged: false,
				data: {
					results: completed.map((r) => ({ agent: r.agentId, data: r.data })),
				},
				confidence: avgConfidence,
				conflicts: [],
				errors: [],
				recommendation: "RETRY_WITH_MORE_CONTEXT",
			};
		}

		// Éxito: mergear resultados
		const mergedData = completed.reduce(
			(acc, r) => {
				acc[r.agentId] = r.data;
				return acc;
			},
			{} as Record<string, unknown>,
		);

		return {
			merged: true,
			data: mergedData,
			confidence: avgConfidence,
			conflicts: [],
			errors: [],
		};
	},
});

// ─── Workflow: Supervisor ─────────────────────────────────

/**
 * SupervisorWorkflow — el L1 de la jerarquía Latin Moderno.
 *
 * Reemplaza completamente LatinModernoOrchestrator.handleRequest()
 * con sus 4 phases manuales (decompose → execute → merge → escalate)
 * por un workflow declarativo de Mastra.
 */
export const supervisorWorkflow = new Workflow({
	name: "latin-moderno-supervisor",
	triggerSchema: SupervisorTriggerSchema,
})
	.step(decomposeIntent)
	.step(executeDomainAgents, {
		// Solo ejecuta domain agents si hay tareas que descomponer
		when: (ctx) => {
			const dec = ctx.getStepResult<{ tasks: unknown[] }>("decomposeIntent");
			return dec.tasks.length > 0;
		},
	})
	.step(mergeAndEscalate)
	.commit();

// ─── Función de entrada (para tests / CLI) ────────────────

export async function runSupervisor(input: SupervisorTrigger) {
	return supervisorWorkflow.execute({
		triggerData: input,
	});
}
