/**
 * Evidence Graph — Integración con Mastra
 *
 * Mantiene la trazabilidad fiscal. Cada acción de agente
 * genera evidencia que queda registrada para auditoría.
 */

import type { StepMiddleware } from "@mastra/core";

// ─── Types ────────────────────────────────────────────────

export interface EvidenceEntry {
	id: string;
	sessionId: string;
	traceId: string;
	agentId: string;
	actionType: string;
	input: unknown;
	output: unknown;
	timestamp: Date;
	confidence: number;
	metadata: Record<string, unknown>;
}

// ─── Evidence Store ──────────────────────────────────────

export class EvidenceGraphStore {
	private entries: EvidenceEntry[] = [];

	append(entry: Omit<EvidenceEntry, "id" | "timestamp">): void {
		this.entries.push({
			...entry,
			id: `ev-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
			timestamp: new Date(),
		});
	}

	getBySession(sessionId: string): EvidenceEntry[] {
		return this.entries.filter((e) => e.sessionId === sessionId);
	}

	getByTrace(traceId: string): EvidenceEntry[] {
		return this.entries.filter((e) => e.traceId === traceId);
	}

	getAll(): EvidenceEntry[] {
		return [...this.entries];
	}
}

// Singleton
export const evidenceGraph = new EvidenceGraphStore();

// ─── Mastra Middleware ────────────────────────────────────

export const evidenceMiddleware: StepMiddleware = {
	after: async ({ result, context }) => {
		const action = context?.action as
			| {
					type?: string;
					agentId?: string;
					sessionId?: string;
					traceId?: string;
			  }
			| undefined;

		if (!action?.type) return;

		evidenceGraph.append({
			sessionId: action.sessionId ?? "unknown",
			traceId: action.traceId ?? "unknown",
			agentId: action.agentId ?? "unknown",
			actionType: action.type,
			input: context?.input,
			output: result,
			confidence: result?.confidence ?? 0.5,
			metadata: {
				durationMs: result?.durationMs,
				modelUsed: result?.modelUsed,
				tokensUsed: result?.tokensUsed,
			},
		});
	},
};
