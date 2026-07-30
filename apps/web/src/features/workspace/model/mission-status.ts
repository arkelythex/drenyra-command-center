/**
 * AccountingMissionStatus — canonical state machine for accounting missions.
 *
 * Transitions are explicit and validated. No silent jumps.
 *
 * @drenyra/pi missions follow this lifecycle independently of the UI.
 * The UI reflects the canonical state from the backend.
 */

export type AccountingMissionStatus =
	| "DRAFT" // Creada pero no lanzada
	| "QUEUED" // Aceptada, esperando ejecución
	| "RUNNING" // En ejecución por @drenyra/pi
	| "BLOCKED" // Bloqueada por una condición externa
	| "AWAITING_APPROVAL" // Esperando decisión humana (R2/R3)
	| "APPROVED" // Aprobada, ejecutando consecuencia
	| "REJECTED" // Rechazada por humano
	| "REVISION_REQUESTED" // El usuario pide cambiar la propuesta
	| "COMPLETED" // Terminal, éxito
	| "FAILED" // Terminal, error
	| "UNKNOWN"; // Estado indeterminado (pérdida de conexión, timeout)

/**
 * Valid transitions between canonical states.
 * Key = from state, value = set of allowed to-states.
 * If a key is missing, no transitions from that state are allowed.
 */
const VALID_TRANSITIONS: Record<
	AccountingMissionStatus,
	ReadonlySet<AccountingMissionStatus>
> = {
	DRAFT: new Set(["QUEUED"]),
	QUEUED: new Set(["RUNNING", "FAILED"]),
	RUNNING: new Set([
		"BLOCKED",
		"AWAITING_APPROVAL",
		"COMPLETED",
		"FAILED",
		"UNKNOWN",
	]),
	BLOCKED: new Set(["RUNNING", "FAILED"]),
	AWAITING_APPROVAL: new Set(["APPROVED", "REJECTED", "RUNNING"]),
	APPROVED: new Set(["COMPLETED", "FAILED"]),
	REJECTED: new Set(["REVISION_REQUESTED"]),
	REVISION_REQUESTED: new Set(["QUEUED"]),
	COMPLETED: new Set([]),
	FAILED: new Set([]),
	UNKNOWN: new Set(["RUNNING", "FAILED", "COMPLETED"]), // recovery paths
};

/**
 * Terminal states — once reached, no further transitions (except UNKNOWN recovery).
 */
export const TERMINAL_STATES: ReadonlySet<AccountingMissionStatus> = new Set([
	"COMPLETED",
	"FAILED",
]);

/**
 * Validate a state transition.
 * Throws if invalid.
 */
export function transition(
	current: AccountingMissionStatus,
	next: AccountingMissionStatus,
): AccountingMissionStatus {
	const allowed = VALID_TRANSITIONS[current];
	if (!allowed) {
		throw new Error(`Mission state ${current} has no valid transitions`);
	}
	if (!allowed.has(next)) {
		throw new Error(
			`Invalid mission state transition: ${current} → ${next}. ` +
				`Allowed: ${[...allowed].join(", ")}`,
		);
	}
	return next;
}

/**
 * Returns true if the state allows a run/execute action.
 */
export function isRunnable(status: AccountingMissionStatus): boolean {
	return (
		status === "DRAFT" ||
		status === "REVISION_REQUESTED" ||
		status === "BLOCKED"
	);
}

/**
 * Returns true if the state is waiting for a human decision.
 */
export function isAwaitingApproval(status: AccountingMissionStatus): boolean {
	return status === "AWAITING_APPROVAL";
}

/**
 * Returns true if the state is terminal (no further work).
 */
export function isTerminal(status: AccountingMissionStatus): boolean {
	return TERMINAL_STATES.has(status) || status === "REJECTED";
}
