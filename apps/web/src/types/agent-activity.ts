/**
 * Semantic agent state for the Workbench.
 *
 * Mirrors Herdr-inspired states but mapped to financial workflows.
 * The states are coarser than technical process states — they answer
 * "what does this agent need right now?" not "what process is running?"
 */

export type AgentSemanticState =
	| "queued"
	| "working"
	| "verifying"
	| "waiting_for_input"
	| "waiting_for_approval"
	| "blocked"
	| "completed"
	| "failed"
	| "unknown";

export interface AgentSemanticStateInfo {
	state: AgentSemanticState;
	label: string;
	description: string;
	color: "blue" | "amber" | "red" | "green" | "gray" | "purple";
	/** Icon name from lucide-react */
	icon: string;
}

export const AGENT_STATE_MAP: Record<
	AgentSemanticState,
	AgentSemanticStateInfo
> = {
	queued: {
		state: "queued",
		label: "En cola",
		description: "Esperando turno de ejecución",
		color: "gray",
		icon: "Clock",
	},
	working: {
		state: "working",
		label: "Trabajando",
		description: "Ejecutando tarea activa",
		color: "blue",
		icon: "Loader",
	},
	verifying: {
		state: "verifying",
		label: "Verificando",
		description: "Comparando resultados contra fuente",
		color: "blue",
		icon: "SearchCheck",
	},
	waiting_for_input: {
		state: "waiting_for_input",
		label: "Esperando información",
		description: "Necesita datos del usuario para continuar",
		color: "amber",
		icon: "HelpCircle",
	},
	waiting_for_approval: {
		state: "waiting_for_approval",
		label: "Esperando aprobación",
		description: "Requiere revisión profesional antes de continuar",
		color: "purple",
		icon: "ClipboardCheck",
	},
	blocked: {
		state: "blocked",
		label: "Bloqueado",
		description: "No puede continuar sin resolver impedimento",
		color: "red",
		icon: "AlertOctagon",
	},
	completed: {
		state: "completed",
		label: "Completado",
		description: "Tarea finalizada exitosamente",
		color: "green",
		icon: "CheckCircle",
	},
	failed: {
		state: "failed",
		label: "Falló",
		description: "Error durante la ejecución",
		color: "red",
		icon: "XCircle",
	},
	unknown: {
		state: "unknown",
		label: "Desconocido",
		description: "Estado no disponible",
		color: "gray",
		icon: "HelpCircle",
	},
};

/**
 * Activity event — a single action performed by an agent.
 *
 * Shows what the agent DID, not what it THOUGHT.
 * No reasoning chains — only concrete actions.
 */
export interface AgentActivityEvent {
	id: string;
	agentId: string;
	timestamp: string;
	type: ActivityEventType;
	label: string;
	description: string;
	source?: string; // e.g., "Ledger", "SUNAT", "Evidence Vault"
	duration?: number;
	status?: "running" | "completed" | "failed";
	riskLevel: "R0" | "R1" | "R2" | "R3" | undefined;
}

export type ActivityEventType =
	| "tool_executed" // Agent used a tool
	| "source_consulted" // Agent read from a source
	| "document_read" // Agent read a document
	| "rule_applied" // Agent applied a rule/policy
	| "result_produced" // Agent generated output
	| "decision_pending" // Agent needs human decision
	| "error"; // Error occurred

/**
 * Agent activity feed — a list of events for one agent run.
 */
export interface AgentActivityFeed {
	agentId: string;
	agentName: string;
	state: AgentSemanticState;
	events: AgentActivityEvent[];
	startedAt: string;
	elapsedMs: number;
}
