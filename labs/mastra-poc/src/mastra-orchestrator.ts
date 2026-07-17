/**
 * Mastra Orchestrator — Entry point for Drenyra on Mastra
 *
 * Punto de entrada unificado que reemplaza:
 * - LatinModernoOrchestrator (agent-swarm/src/erp/drenyra/swarm/orchestrator.ts)
 * - Supervisor (agent-swarm/src/erp/drenyra/swarm/supervisor.ts)
 * - TaskDecomposer (agent-swarm/src/erp/drenyra/swarm/task-decomposer.ts)
 * - ResultMerger (agent-swarm/src/erp/drenyra/swarm/result-merger.ts)
 * - SessionManager (agent-swarm/src/erp/drenyra/swarm/session-manager.ts)
 *
 * Total custom: ~1,400 líneas → ~200 líneas sobre Mastra
 */

import { Mastra } from "@mastra/core";
import { latinAgents } from "./agents/latin-agents";
import { evidenceMiddleware } from "./evidence-graph";
import { supervisorWorkflow } from "./workflows/latin-moderno";

// ─── Mastra App ──────────────────────────────────────────

export const drenyraMastra = new Mastra({
	name: "Drenyra",
	agents: latinAgents,
	workflows: {
		supervisor: supervisorWorkflow,
	},
	// Evidencia automática en cada step
	middleware: [evidenceMiddleware],
	telemetry: {
		serviceName: "drenyra",
		enabled: true,
	},
});

// ─── API de alto nivel (para Elysia routes) ─────────────

export interface DrenyraRequest {
	sessionId?: string;
	intent: string;
	tenant: {
		companyId: string;
		ruc: string;
		userId: string;
		organizationId?: string;
	};
}

export interface DrenyraResponse {
	success: boolean;
	data: unknown;
	traceId: string;
	sessionId: string;
	confidence: number;
}

/**
 * Procesa un request a Drenyra a través de la jerarquía Latin Moderno.
 */
export async function processDrenyraRequest(
	request: DrenyraRequest,
): Promise<DrenyraResponse> {
	const sessionId = request.sessionId ?? `session-${Date.now()}`;

	const result = await drenyraMastra.getWorkflow("supervisor").execute({
		triggerData: {
			sessionId,
			intent: request.intent,
			tenant: request.tenant,
		},
	});

	return {
		success: result.results?.mergeAndEscalate?.merged ?? false,
		data: result.results?.mergeAndEscalate?.data ?? null,
		traceId: `trace-${sessionId}`,
		sessionId,
		confidence: result.results?.mergeAndEscalate?.confidence ?? 0,
	};
}
