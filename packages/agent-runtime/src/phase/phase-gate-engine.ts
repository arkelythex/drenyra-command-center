// ─── Phase Gate Engine ─────────────────────────────────────────────
// Evaluates transition gates between fiscal phases.
// Gates are predicates that check completeness, consistency, fiscal rules,
// and human approval requirements.

import {
	type GateEvidenceRecorder,
	recordGateEvidence,
} from "./gate-evidence-recorder";
import type {
	FiscalPeriodState,
	FiscalPhaseId,
	GateDefinition,
	GateResult,
	GateSeverity,
	PhaseGateContext,
} from "./types";

/** Result of evaluating all gates for a transition. */
export interface GateEvaluationResult {
	transition: { from: FiscalPhaseId; to: FiscalPhaseId };
	allPassed: boolean;
	gates: GateResult[];
	blockers: GateResult[];
	summary: string;
}

/**
 * PhaseGateEngine — evaluates gates for phase transitions.
 *
 * Gates are registered by ID. Each gate is a function that receives
 * the full period state and returns a GateResult.
 *
 * Built-in gate types:
 * - Completeness: Are all required inputs present?
 * - Consistency: Are values within expected bounds?
 * - FiscalRule: Does SUNAT regulation allow this transition?
 * - HumanApproval: Does a contador need to sign off?
 */
export class PhaseGateEngine {
	private readonly gates = new Map<string, GateDefinition>();
	private evidenceRecorder?: GateEvidenceRecorder;

	constructor(options?: { evidenceRecorder?: GateEvidenceRecorder }) {
		this.evidenceRecorder = options?.evidenceRecorder;
	}

	setEvidenceRecorder(recorder: GateEvidenceRecorder | undefined): void {
		this.evidenceRecorder = recorder;
	}

	/**
	 * Register a gate definition.
	 */
	registerGate(gate: GateDefinition): void {
		this.gates.set(gate.id, gate);
	}

	/**
	 * Register multiple gates at once.
	 */
	registerGates(gates: GateDefinition[]): void {
		for (const gate of gates) {
			this.gates.set(gate.id, gate);
		}
	}

	/**
	 * Get a registered gate by ID.
	 */
	getGate(id: string): GateDefinition | undefined {
		return this.gates.get(id);
	}

	/**
	 * Get all registered gates for a specific phase.
	 */
	getGatesForPhase(
		phaseId: FiscalPhaseId,
		position: "entry" | "exit",
	): GateDefinition[] {
		const result: GateDefinition[] = [];
		for (const gate of this.gates.values()) {
			if (gate.phaseId === phaseId && gate.position === position) {
				result.push(gate);
			}
		}
		return result;
	}

	/**
	 * Evaluate a single gate.
	 */
	async evaluateGate(
		gateId: string,
		state: FiscalPeriodState,
		context: PhaseGateContext,
	): Promise<GateResult> {
		const gate = this.gates.get(gateId);
		if (!gate) {
			return {
				gateId,
				gateName: gateId,
				passed: false,
				severity: "error",
				reason: `Gate '${gateId}' is not registered`,
				evaluatedAt: new Date(),
			};
		}

		try {
			const result = await gate.evaluate(state, context);
			await recordGateEvidence(this.evidenceRecorder, result, context);
			return result;
		} catch (error) {
			const result: GateResult = {
				gateId,
				gateName: gate.name,
				passed: false,
				severity: "critical",
				reason: `Gate evaluation error: ${error instanceof Error ? error.message : "Unknown error"}`,
				evaluatedAt: new Date(),
			};
			await recordGateEvidence(this.evidenceRecorder, result, context);
			return result;
		}
	}

	/**
	 * Evaluate all gates for a transition from one phase to another.
	 * Evaluates exit gates of the source phase + entry gates of the target phase.
	 */
	async evaluateTransition(
		from: FiscalPhaseId,
		to: FiscalPhaseId,
		state: FiscalPeriodState,
	): Promise<GateEvaluationResult> {
		const context: PhaseGateContext = {
			ruc: state.ruc,
			periodo: state.periodo,
			currentPhase: from,
			targetPhase: to,
			phaseState: {
				phaseId: from,
				status: state.status,
				gateResults: [],
			},
			periodState: state,
		};

		// Exit gates from source phase
		const exitGates = this.getGatesForPhase(from, "exit");
		// Entry gates for target phase
		const entryGates = this.getGatesForPhase(to, "entry");

		const allGates = [...exitGates, ...entryGates];
		const gateResults: GateResult[] = [];

		for (const gate of allGates) {
			const result = await this.evaluateGate(gate.id, state, {
				...context,
				currentPhase: gate.position === "exit" ? from : to,
			});
			gateResults.push(result);
		}

		const blockers = gateResults.filter(
			(g) => !g.passed && (g.severity === "error" || g.severity === "critical"),
		);
		const _warnings = gateResults.filter(
			(g) => !g.passed && g.severity === "warning",
		);
		const allPassed = blockers.length === 0;

		const summary = allPassed
			? `All gates passed: ${gateResults.filter((g) => g.passed).length}/${gateResults.length}`
			: `Blocked by ${blockers.length} gate(s): ${blockers.map((b) => b.reason).join("; ")}`;

		return {
			transition: { from, to },
			allPassed,
			gates: gateResults,
			blockers,
			summary,
		};
	}

	/**
	 * Create a simple completeness gate.
	 */
	static completenessGate(
		id: string,
		name: string,
		phaseId: FiscalPhaseId,
		position: "entry" | "exit",
		check: (state: FiscalPeriodState) => {
			complete: boolean;
			missing?: string[];
		},
	): GateDefinition {
		return {
			id,
			name,
			description: `Completeness check: ${name}`,
			phaseId,
			position,
			evaluate: async (state: FiscalPeriodState) => {
				const result = check(state);
				return {
					gateId: id,
					gateName: name,
					passed: result.complete,
					severity: result.complete ? "info" : "error",
					reason: result.complete
						? undefined
						: `Missing: ${result.missing?.join(", ")}`,
					evidence: result,
					evaluatedAt: new Date(),
				};
			},
		};
	}

	/**
	 * Create a simple consistency gate.
	 */
	static consistencyGate(
		id: string,
		name: string,
		phaseId: FiscalPhaseId,
		position: "entry" | "exit",
		threshold: number,
		check: (state: FiscalPeriodState) => { actual: number; expected: number },
	): GateDefinition {
		return {
			id,
			name,
			description: `Consistency check (threshold: ${threshold}): ${name}`,
			phaseId,
			position,
			evaluate: async (state: FiscalPeriodState) => {
				const result = check(state);
				const ratio =
					result.expected !== 0
						? result.actual / result.expected
						: result.actual === 0
							? 1 // both zero → consistent (ratio=1 = no variance)
							: 0;
				const passed = Math.abs(1 - ratio) <= threshold;
				let severity: GateSeverity = "info";
				if (!passed && Math.abs(1 - ratio) > threshold * 2) severity = "error";
				else if (!passed) severity = "warning";

				return {
					gateId: id,
					gateName: name,
					passed,
					severity,
					reason: passed
						? undefined
						: `Consistency check failed: actual=${result.actual}, expected=${result.expected}, ratio=${ratio.toFixed(4)}`,
					evidence: { ...result, ratio },
					evaluatedAt: new Date(),
				};
			},
		};
	}

	/**
	 * Remove a gate by ID.
	 */
	removeGate(id: string): boolean {
		return this.gates.delete(id);
	}

	/**
	 * Get all registered gate IDs.
	 */
	listGates(): string[] {
		return Array.from(this.gates.keys());
	}
}
