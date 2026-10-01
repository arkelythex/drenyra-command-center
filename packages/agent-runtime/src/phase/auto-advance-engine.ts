// ─── Auto-Advance Engine ──────────────────────────────────────────
// Decides whether the orchestrator can safely auto-advance to the next
// fiscal phase without human intervention.
//
// Rules by phase:
//   Captura→Clasificación:  Always if Captura exit gates pass
//   Clasificación→Conciliación: Coverage >= 95%
//   Conciliación→Cierre:     Variance < 5% + no critical blockers
//   Cierre→Declaración:      Requires human approval (never auto)
//   Declaración→Auditoría:   Always if declaration was accepted

import type {
	AutoAdvanceConfig,
	AutoAdvanceContext,
	AutoAdvanceDecision,
	FiscalPhaseId,
	GateResult,
	PhaseAutoAdvanceEvaluator,
} from "./types";

/** Default auto-advance configuration. */
export const DEFAULT_AUTO_ADVANCE_CONFIG: AutoAdvanceConfig = {
	minConfidence: 0.9,
	blockOnWarnings: false,
	phaseOverrides: {
		cierre: {
			enabled: false, // Cierre always requires human approval
			minConfidence: 0.99,
		},
		declaracion: {
			enabled: false, // Declaración always requires human review
			minConfidence: 0.99,
		},
	},
};

/**
 * AutoAdvanceEngine — evaluates whether a phase transition can happen
 * automatically or needs human intervention.
 *
 * Each phase has its own evaluator with specific fiscal logic:
 * - Captura exit: auto if documents captured
 * - Clasificación exit: auto if coverage >= 95%
 * - Conciliación exit: auto if variance < 5%
 * - Cierre exit: NEVER auto (requires human approval)
 * - Declaración exit: NEVER auto (requires human review)
 * - Auditoría exit: auto if confidence >= threshold
 */
export class AutoAdvanceEngine {
	private readonly config: AutoAdvanceConfig;
	private readonly evaluators = new Map<
		FiscalPhaseId,
		PhaseAutoAdvanceEvaluator
	>();

	constructor(config?: Partial<AutoAdvanceConfig>) {
		this.config = {
			...DEFAULT_AUTO_ADVANCE_CONFIG,
			...config,
			phaseOverrides: {
				...DEFAULT_AUTO_ADVANCE_CONFIG.phaseOverrides,
				...config?.phaseOverrides,
			},
		};
		this.registerDefaultEvaluators();
	}

	// ─── Public API ──────────────────────────────────────────────

	/**
	 * Evaluate whether the orchestrator should auto-advance from a phase.
	 */
	async evaluate(
		phaseId: FiscalPhaseId,
		context: AutoAdvanceContext,
	): Promise<AutoAdvanceDecision> {
		const override = this.config.phaseOverrides?.[phaseId];

		// Check if auto-advance is enabled for this phase
		if (override && override.enabled === false) {
			return {
				shouldAdvance: false,
				confidence: 0,
				reason: `Auto-advance disabled for phase '${phaseId}'`,
				blockingGates: [],
			};
		}

		// Use per-phase evaluator if registered
		const evaluator = this.evaluators.get(phaseId);
		if (evaluator) {
			const decision = evaluator(context);
			// Apply override thresholds if present
			const effectiveConfidence =
				override?.minConfidence ?? this.config.minConfidence;
			if (decision.shouldAdvance && decision.confidence < effectiveConfidence) {
				return {
					shouldAdvance: false,
					confidence: decision.confidence,
					reason: `Confidence ${decision.confidence.toFixed(3)} below threshold ${effectiveConfidence.toFixed(3)}: ${decision.reason}`,
					blockingGates: decision.blockingGates,
				};
			}
			return decision;
		}

		// Default: check gate results only
		return this.evaluateByGates(phaseId, context);
	}

	/**
	 * Register a custom evaluator for a specific phase.
	 */
	registerEvaluator(
		phaseId: FiscalPhaseId,
		evaluator: PhaseAutoAdvanceEvaluator,
	): void {
		this.evaluators.set(phaseId, evaluator);
	}

	/**
	 * Get the effective configuration for a specific phase.
	 */
	getEffectiveConfig(phaseId: FiscalPhaseId): {
		enabled: boolean;
		minConfidence: number;
		blockOnWarnings: boolean;
	} {
		const override = this.config.phaseOverrides?.[phaseId];
		return {
			enabled: override?.enabled ?? true,
			minConfidence: override?.minConfidence ?? this.config.minConfidence,
			blockOnWarnings: override?.blockOnWarnings ?? this.config.blockOnWarnings,
		};
	}

	// ─── Default Evaluators ──────────────────────────────────────

	private registerDefaultEvaluators(): void {
		this.evaluators.set("captura", this.evaluateCapturaAdvance());
		this.evaluators.set("clasificacion", this.evaluateClasificacionAdvance());
		this.evaluators.set("conciliacion", this.evaluateConciliacionAdvance());
		this.evaluators.set("cierre", this.evaluateCierreAdvance());
		this.evaluators.set("declaracion", this.evaluateDeclaracionAdvance());
		this.evaluators.set("auditoria", this.evaluateAuditoriaAdvance());
	}

	/**
	 * Captura → Clasificación: auto-advance if all documents captured
	 * and no errors in gate results.
	 */
	private evaluateCapturaAdvance(): PhaseAutoAdvanceEvaluator {
		return (ctx: AutoAdvanceContext): AutoAdvanceDecision => {
			const blockers = ctx.gateResults.filter(
				(g) =>
					!g.passed && (g.severity === "error" || g.severity === "critical"),
			);

			if (blockers.length > 0) {
				return {
					shouldAdvance: false,
					confidence: 0,
					reason: `Captura has ${blockers.length} blocking gate(s)`,
					blockingGates: blockers.map((b) => b.gateId),
				};
			}

			const totalRecibidos = (ctx.metadata?.totalRecibidos as number) ?? 0;
			if (totalRecibidos === 0) {
				return {
					shouldAdvance: false,
					confidence: 0.1,
					reason: "No documents captured yet",
					blockingGates: [],
				};
			}

			const warnings = ctx.gateResults.filter(
				(g) => !g.passed && g.severity === "warning",
			);
			const blockOnWarnings = this.config.blockOnWarnings;

			if (blockOnWarnings && warnings.length > 0) {
				return {
					shouldAdvance: false,
					confidence: 0.7,
					reason: `${warnings.length} warning(s) found and blockOnWarnings is enabled`,
					blockingGates: warnings.map((w) => w.gateId),
				};
			}

			return {
				shouldAdvance: true,
				confidence: 0.95,
				reason: `All gates passed, ${totalRecibidos} documents captured`,
				blockingGates: [],
			};
		};
	}

	/**
	 * Clasificación → Conciliación: auto-advance if coverage >= 95%
	 * or if coverage >= 80% with no critical errors.
	 */
	private evaluateClasificacionAdvance(): PhaseAutoAdvanceEvaluator {
		return (ctx: AutoAdvanceContext): AutoAdvanceDecision => {
			const criticalBlockers = ctx.gateResults.filter(
				(g) => !g.passed && g.severity === "critical",
			);
			if (criticalBlockers.length > 0) {
				return {
					shouldAdvance: false,
					confidence: 0,
					reason: `Critical gate(s) blocking: ${criticalBlockers.map((b) => b.reason).join("; ")}`,
					blockingGates: criticalBlockers.map((b) => b.gateId),
				};
			}

			const coverage = (ctx.metadata?.coverage as number) ?? 0;

			if (coverage >= 0.95) {
				return {
					shouldAdvance: true,
					confidence: 0.98,
					reason: `Classification coverage ${(coverage * 100).toFixed(1)}% >= 95%`,
					blockingGates: [],
				};
			}

			if (coverage >= 0.8) {
				return {
					shouldAdvance: false, // Needs human review for 80-95%
					confidence: 0.6,
					reason: `Coverage ${(coverage * 100).toFixed(1)}% is below 95% — human review recommended`,
					blockingGates: [],
				};
			}

			return {
				shouldAdvance: false,
				confidence: 0.3,
				reason: `Coverage ${(coverage * 100).toFixed(1)}% is critically low`,
				blockingGates: [],
			};
		};
	}

	/**
	 * Conciliación → Cierre: auto-advance if variance < 5%.
	 */
	private evaluateConciliacionAdvance(): PhaseAutoAdvanceEvaluator {
		return (ctx: AutoAdvanceContext): AutoAdvanceDecision => {
			const criticalBlockers = ctx.gateResults.filter(
				(g) => !g.passed && g.severity === "critical",
			);
			if (criticalBlockers.length > 0) {
				return {
					shouldAdvance: false,
					confidence: 0,
					reason: `Critical reconciliation errors: ${criticalBlockers.map((b) => b.reason).join("; ")}`,
					blockingGates: criticalBlockers.map((b) => b.gateId),
				};
			}

			const variance = (ctx.metadata?.variance as number) ?? 1;
			const _diffAmount = (ctx.metadata?.diffAmount as number) ?? 0;

			if (variance <= 0.01) {
				return {
					shouldAdvance: true,
					confidence: 0.99,
					reason: `Variance ${(variance * 100).toFixed(2)}% — excellent match`,
					blockingGates: [],
				};
			}

			if (variance <= 0.05) {
				return {
					shouldAdvance: true,
					confidence: 0.92,
					reason: `Variance ${(variance * 100).toFixed(2)}% within 5% threshold`,
					blockingGates: [],
				};
			}

			// Variance > 5% — needs human review
			const severityText =
				variance > 0.1
					? `Variance ${(variance * 100).toFixed(2)}% exceeds 10% — blocking`
					: `Variance ${(variance * 100).toFixed(2)}% exceeds 5% — needs review`;

			return {
				shouldAdvance: false,
				confidence: Math.max(0, 1 - variance),
				reason: severityText,
				blockingGates: [],
			};
		};
	}

	/**
	 * Cierre → Declaración: NEVER auto-advance. Human approval required.
	 */
	private evaluateCierreAdvance(): PhaseAutoAdvanceEvaluator {
		return (_ctx: AutoAdvanceContext): AutoAdvanceDecision => {
			return {
				shouldAdvance: false,
				confidence: 0,
				reason: "Monthly close requires human approval before declaration",
				blockingGates: [],
			};
		};
	}

	/**
	 * Declaración → Auditoría: NEVER auto-advance. Human review required.
	 */
	private evaluateDeclaracionAdvance(): PhaseAutoAdvanceEvaluator {
		return (_ctx: AutoAdvanceContext): AutoAdvanceDecision => {
			return {
				shouldAdvance: false,
				confidence: 0,
				reason: "Declaration results require human review before audit",
				blockingGates: [],
			};
		};
	}

	/**
	 * Auditoría → completed: auto if overall confidence >= threshold
	 * and no critical findings.
	 */
	private evaluateAuditoriaAdvance(): PhaseAutoAdvanceEvaluator {
		return (ctx: AutoAdvanceContext): AutoAdvanceDecision => {
			const confianza = (ctx.metadata?.confianza as number) ?? 0;
			const hallazgosCritical =
				(ctx.metadata?.hallazgosCritical as number) ?? 0;

			if (hallazgosCritical > 0) {
				return {
					shouldAdvance: false,
					confidence: 0.2,
					reason: `${hallazgosCritical} critical finding(s) — period cannot close automatically`,
					blockingGates: [],
				};
			}

			if (confianza >= this.config.minConfidence) {
				return {
					shouldAdvance: true,
					confidence: confianza,
					reason: `Audit confidence ${(confianza * 100).toFixed(1)}% meets threshold`,
					blockingGates: [],
				};
			}

			return {
				shouldAdvance: false,
				confidence: confianza,
				reason: `Audit confidence ${(confianza * 100).toFixed(1)}% below threshold ${(this.config.minConfidence * 100).toFixed(1)}%`,
				blockingGates: [],
			};
		};
	}

	// ─── Fallback: Evaluate by gate results only ───────────────

	private evaluateByGates(
		phaseId: FiscalPhaseId,
		ctx: AutoAdvanceContext,
	): AutoAdvanceDecision {
		const blockers = ctx.gateResults.filter(
			(g) => !g.passed && (g.severity === "error" || g.severity === "critical"),
		);

		if (blockers.length > 0) {
			return {
				shouldAdvance: false,
				confidence: 0,
				reason: `${blockers.length} gate(s) blocking auto-advance from '${phaseId}'`,
				blockingGates: blockers.map((b) => b.gateId),
			};
		}

		const warnings = ctx.gateResults.filter(
			(g) => !g.passed && g.severity === "warning",
		);

		if (this.config.blockOnWarnings && warnings.length > 0) {
			return {
				shouldAdvance: false,
				confidence: 0.7,
				reason: `${warnings.length} warning(s) with blockOnWarnings enabled`,
				blockingGates: warnings.map((w) => w.gateId),
			};
		}

		const warningText =
			warnings.length > 0 ? ` (${warnings.length} warning(s))` : "";

		return {
			shouldAdvance: true,
			confidence: 0.9,
			reason: `All gates passed for '${phaseId}'${warningText}`,
			blockingGates: [],
		};
	}
}

/** Build AutoAdvanceContext from gate results and agent output. */
export function buildAutoAdvanceContext(params: {
	ruc: string;
	periodo: string;
	phaseId: FiscalPhaseId;
	gateResults: GateResult[];
	agentOutput?: unknown;
	metadata?: Record<string, unknown>;
}): AutoAdvanceContext {
	return {
		ruc: params.ruc,
		periodo: params.periodo,
		phaseId: params.phaseId,
		gateResults: params.gateResults ?? [],
		agentOutput: params.agentOutput,
		metadata: params.metadata ?? {},
	};
}
