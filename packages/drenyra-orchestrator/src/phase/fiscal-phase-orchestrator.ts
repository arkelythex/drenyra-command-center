// ─── Fiscal Phase Orchestrator ─────────────────────────────────────
// Top-level orchestrator for the fiscal phase workflow.
// Coordinates phase transitions, gate evaluation, and phase agent execution.
// Integrates with AutoAdvanceEngine for autonomous operation.

import type { Mnevori } from "@drenyra/agents/mnevori";
import type { AutoAdvanceEngine } from "./auto-advance-engine";
import { buildAutoAdvanceContext } from "./auto-advance-engine";
import {
	getNextPhase,
	isValidTransition,
	PHASE_ORDER,
} from "./fiscal-phase-graph";
import type { FiscalPhaseStore } from "./fiscal-phase-store";
import type {
	GateEvaluationResult,
	PhaseGateEngine,
} from "./phase-gate-engine";
import type {
	FiscalPeriodState,
	FiscalPhaseGraph,
	FiscalPhaseId,
	GateResult,
	PhaseHistoryEntry,
	PhaseStatus,
} from "./types";

/**
 * Configuration for creating a FiscalPhaseOrchestrator.
 */
export interface FiscalPhaseOrchestratorConfig {
	store: FiscalPhaseStore;
	gateEngine: PhaseGateEngine;
	graph: FiscalPhaseGraph;
	autoAdvanceEngine?: AutoAdvanceEngine;
	mnevori?: Mnevori;
	eventBus?: {
		publish: (eventType: string, payload: unknown) => Promise<void>;
	};
}

/**
 * Result of starting or advancing a phase.
 */
export interface PhaseOperationResult {
	success: boolean;
	phaseId?: FiscalPhaseId;
	status: PhaseStatus;
	gateResult?: GateEvaluationResult;
	state?: FiscalPeriodState;
	error?: string;
}

/**
 * Result of a full phase execution (gate check + agent run).
 */
export interface PhaseExecutionResult {
	success: boolean;
	phaseId: FiscalPhaseId;
	gateResult: GateEvaluationResult;
	agentOutput?: unknown;
	state?: FiscalPeriodState;
	error?: string;
}

/**
 * FiscalPhaseOrchestrator — coordinates the monthly fiscal cycle.
 *
 * Flow per phase:
 * 1. Validate transition (is the target phase reachable from current?)
 * 2. Evaluate entry gates for the target phase
 * 3. If gates pass, start the phase (update state to in_progress)
 * 4. Run the phase agent (invoked externally, not by orchestrator)
 * 5. Evaluate exit gates after the agent completes
 * 6. Advance to next phase if auto-transition and gates pass
 *
 * The orchestrator does NOT invoke phase agents directly — it manages
 * state and gates. The caller (or a higher-level supervisor) runs agents.
 */
export class FiscalPhaseOrchestrator {
	private readonly store: FiscalPhaseStore;
	private readonly gateEngine: PhaseGateEngine;
	private readonly graph: FiscalPhaseGraph;
	private readonly autoAdvanceEngine?: AutoAdvanceEngine;
	private readonly mnevori?: Mnevori;
	private readonly eventBus?: {
		publish: (eventType: string, payload: unknown) => Promise<void>;
	};

	constructor(config: FiscalPhaseOrchestratorConfig) {
		this.store = config.store;
		this.gateEngine = config.gateEngine;
		this.graph = config.graph;
		this.autoAdvanceEngine = config.autoAdvanceEngine;
		this.mnevori = config.mnevori;
		this.eventBus = config.eventBus;
	}

	// ─── Phase Lifecycle ─────────────────────────────────────────────

	/**
	 * Start a fiscal period for a RUC.
	 * Creates the initial state and begins with the Captura phase.
	 */
	async startPeriod(
		ruc: string,
		periodo: string,
	): Promise<PhaseOperationResult> {
		const existing = await this.store.getPeriodState(ruc, periodo);
		if (existing) {
			return {
				success: false,
				status: existing.status,
				error: `Period ${periodo} for RUC ${ruc} already exists (status: ${existing.status})`,
			};
		}

		const now = new Date();
		const initialState: FiscalPeriodState = {
			ruc,
			periodo,
			currentPhase: "captura",
			status: "not_started",
			phaseHistory: [],
			metadata: {},
			createdAt: now,
			updatedAt: now,
		};

		await this.store.upsertPeriodState(initialState);

		await this.publishEvent("phase.period.started", {
			ruc,
			periodo,
			initialPhase: "captura",
		});

		return {
			success: true,
			phaseId: "captura",
			status: "not_started",
			state: initialState,
		};
	}

	/**
	 * Start executing a phase.
	 * Evaluates entry gates first. If they pass, transitions to in_progress.
	 */
	async startPhase(
		ruc: string,
		periodo: string,
		phaseId: FiscalPhaseId,
	): Promise<PhaseOperationResult> {
		const state = await this.store.getPeriodState(ruc, periodo);
		if (!state) {
			return {
				success: false,
				status: "not_started",
				error: `Period ${periodo} for RUC ${ruc} not found. Call startPeriod first.`,
			};
		}

		// Check if this is a valid next phase
		if (state.currentPhase !== phaseId) {
			if (!isValidTransition(state.currentPhase, phaseId)) {
				return {
					success: false,
					status: state.status,
					error: `Invalid transition: ${state.currentPhase} → ${phaseId}. Must follow sequential order.`,
				};
			}
		}

		// Check if phase is already in progress or completed
		const existingEntry = state.phaseHistory.find((e) => e.phaseId === phaseId);
		if (existingEntry) {
			if (existingEntry.status === "in_progress") {
				return {
					success: true,
					phaseId,
					status: "in_progress",
					state,
				};
			}
			if (existingEntry.status === "completed") {
				return {
					success: false,
					phaseId,
					status: "completed",
					error: `Phase ${phaseId} is already completed`,
				};
			}
		}

		// Evaluate entry gates
		const entryGates = this.gateEngine.getGatesForPhase(phaseId, "entry");
		const entryGateResults: GateResult[] = [];

		for (const gate of entryGates) {
			const result = await this.gateEngine.evaluateGate(gate.id, state, {
				ruc,
				periodo,
				currentPhase: state.currentPhase,
				targetPhase: phaseId,
				phaseState: {
					phaseId,
					status: "not_started",
					gateResults: [],
				},
				periodState: state,
			});
			entryGateResults.push(result);
		}

		const blockers = entryGateResults.filter(
			(g) => !g.passed && (g.severity === "error" || g.severity === "critical"),
		);

		if (blockers.length > 0) {
			// Phase is blocked by gates
			const historyEntry: PhaseHistoryEntry = {
				phaseId,
				status: "blocked",
				startedAt: new Date(),
				gateResults: entryGateResults,
				error: `Blocked by ${blockers.length} gate(s): ${blockers.map((b) => b.reason).join("; ")}`,
			};

			await this.store.addPhaseHistoryEntry(ruc, periodo, historyEntry);
			await this.store.updatePhaseStatus(ruc, periodo, phaseId, "blocked");

			await this.publishEvent("phase.gate.blocked", {
				ruc,
				periodo,
				phaseId,
				blockers: blockers.map((b) => ({ gateId: b.gateId, reason: b.reason })),
			});

			return {
				success: false,
				phaseId,
				status: "blocked",
				gateResult: {
					transition: { from: state.currentPhase, to: phaseId },
					allPassed: false,
					gates: entryGateResults,
					blockers,
					summary: `Blocked by ${blockers.length} gate(s)`,
				},
				error: historyEntry.error,
			};
		}

		// Gates passed — start the phase
		const now = new Date();
		const historyEntry: PhaseHistoryEntry = {
			phaseId,
			status: "in_progress",
			startedAt: now,
			gateResults: entryGateResults,
		};

		await this.store.addPhaseHistoryEntry(ruc, periodo, historyEntry);
		await this.store.updatePhaseStatus(ruc, periodo, phaseId, "in_progress");

		await this.publishEvent("phase.started", {
			ruc,
			periodo,
			phaseId,
		});

		const updatedState = await this.store.getPeriodState(ruc, periodo);

		return {
			success: true,
			phaseId,
			status: "in_progress",
			gateResult: {
				transition: { from: state.currentPhase, to: phaseId },
				allPassed: true,
				gates: entryGateResults,
				blockers: [],
				summary: `Entry gates passed for ${phaseId}`,
			},
			state: updatedState,
		};
	}

	/**
	 * Complete a phase after the agent has finished.
	 * Evaluates exit gates and optionally advances to the next phase.
	 * When an AutoAdvanceEngine is configured, it evaluates if the next phase
	 * can be started automatically based on gate results and phase-specific rules.
	 */
	async completePhase(
		ruc: string,
		periodo: string,
		phaseId: FiscalPhaseId,
		agentOutput: unknown,
		options?: { autoAdvance?: boolean },
	): Promise<PhaseExecutionResult> {
		const state = await this.store.getPeriodState(ruc, periodo);
		if (!state) {
			return {
				success: false,
				phaseId,
				gateResult: {
					transition: { from: phaseId, to: phaseId },
					allPassed: false,
					gates: [],
					blockers: [],
					summary: "Period state not found",
				},
				error: `Period ${periodo} for RUC ${ruc} not found`,
			};
		}

		// Store agent output into period metadata BEFORE exit gate evaluation
		// so gates can inspect the output (e.g. countCapturedCPEs).
		// Merge into existing metadata to preserve pre-existing fields.
		if (agentOutput && typeof agentOutput === "object") {
			const existingPhaseMeta = state.metadata?.[phaseId] as
				| Record<string, unknown>
				| undefined;
			const updatedMetadata = {
				...state.metadata,
				[phaseId]: {
					...(existingPhaseMeta ?? {}),
					...(agentOutput as Record<string, unknown>),
				},
			};
			state.metadata = updatedMetadata;
			await this.store.upsertPeriodState(state);
		}

		// Persist Mnevori snapshot BEFORE exit gate evaluation
		if (this.mnevori) {
			await this.mnevori
				.persistPhaseSnapshot(ruc, periodo, phaseId, {
					status: "completed",
					agentOutput,
					gateResults: [],
				})
				.catch((err) => {
					console.error(
						`[Mnevori] Failed to persist phase snapshot for ${phaseId}:`,
						err,
					);
				});
		}

		// Evaluate exit gates
		const exitGates = this.gateEngine.getGatesForPhase(phaseId, "exit");
		const exitGateResults: GateResult[] = [];

		for (const gate of exitGates) {
			const result = await this.gateEngine.evaluateGate(gate.id, state, {
				ruc,
				periodo,
				currentPhase: phaseId,
				targetPhase: phaseId,
				phaseState: {
					phaseId,
					status: "in_progress",
					gateResults: [],
				},
				periodState: state,
			});
			exitGateResults.push(result);
		}

		const blockers = exitGateResults.filter(
			(g) => !g.passed && (g.severity === "error" || g.severity === "critical"),
		);
		const warnings = exitGateResults.filter(
			(g) => !g.passed && g.severity === "warning",
		);

		const now = new Date();
		const hasBlocker = blockers.length > 0;

		// Update phase history
		const historyEntry: PhaseHistoryEntry = {
			phaseId,
			status: hasBlocker ? "blocked" : "completed",
			startedAt:
				state.phaseHistory.find((e) => e.phaseId === phaseId)?.startedAt ?? now,
			completedAt: now,
			gateResults: exitGateResults,
			agentOutput,
			error: hasBlocker
				? `Blocked by ${blockers.length} exit gate(s): ${blockers.map((b) => b.reason).join("; ")}`
				: undefined,
		};

		await this.store.addPhaseHistoryEntry(ruc, periodo, historyEntry);

		if (hasBlocker) {
			await this.store.updatePhaseStatus(ruc, periodo, phaseId, "blocked");

			await this.publishEvent("phase.gate.blocked", {
				ruc,
				periodo,
				phaseId,
				position: "exit",
				blockers: blockers.map((b) => ({ gateId: b.gateId, reason: b.reason })),
			});

			return {
				success: false,
				phaseId,
				gateResult: {
					transition: { from: phaseId, to: phaseId },
					allPassed: false,
					gates: exitGateResults,
					blockers,
					summary: `Blocked by ${blockers.length} exit gate(s)`,
				},
				agentOutput,
				state: await this.store.getPeriodState(ruc, periodo),
				error: historyEntry.error,
			};
		}

		// Phase completed successfully
		await this.store.updatePhaseStatus(ruc, periodo, phaseId, "completed");

		await this.publishEvent("phase.completed", {
			ruc,
			periodo,
			phaseId,
			warnings: warnings.map((w) => ({ gateId: w.gateId, reason: w.reason })),
		});

		// Auto-advance using the engine or simple boolean
		if (options?.autoAdvance) {
			const nextPhase = getNextPhase(phaseId);
			if (nextPhase) {
				await this.handleAutoAdvance(
					ruc,
					periodo,
					phaseId,
					nextPhase,
					exitGateResults,
					agentOutput,
				);
			}
		}

		const gateResult: GateEvaluationResult = {
			transition: { from: phaseId, to: getNextPhase(phaseId) ?? phaseId },
			allPassed: true,
			gates: exitGateResults,
			blockers: [],
			summary: `Phase ${phaseId} completed successfully`,
		};

		return {
			success: true,
			phaseId,
			gateResult,
			agentOutput,
			state: await this.store.getPeriodState(ruc, periodo),
		};
	}

	/**
	 * Handle auto-advance decision: use AutoAdvanceEngine if available,
	 * otherwise fall back to simple startPhase.
	 */
	private async handleAutoAdvance(
		ruc: string,
		periodo: string,
		completedPhase: FiscalPhaseId,
		nextPhase: FiscalPhaseId,
		exitGateResults: GateResult[],
		agentOutput: unknown,
	): Promise<void> {
		if (this.autoAdvanceEngine) {
			const periodState = await this.store.getPeriodState(ruc, periodo);
			if (!periodState) return;

			const ctx = buildAutoAdvanceContext({
				ruc,
				periodo,
				phaseId: completedPhase,
				gateResults: exitGateResults,
				agentOutput,
				metadata: periodState.metadata,
			});

			const decision = await this.autoAdvanceEngine.evaluate(
				completedPhase,
				ctx,
			);

			if (decision.shouldAdvance) {
				const advanceResult = await this.startPhase(ruc, periodo, nextPhase);

				if (advanceResult.success) {
					await this.publishEvent("phase.auto-advanced", {
						ruc,
						periodo,
						from: completedPhase,
						to: nextPhase,
						confidence: decision.confidence,
						reason: decision.reason,
					});
				}
			} else {
				await this.publishEvent("phase.auto-advance-skipped", {
					ruc,
					periodo,
					from: completedPhase,
					to: nextPhase,
					reason: decision.reason,
					confidence: decision.confidence,
				});
			}
		} else {
			// Simple auto-advance (backward compatible)
			const advanceResult = await this.startPhase(ruc, periodo, nextPhase);
			if (advanceResult.success) {
				await this.publishEvent("phase.auto-advanced", {
					ruc,
					periodo,
					from: completedPhase,
					to: nextPhase,
				});
			}
		}
	}

	/**
	 * Run a full period continuously with auto-advance.
	 * Starts the period, then for each phase:
	 *   1. Starts the phase (evaluating entry gates)
	 *   2. Calls the provided agent runner
	 *   3. Completes the phase (evaluating exit gates)
	 *   4. Auto-advances using the engine
	 *
	 * The agentRunner is a function that receives the phase ID and period state,
	 * and returns the agent output. This allows the caller to provide the actual
	 * agent logic (OCR, classification, reconciliation, etc.) while the orchestrator
	 * handles all state management and gate evaluation.
	 */
	async runPeriodContinuously(
		ruc: string,
		periodo: string,
		agentRunner: (
			phaseId: FiscalPhaseId,
			state: FiscalPeriodState,
		) => Promise<{ output: unknown; error?: string }>,
	): Promise<PhaseExecutionResult> {
		const startResult = await this.startPeriod(ruc, periodo);
		if (!startResult.success) {
			return {
				success: false,
				phaseId: "captura",
				gateResult: {
					transition: { from: "captura", to: "captura" },
					allPassed: false,
					gates: [],
					blockers: [],
					summary: `Failed to start period: ${startResult.error}`,
				},
				error: startResult.error,
			};
		}

		let currentPhase: FiscalPhaseId = "captura";
		let lastResult: PhaseExecutionResult = {
			success: true,
			phaseId: "captura",
			gateResult: {
				transition: { from: "captura", to: "captura" },
				allPassed: true,
				gates: [],
				blockers: [],
				summary: "Period started",
			},
		};

		while (currentPhase) {
			// Start the phase (evaluates entry gates)
			const phaseStart = await this.startPhase(ruc, periodo, currentPhase);

			if (!phaseStart.success) {
				await this.failPhase(
					ruc,
					periodo,
					currentPhase,
					phaseStart.error ?? "Phase start failed",
				);
				lastResult = {
					success: false,
					phaseId: currentPhase,
					gateResult: {
						transition: { from: currentPhase, to: currentPhase },
						allPassed: false,
						gates: [],
						blockers: [],
						summary: phaseStart.error ?? "Phase start failed",
					},
					error: phaseStart.error,
				};
				break;
			}

			// Run the phase agent
			const periodState = await this.store.getPeriodState(ruc, periodo);
			if (!periodState) break;

			const agentResult = await agentRunner(currentPhase, periodState);

			if (agentResult.error) {
				await this.failPhase(ruc, periodo, currentPhase, agentResult.error);
				lastResult = {
					success: false,
					phaseId: currentPhase,
					gateResult: {
						transition: { from: currentPhase, to: currentPhase },
						allPassed: false,
						gates: [],
						blockers: [],
						summary: agentResult.error,
					},
					error: agentResult.error,
				};
				break;
			}

			// Complete the phase (evaluates exit gates, auto-advances)
			lastResult = await this.completePhase(
				ruc,
				periodo,
				currentPhase,
				agentResult.output,
				{ autoAdvance: true },
			);

			if (!lastResult.success) {
				break; // Blocked or failed
			}

			// Get next phase from the updated state
			const updatedState = await this.store.getPeriodState(ruc, periodo);
			if (!updatedState) break;

			const next = getNextPhase(currentPhase);
			if (!next) break; // Period complete (reached Auditoría)

			currentPhase = next;
		}

		return lastResult;
	}

	/**
	 * Mark a phase as failed (agent error, external system down, etc.).
	 */
	async failPhase(
		ruc: string,
		periodo: string,
		phaseId: FiscalPhaseId,
		error: string,
	): Promise<PhaseOperationResult> {
		const state = await this.store.getPeriodState(ruc, periodo);
		if (!state) {
			return {
				success: false,
				status: "not_started",
				error: "Period not found",
			};
		}

		const historyEntry: PhaseHistoryEntry = {
			phaseId,
			status: "failed",
			startedAt: new Date(),
			completedAt: new Date(),
			gateResults: [],
			error,
		};

		await this.store.addPhaseHistoryEntry(ruc, periodo, historyEntry);
		await this.store.updatePhaseStatus(ruc, periodo, phaseId, "failed");

		await this.publishEvent("phase.failed", {
			ruc,
			periodo,
			phaseId,
			error,
		});

		return {
			success: false,
			phaseId,
			status: "failed",
			error,
		};
	}

	/**
	 * Force-advance to a specific phase (bypass gates — for recovery only).
	 */
	async forceAdvance(
		ruc: string,
		periodo: string,
		targetPhase: FiscalPhaseId,
	): Promise<PhaseOperationResult> {
		const state = await this.store.getPeriodState(ruc, periodo);
		if (!state) {
			return {
				success: false,
				status: "not_started",
				error: "Period not found",
			};
		}

		if (!PHASE_ORDER.includes(targetPhase)) {
			return {
				success: false,
				status: state.status,
				error: `Unknown phase: ${targetPhase}`,
			};
		}

		await this.store.updatePhaseStatus(
			ruc,
			periodo,
			targetPhase,
			"in_progress",
		);

		await this.publishEvent("phase.force-advanced", {
			ruc,
			periodo,
			from: state.currentPhase,
			to: targetPhase,
		});

		return {
			success: true,
			phaseId: targetPhase,
			status: "in_progress",
		};
	}

	// ─── Query ───────────────────────────────────────────────────────

	/**
	 * Get the full period status for a RUC + periodo.
	 */
	async getPeriodStatus(
		ruc: string,
		periodo: string,
	): Promise<FiscalPeriodState | undefined> {
		return this.store.getPeriodState(ruc, periodo);
	}

	/**
	 * Get all active periods across all RUCs.
	 */
	async getActivePeriods(): Promise<Array<{ ruc: string; periodo: string }>> {
		return this.store.listActivePeriods();
	}

	/**
	 * Check if a phase transition is valid.
	 */
	canTransition(from: FiscalPhaseId, to: FiscalPhaseId): boolean {
		return isValidTransition(from, to);
	}

	// ─── Internal ────────────────────────────────────────────────────

	private async publishEvent(
		eventType: string,
		payload: unknown,
	): Promise<void> {
		if (this.eventBus) {
			await this.eventBus.publish(eventType, payload);
		}
	}
}
