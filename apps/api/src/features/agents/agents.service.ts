/**
 * Agents Feature — Service Layer
 *
 * Bridge class wrapping the orchestrator SessionManager. Transforms
 * internal AgentSession models into API-friendly DTOs, computes
 * derived fields (progress, elapsedMs, risk), and handles
 * state transitions with error reporting.
 *
 * @module features/agents/agents.service
 */

import { SessionManager } from "@drenyra/drenyra-orchestrator";
import type { AgentSession } from "@drenyra/drenyra-orchestrator/mastra";
import { AppError } from "../../lib/errors";
import type {
	AgentSessionStatusDTO,
	AgentStepDTO,
	PaginatedAgentSessions,
} from "./agents.types";

// ---------------------------------------------------------------------------
// Error codes
// ---------------------------------------------------------------------------

const AGENT_ERROR_PREFIX = "AGENT";

const AgentErrorCodes = {
	NOT_FOUND: `${AGENT_ERROR_PREFIX}_NOT_FOUND`,
	INVALID_TRANSITION: `${AGENT_ERROR_PREFIX}_INVALID_TRANSITION`,
} as const;

// ---------------------------------------------------------------------------
// Session status mapping
// ---------------------------------------------------------------------------

/**
 * Map the orchestrator's internal session status to the API status.
 *
 * Orchestrator: active | completed | failed | timeout
 * API:          running | paused | completed | failed | awaiting_approval
 */
function mapStatus(
	orchestratorStatus: AgentSession["status"],
): AgentSessionStatusDTO["status"] {
	switch (orchestratorStatus) {
		case "active":
			return "running";
		case "completed":
			return "completed";
		case "failed":
			return "failed";
		case "timeout":
			return "running";
	}
}

// ---------------------------------------------------------------------------
// Domain label for step IDs
// ---------------------------------------------------------------------------

/**
 * Human-readable label extracted from the step's domain.
 * Falls back to the raw domain value when no mapping exists.
 */
function stepLabel(domain: string): string {
	const labels: Record<string, string> = {
		audit: "Auditoría fiscal",
		evidence: "Recolección de evidencia",
		classification: "Clasificación de riesgo",
		report: "Generación de reporte",
		compliance: "Verificación de cumplimiento",
		approval: "Aprobación humana",
		archive: "Archivado inmutable",
		analysis: "Análisis de datos",
		extraction: "Extracción de información",
		validation: "Validación de resultados",
	};
	return labels[domain] ?? domain;
}

// ---------------------------------------------------------------------------
// Step DTO helper
// ---------------------------------------------------------------------------

function toStepDTO(s: AgentSession["steps"][0]): AgentStepDTO {
	let duration: number | undefined;
	if (s.startedAt && s.completedAt) {
		duration = s.completedAt.getTime() - s.startedAt.getTime();
	} else if (s.startedAt) {
		duration = Date.now() - s.startedAt.getTime();
	}

	return {
		id: s.id,
		label: stepLabel(s.domain),
		status: s.status,
		duration,
	};
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

export class AgentsService {
	constructor(private readonly sessionManager: SessionManager) {}

	// ─── Private helpers ──────────────────────────────────────────────

	/**
	 * Get a session by ID, throwing NOT_FOUND if it doesn't exist.
	 */
	private getSessionOrThrow(id: string): AgentSession {
		const session = this.sessionManager.get(id);
		if (!session) {
			throw new AppError(
				404,
				AgentErrorCodes.NOT_FOUND,
				`Agent session not found: ${id}`,
			);
		}
		return session;
	}

	/**
	 * Transform an orchestrator session into an API DTO.
	 */
	private toDTO(session: AgentSession): AgentSessionStatusDTO {
		const elapsedMs = Date.now() - session.startedAt.getTime();

		const steps: AgentStepDTO[] = session.steps.map(toStepDTO);

		// Progress: percentage of completed steps
		const completedSteps = steps.filter((s) => s.status === "completed").length;
		const progress =
			steps.length > 0 ? Math.round((completedSteps / steps.length) * 100) : 0;

		// Derived fields from metadata
		const changesProposed =
			typeof session.metadata.changesProposed === "number"
				? session.metadata.changesProposed
				: 0;
		const evidenceCollected =
			typeof session.metadata.evidenceCollected === "number"
				? session.metadata.evidenceCollected
				: 0;
		const tokensUsed =
			typeof session.metadata.tokensUsed === "number"
				? session.metadata.tokensUsed
				: 0;

		const riskValue = session.metadata.risk;
		const riskLevel = typeof riskValue === "string" ? riskValue : undefined;
		const risk: AgentSessionStatusDTO["risk"] = [
			"low",
			"medium",
			"high",
			"critical",
		].includes(riskLevel ?? "")
			? (riskLevel as AgentSessionStatusDTO["risk"])
			: "low";

		const requiresAction =
			typeof session.metadata.requiresAction === "boolean"
				? session.metadata.requiresAction
				: false;

		return {
			id: session.id,
			agentId:
				typeof session.metadata.agentId === "string"
					? session.metadata.agentId
					: "drenyra",
			agentName:
				typeof session.metadata.agentName === "string"
					? session.metadata.agentName
					: "Drenyra",
			threadId:
				typeof session.metadata.threadId === "string"
					? session.metadata.threadId
					: undefined,
			clientName:
				typeof session.metadata.clientName === "string"
					? session.metadata.clientName
					: "Desconocido",
			period:
				typeof session.metadata.period === "string"
					? session.metadata.period
					: new Date().toISOString().slice(0, 7),
			status: mapStatus(session.status),
			phase:
				typeof session.metadata.phase === "string"
					? session.metadata.phase
					: "initial",
			progress,
			changesProposed,
			evidenceCollected,
			elapsedMs,
			tokensUsed,
			risk,
			requiresAction,
			lastActivity: session.lastActivityAt.toISOString(),
			steps,
		};
	}

	// ─── Public API ───────────────────────────────────────────────────

	/**
	 * List all active sessions, optionally filtered.
	 */
	listSessions(
		_companyId: string | undefined,
		filters?: {
			client?: string;
			period?: string;
			status?: string;
			risk?: string;
			agentType?: string;
			limit?: number;
			offset?: number;
		},
	): PaginatedAgentSessions {
		const sessions = this.sessionManager.getActiveSessions();
		const limit = Math.min(filters?.limit ?? 20, 100);
		const offset = filters?.offset ?? 0;

		let filtered = sessions.map((s) => this.toDTO(s));

		// Apply filters
		if (filters?.client) {
			filtered = filtered.filter((s) =>
				s.clientName.toLowerCase().includes(filters.client!.toLowerCase()),
			);
		}
		if (filters?.period) {
			filtered = filtered.filter((s) => s.period === filters.period);
		}
		if (filters?.status) {
			filtered = filtered.filter((s) => s.status === filters.status);
		}
		if (filters?.risk) {
			filtered = filtered.filter((s) => s.risk === filters.risk);
		}
		if (filters?.agentType) {
			filtered = filtered.filter((s) => s.agentId === filters.agentType);
		}

		const total = filtered.length;

		return {
			data: filtered.slice(offset, offset + limit),
			total,
		};
	}

	/**
	 * Get a single session by ID.
	 */
	getSession(
		_companyId: string | undefined,
		id: string,
	): AgentSessionStatusDTO | null {
		const session = this.getSessionOrThrow(id);
		return this.toDTO(session);
	}

	/**
	 * Get the timeline (steps) for a session.
	 */
	getTimeline(
		_companyId: string | undefined,
		id: string,
	): AgentStepDTO[] | null {
		const session = this.getSessionOrThrow(id);
		return session.steps.map(toStepDTO);
	}

	/**
	 * Pause a session by marking its metadata.
	 *
	 * The orchestrator SessionManager does not have a native pause/resume
	 * concept, so we track it via metadata.
	 */
	pauseSession(
		_companyId: string | undefined,
		id: string,
	): AgentSessionStatusDTO {
		const session = this.getSessionOrThrow(id);

		if (session.status !== "active") {
			throw new AppError(
				409,
				AgentErrorCodes.INVALID_TRANSITION,
				`Cannot pause session ${id}: current status is "${session.status}", expected "active"`,
			);
		}

		this.sessionManager.update(id, {
			metadata: {
				...session.metadata,
				internalStatus: "paused",
			},
		});

		// Re-fetch to get the updated session
		const updated = this.sessionManager.get(id);
		return this.toDTO(updated!);
	}

	/**
	 * Resume a paused session.
	 */
	resumeSession(
		_companyId: string | undefined,
		id: string,
	): AgentSessionStatusDTO {
		const session = this.getSessionOrThrow(id);

		const internalStatus = session.metadata.internalStatus as
			| string
			| undefined;
		if (internalStatus !== "paused") {
			throw new AppError(
				409,
				AgentErrorCodes.INVALID_TRANSITION,
				`Cannot resume session ${id}: session is not in "paused" state`,
			);
		}

		this.sessionManager.update(id, {
			metadata: {
				...session.metadata,
				internalStatus: undefined,
			},
		});

		const updated = this.sessionManager.get(id);
		return this.toDTO(updated!);
	}

	/**
	 * Cancel a session (mark as failed with a cancellation note).
	 */
	cancelSession(
		_companyId: string | undefined,
		id: string,
	): AgentSessionStatusDTO {
		const session = this.getSessionOrThrow(id);

		if (session.status !== "active") {
			throw new AppError(
				409,
				AgentErrorCodes.INVALID_TRANSITION,
				`Cannot cancel session ${id}: current status is "${session.status}", expected "active"`,
			);
		}

		this.sessionManager.update(id, {
			status: "failed",
			metadata: {
				...session.metadata,
				cancelledAt: new Date().toISOString(),
				cancelledBy: "user",
			},
		});

		const updated = this.sessionManager.get(id);
		return this.toDTO(updated!);
	}
}

// ---------------------------------------------------------------------------
// Singleton
// ---------------------------------------------------------------------------

const sharedSessionManager = new SessionManager();

export const agentsService = new AgentsService(sharedSessionManager);
