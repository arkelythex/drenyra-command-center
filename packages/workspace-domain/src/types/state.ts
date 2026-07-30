// ─── Lifecycle State ────────────────────────────────────────────────────────

export const LIFECYCLE_STATE = {
	QUEUED: "queued",
	STARTING: "starting",
	RUNNING: "running",
	VERIFYING: "verifying",
	WAITING: "waiting",
	COMPLETED: "completed",
	FAILED: "failed",
	CANCELLED: "cancelled",
	UNKNOWN: "unknown",
} as const;

export type LifecycleState =
	(typeof LIFECYCLE_STATE)[keyof typeof LIFECYCLE_STATE];

// ─── Attention State ────────────────────────────────────────────────────────

export const ATTENTION_STATE = {
	NONE: "none",
	INFORMATIONAL: "informational",
	INPUT_REQUIRED: "input-required",
	EVIDENCE_REQUIRED: "evidence-required",
	APPROVAL_REQUIRED: "approval-required",
	BLOCKED: "blocked",
	CRITICAL: "critical",
} as const;

export type AttentionState =
	(typeof ATTENTION_STATE)[keyof typeof ATTENTION_STATE];

// ─── Projected Risk Tier ─────────────────────────────────────────────────────

/**
 * Projected risk from FEOS governance.
 * FEOS remains the authority for R0-R3 calculation.
 * The workspace projects this risk; it does not compute or authorize it.
 */
export const PROJECTED_RISK_TIER = {
	R0: "R0",
	R1: "R1",
	R2: "R2",
	R3: "R3",
} as const;

export type ProjectedRiskTier =
	(typeof PROJECTED_RISK_TIER)[keyof typeof PROJECTED_RISK_TIER];

// ─── Freshness State ────────────────────────────────────────────────────────

export const FRESHNESS_STATE = {
	LIVE: "live",
	DELAYED: "delayed",
	STALE: "stale",
	RECONCILING: "reconciling",
	DISCONNECTED: "disconnected",
} as const;

export type FreshnessState =
	(typeof FRESHNESS_STATE)[keyof typeof FRESHNESS_STATE];

// ─── Operational State ──────────────────────────────────────────────────────

export interface OperationalState {
	readonly lifecycle: LifecycleState;
	readonly attention: AttentionState;
	readonly risk: ProjectedRiskTier;
	readonly freshness: FreshnessState;
}

// ─── CreateOperationalStateInput ────────────────────────────────────────────

export interface CreateOperationalStateInput {
	readonly lifecycle?: LifecycleState;
	readonly attention?: AttentionState;
	readonly risk?: ProjectedRiskTier;
	readonly freshness?: FreshnessState;
}

// ─── Defaults ───────────────────────────────────────────────────────────────

const DEFAULTS: OperationalState = {
	lifecycle: LIFECYCLE_STATE.QUEUED,
	attention: ATTENTION_STATE.NONE,
	risk: PROJECTED_RISK_TIER.R0,
	freshness: FRESHNESS_STATE.LIVE,
};

// ─── Factory ────────────────────────────────────────────────────────────────

export function createOperationalState(
	overrides?: CreateOperationalStateInput,
): OperationalState {
	if (!overrides) {
		return { ...DEFAULTS };
	}
	return {
		lifecycle: overrides.lifecycle ?? DEFAULTS.lifecycle,
		attention: overrides.attention ?? DEFAULTS.attention,
		risk: overrides.risk ?? DEFAULTS.risk,
		freshness: overrides.freshness ?? DEFAULTS.freshness,
	};
}

// ─── Terminal Check ─────────────────────────────────────────────────────────

const TERMINAL_STATES = new Set<LifecycleState>([
	LIFECYCLE_STATE.COMPLETED,
	LIFECYCLE_STATE.FAILED,
	LIFECYCLE_STATE.CANCELLED,
]);

/**
 * Returns true for completed/failed/cancelled.
 * UNKNOWN is NOT a terminal state.
 */
export function isTerminal(state: OperationalState): boolean {
	return TERMINAL_STATES.has(state.lifecycle);
}

// ─── State Violation ────────────────────────────────────────────────────────

/**
 * A single invariant violation in an OperationalState.
 */
export interface StateViolation {
	readonly code: string;
	readonly message: string;
	readonly dimensions: ReadonlyArray<
		"lifecycle" | "attention" | "risk" | "freshness"
	>;
}

// ─── Central State Validation ───────────────────────────────────────────────

/**
 * Validates an OperationalState against all domain invariants.
 * Returns zero or more violations; an empty array means the state is valid.
 *
 * Invariants:
 * - UNKNOWN is never terminal
 * - COMPLETED never requires input or approval
 * - CANCELLED is never working
 * - FAILED cannot present as success
 * - DISCONNECTED does not automatically imply FAILED
 * - R3 describes risk, not progress
 * - STALE describes freshness, not lifecycle
 *
 * Consumers MUST call this before persisting or projecting state.
 */
export function validateOperationalState(
	state: OperationalState,
): readonly StateViolation[] {
	const violations: StateViolation[] = [];

	// UNKNOWN is never terminal
	if (state.lifecycle === LIFECYCLE_STATE.UNKNOWN && isTerminal(state)) {
		violations.push({
			code: "UNKNOWN_TERMINAL",
			message: "UNKNOWN lifecycle state must not be treated as terminal",
			dimensions: ["lifecycle"],
		});
	}

	// COMPLETED never requires input or approval
	if (
		state.lifecycle === LIFECYCLE_STATE.COMPLETED &&
		(state.attention === ATTENTION_STATE.INPUT_REQUIRED ||
			state.attention === ATTENTION_STATE.APPROVAL_REQUIRED ||
			state.attention === ATTENTION_STATE.EVIDENCE_REQUIRED)
	) {
		violations.push({
			code: "COMPLETED_REQUIRES_ATTENTION",
			message:
				"COMPLETED lifecycle must not have input/approval/evidence-required attention",
			dimensions: ["lifecycle", "attention"],
		});
	}

	// CANCELLED must not have working attention (input-required would be meaningless)
	if (
		state.lifecycle === LIFECYCLE_STATE.CANCELLED &&
		state.attention === ATTENTION_STATE.INPUT_REQUIRED
	) {
		violations.push({
			code: "CANCELLED_REQUIRES_INPUT",
			message: "CANCELLED lifecycle must not have input-required attention",
			dimensions: ["lifecycle", "attention"],
		});
	}

	// FAILED cannot present as success
	if (
		state.lifecycle === LIFECYCLE_STATE.FAILED &&
		state.attention === ATTENTION_STATE.NONE
	) {
		violations.push({
			code: "FAILED_NO_ATTENTION",
			message: "FAILED lifecycle must not have NONE attention",
			dimensions: ["lifecycle", "attention"],
		});
	}

	// DISCONNECTED does not automatically imply FAILED
	if (
		state.freshness === FRESHNESS_STATE.DISCONNECTED &&
		state.lifecycle === LIFECYCLE_STATE.FAILED
	) {
		violations.push({
			code: "DISCONNECTED_AS_FAILED",
			message:
				"DISCONNECTED freshness must not automatically imply FAILED lifecycle",
			dimensions: ["lifecycle", "freshness"],
		});
	}

	return violations;
}
