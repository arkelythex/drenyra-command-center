/**
 * FiscalComplianceOrchestrator — orquestador de cumplimiento fiscal.
 *
 * Pipeline completo con gobierno:
 *   solicitud → análisis → diseño → plan → migración → auditoría
 *
 * Fase 2: ReviewGuard, SubAgentRunner, ComplianceChainAdapter integrados.
 *
 * @example
 * ```ts
 * const orchestrator = new FiscalComplianceOrchestrator({
 *   mode: "auto",
 *   artifactStore: "none",
 *   reviewBudget: 400,
 * });
 *
 * const result = await orchestrator.run("cambio-001", scope, metadata);
 * console.log(result.status);
 * ```
 */

import {
	createAnalisisPhase,
	createAuditoriaPhase,
	createDisenioPhase,
	createMigracionPhase,
	createPlanPhase,
	createSolicitudPhase,
} from "../phases/fsd-phases";
import { FiscalFSDRunner } from "../runner";
import type { FiscalFSDPipeline, PhaseContext, PhaseResult } from "../types";
import { createArtifactStore } from "./artifact-store";
import { ComplianceChainAdapter } from "./compliance-chain-adapter";
import { DecisionGate } from "./decision-gate";
import { ModelRouter } from "./model-router";
import { PreflightValidator } from "./preflight";
import { ReviewGuard } from "./review-guard";
import { SubAgentRunner } from "./subagent-runner";
import type {
	ArtifactStore,
	FaseArtifact,
	FaseName,
	FiscalScope,
	OrchestratorConfig,
	OrchestratorResult,
} from "./types";
import { FASES_ORDEN } from "./types";

// ============================================================================
// Types internos
// ============================================================================

interface RunContext {
	changeId: string;
	scope: FiscalScope;
	phaseArtifacts: Map<FaseName, FaseArtifact>;
}

// ============================================================================
// FiscalComplianceOrchestrator
// ============================================================================

/** Mensajes de parada: difieren entre una ejecución nueva y una reanudación. */
type PhaseMessages = {
	awaiting: (fase: FaseName, reason: string) => string;
	stopped: (fase: FaseName, errors: string[]) => string;
};

const RUN_MESSAGES: PhaseMessages = {
	awaiting: (fase, reason) => `Fase "${fase}" completada. ${reason}`,
	stopped: (fase, errors) =>
		`Pipeline detenido en fase "${fase}": ${errors.join("; ")}`,
};

const RESUME_MESSAGES: PhaseMessages = {
	awaiting: (fase, reason) =>
		`Reanudación: fase "${fase}" completada. ${reason}`,
	stopped: (fase) => `Reanudación detenida en fase "${fase}"`,
};

export class FiscalComplianceOrchestrator {
	private runner: FiscalFSDRunner;
	private modelRouter: ModelRouter;
	private artifactStore: ArtifactStore;
	private preflight: PreflightValidator;
	private decisionGate: DecisionGate;
	private reviewGuard: ReviewGuard;
	private subAgentRunner: SubAgentRunner;
	private complianceChainAdapter: ComplianceChainAdapter;
	private config: OrchestratorConfig;

	constructor(config: Partial<OrchestratorConfig> = {}) {
		this.config = {
			mode: config.mode ?? "auto",
			artifactStore: config.artifactStore ?? "none",
			reviewBudget: config.reviewBudget ?? 400,
			modelAssignments: config.modelAssignments,
			subAgents: config.subAgents ?? false,
			strictTdd: config.strictTdd ?? false,
			artifactBasePath: config.artifactBasePath,
		};

		this.runner = new FiscalFSDRunner();
		this.modelRouter = new ModelRouter(this.config.modelAssignments);
		this.artifactStore = createArtifactStore(
			this.config.artifactStore,
			this.config.artifactBasePath,
		);
		this.preflight = new PreflightValidator(this.artifactStore);
		this.decisionGate = new DecisionGate(this.config.mode);
		this.reviewGuard = new ReviewGuard(this.config.reviewBudget);
		this.subAgentRunner = new SubAgentRunner({
			enabled: this.config.subAgents ?? false,
		});
		this.complianceChainAdapter = new ComplianceChainAdapter(
			this.artifactStore,
		);
	}

	// ─── Pipeline principal ─────────────────────────────────────────

	/**
	 * Ejecuta el pipeline completo de cumplimiento fiscal.
	 */
	async run(
		changeId: string,
		scope: FiscalScope,
		metadata: Record<string, unknown> = {},
	): Promise<OrchestratorResult> {
		const ctx: RunContext = {
			changeId,
			scope,
			phaseArtifacts: new Map(),
		};

		// ── 1. Preflight ───────────────────────────────────────────────
		const preflightResult = await this.preflight.validate(changeId, scope);
		if (preflightResult.blocked) {
			return {
				status: "PREFLIGHT_BLOCKED",
				changeId,
				scope,
				message: "Pre-flight checks bloqueados",
				reasons: preflightResult.reasons,
			};
		}

		// ── 2-7. Ejecutar fases ────────────────────────────────────────
		let currentInput: unknown = { changeId, scope, metadata };

		for (const fase of FASES_ORDEN) {
			const step = await this.advancePhase(
				fase,
				currentInput,
				ctx,
				metadata,
				RUN_MESSAGES,
			);
			if ("stop" in step) return step.stop;
			currentInput = step.output;
		}

		return {
			status: "COMPLETED",
			changeId,
			scope,
			phaseArtifacts: ctx.phaseArtifacts,
			message: "Pipeline de cumplimiento fiscal completado exitosamente",
		};
	}

	/**
	 * Reanuda un pipeline desde la última fase completada.
	 */
	async resume(
		changeId: string,
		scope: FiscalScope,
		metadata: Record<string, unknown> = {},
	): Promise<OrchestratorResult> {
		const existing = await this.artifactStore.loadAll(changeId);
		const ctx: RunContext = { changeId, scope, phaseArtifacts: existing };

		const resumePoint = this.findResumePoint(existing, {
			changeId,
			scope,
			metadata,
		});
		if (resumePoint === null) {
			return {
				status: "COMPLETED",
				changeId,
				scope,
				phaseArtifacts: existing,
				message: "Pipeline ya completado anteriormente",
			};
		}

		let currentInput = resumePoint.input;
		for (const fase of FASES_ORDEN) {
			if (existing.get(fase)?.status === "SUCCESS") continue;

			const step = await this.advancePhase(
				fase,
				currentInput,
				ctx,
				metadata,
				RESUME_MESSAGES,
			);
			if ("stop" in step) return step.stop;
			currentInput = step.output;
		}

		return {
			status: "COMPLETED",
			changeId,
			scope,
			phaseArtifacts: ctx.phaseArtifacts,
			message: "Pipeline reanudado y completado exitosamente",
		};
	}

	/**
	 * Determina desde qué fase reanudar y con qué input (el output de la última
	 * fase exitosa). Devuelve null si todas las fases ya fueron exitosas.
	 */
	private findResumePoint(
		existing: Map<FaseName, FaseArtifact>,
		initial: {
			changeId: string;
			scope: FiscalScope;
			metadata: Record<string, unknown>;
		},
	): { startFrom: FaseName; input: unknown } | null {
		let input: unknown = initial;
		for (const fase of FASES_ORDEN) {
			const artifact = existing.get(fase);
			if (artifact?.status !== "SUCCESS") return { startFrom: fase, input };
			input = artifact.output;
		}
		return null;
	}

	/**
	 * Ejecuta una fase, ejecuta las compliance chains (migración), guarda su
	 * artefacto y aplica el DecisionGate. Devuelve el output para la siguiente fase
	 * o el resultado final si el pipeline debe detenerse.
	 */
	private async advancePhase(
		fase: FaseName,
		input: unknown,
		ctx: RunContext,
		metadata: Record<string, unknown>,
		messages: PhaseMessages,
	): Promise<{ stop: OrchestratorResult } | { output: unknown }> {
		const { changeId, scope } = ctx;

		// ReviewGuard: antes de migración, analizar el plan (en run y en resume)
		if (fase === "migracion") {
			const guardResult = await this.runReviewGuard(input, changeId, scope);
			if (guardResult) return { stop: guardResult };
		}

		const phaseResult = await this.executeFase(fase, input, ctx, metadata);

		// ComplianceChainAdapter: durante migración, ejecutar chains
		if (fase === "migracion" && phaseResult.status === "SUCCESS") {
			const chainResult = await this.runComplianceChains(
				phaseResult.output,
				changeId,
				scope,
				ctx,
			);
			if (chainResult) return { stop: chainResult };
		}

		// Guardar artefacto
		const artifact: FaseArtifact = {
			fase,
			status: phaseResult.status,
			input,
			output: phaseResult.output,
			gateResults: phaseResult.gatesPassed,
			evidence: phaseResult.evidenceArtifacts,
			errors: phaseResult.errors,
			confidence: phaseResult.confidence,
			ejecutadoEn: new Date().toISOString(),
			duracionMs: 0,
		};
		ctx.phaseArtifacts.set(fase, artifact);
		await this.trySaveArtifact(changeId, artifact);

		// DecisionGate
		const decision = await this.decisionGate.evaluate(fase, phaseResult);
		if (decision.requiresApproval && this.config.mode !== "auto") {
			return {
				stop: {
					status: "AWAITING_APPROVAL",
					changeId,
					scope,
					blockedAtFase: fase,
					phaseArtifacts: ctx.phaseArtifacts,
					message: messages.awaiting(fase, decision.reason),
				},
			};
		}

		// Si falló o fue bloqueada, detener
		if (phaseResult.status === "FAILED" || phaseResult.status === "BLOCKED") {
			return {
				stop: {
					status: phaseResult.status === "BLOCKED" ? "BLOCKED" : "FAILED",
					changeId,
					scope,
					blockedAtFase: fase,
					phaseArtifacts: ctx.phaseArtifacts,
					message: messages.stopped(fase, phaseResult.errors),
					reasons: phaseResult.errors,
				},
			};
		}

		return { output: phaseResult.output };
	}

	// ─── ReviewGuard ─────────────────────────────────────────────────

	/**
	 * Ejecuta ReviewGuard antes de la migración.
	 * Si el forecast excede el presupuesto, retorna un resultado de bloqueo/revisión.
	 */
	private async runReviewGuard(
		currentInput: unknown,
		changeId: string,
		scope: FiscalScope,
	): Promise<OrchestratorResult | null> {
		const forecast = this.reviewGuard.forecast(currentInput);

		if (!forecast.chainedPrsRecommended && forecast.budgetRisk === "LOW") {
			return null;
		}

		const strategy = this.resolveReviewStrategy();
		const decision = this.reviewGuard.decide(forecast, strategy);

		if (decision.action === "ask") {
			return {
				status: "REVIEW_NEEDED",
				changeId,
				scope,
				message: `Carga de revisión alta: ${forecast.estimatedLines} líneas estimadas. ${decision.reason}`,
				reviewDecision: decision,
			};
		}

		// split o proceed — continuar
		return null;
	}

	/**
	 * Resuelve la estrategia de revisión según la config.
	 */
	private resolveReviewStrategy():
		| "ask-on-risk"
		| "auto-chain"
		| "single-pr"
		| "exception-ok" {
		if (this.config.strictTdd) return "single-pr";
		if (this.config.reviewBudget > 600) return "single-pr";
		return "ask-on-risk";
	}

	// ─── Compliance Chains ───────────────────────────────────────────

	/**
	 * Ejecuta compliance chains si el cambio afecta subsistemas críticos.
	 */
	private async runComplianceChains(
		migrationOutput: unknown,
		changeId: string,
		scope: FiscalScope,
		_ctx: RunContext,
	): Promise<OrchestratorResult | null> {
		const output = (migrationOutput ?? {}) as Record<string, unknown>;
		const subsistemas = this.extractSubsystems(output);

		if (subsistemas.length === 0) return null;

		const cambio = {
			changeId,
			ruleType: "RATE" as const,
			affectedRegulation: String(output.normativa ?? "N/A"),
			oldValue: output.valorAnterior ?? null,
			newValue: output.valorNuevo ?? null,
			description: String(output.descripcion ?? ""),
		};

		const result = await this.complianceChainAdapter.runChains(
			cambio,
			subsistemas,
			scope,
		);

		if (result.blocked) {
			return {
				status: "BLOCKED",
				changeId,
				scope,
				blockedAtFase: "migracion",
				message: `Compliance chain bloqueada en stage "${result.blockedAt}"`,
				reasons: result.reports.map((r) => `${r.chainId}: ${r.status}`),
			};
		}

		return null;
	}

	/**
	 * Extrae subsistemas afectados del output de migración.
	 */
	private extractSubsystems(output: Record<string, unknown>): string[] {
		const explicit = output.subsistemasAfectados;
		if (Array.isArray(explicit)) {
			return explicit.map(String);
		}

		const tareas = output.tareasImplementadas;
		return Array.isArray(tareas) ? this.subsystemsFromTasks(tareas) : [];
	}

	/** Subsistemas (`subsistema`/`afecta`) de las tareas implementadas, sin duplicados. */
	private subsystemsFromTasks(tareas: unknown[]): string[] {
		const subsystems = new Set<string>();
		for (const tarea of tareas) {
			if (typeof tarea !== "object" || tarea === null) continue;
			const t = tarea as Record<string, unknown>;
			if (t.subsistema) subsystems.add(String(t.subsistema));
			if (t.afecta) subsystems.add(String(t.afecta));
		}
		return Array.from(subsystems);
	}

	// ─── Ejecución de fases ──────────────────────────────────────────

	/**
	 * Ejecuta una fase individual.
	 */
	private async executeFase(
		fase: FaseName,
		input: unknown,
		ctx: RunContext,
		metadata: Record<string, unknown>,
	): Promise<PhaseResult> {
		// Resolver modelo
		const caller = await this.modelRouter.resolve(fase);

		// Si sub-agents están habilitados, delegar
		if (this.subAgentRunner.getConfig().enabled) {
			return this.subAgentRunner.executePhase(
				fase,
				input,
				caller,
				ctx.scope,
				ctx.changeId,
			);
		}

		// Ejecución inline
		const pipeline = this.buildSinglePhasePipeline(fase, caller);
		const phaseCtx: Partial<PhaseContext> = {
			runId: `${ctx.changeId}-${fase}-${Date.now()}`,
			scope: ctx.scope,
			previousPhaseResults: new Map(),
			metadata,
		};

		const result = await this.runner.runPipeline(pipeline, input, phaseCtx);

		return (
			result.phaseResults[0] ?? {
				status: "FAILED",
				output: null,
				gatesPassed: [],
				evidenceArtifacts: [],
				errors: ["No se obtuvo resultado del runner"],
				confidence: 0,
			}
		);
	}

	/**
	 * Construye pipeline de una sola fase.
	 */
	private buildSinglePhasePipeline(
		fase: FaseName,
		caller: (system: string, prompt: string) => Promise<string>,
	): FiscalFSDPipeline {
		const phaseFactories: Record<
			FaseName,
			(c: typeof caller) => ReturnType<typeof createSolicitudPhase>
		> = {
			solicitud: (c) => createSolicitudPhase(c),
			analisis: (c) => createAnalisisPhase(c),
			diseno: (c) => createDisenioPhase(c),
			plan: (c) => createPlanPhase(c),
			migracion: (c) => createMigracionPhase(c),
			auditoria: (c) => createAuditoriaPhase(c),
		};

		const factory = phaseFactories[fase];
		if (!factory) {
			return {
				id: `single-${fase}`,
				name: `Fase: ${fase}`,
				onGateBlocked: "STOP",
				phases: [
					{
						name: fase,
						description: `Fase ${fase}`,
						version: "1.0.0",
						execute: async (input: unknown) => ({
							status: "SUCCESS" as const,
							output: input,
							gatesPassed: [],
							evidenceArtifacts: [],
							errors: [],
							confidence: 0.5,
						}),
					},
				],
			};
		}

		const phase = factory(caller);
		return {
			id: `single-${fase}`,
			name: FASE_LABELS[fase] ?? `Fase: ${fase}`,
			onGateBlocked: "STOP",
			phases: [phase],
		};
	}

	/**
	 * Intenta guardar un artefacto (non-blocking).
	 */
	private async trySaveArtifact(
		changeId: string,
		artifact: FaseArtifact,
	): Promise<void> {
		try {
			await this.artifactStore.save(changeId, artifact);
		} catch {
			// Non-blocking
		}
	}
}

const FASE_LABELS: Record<FaseName, string> = {
	solicitud: "Solicitud de cambio normativo",
	analisis: "Análisis regulatorio",
	diseno: "Diseño de implementación",
	plan: "Plan de migración",
	migracion: "Migración fiscal",
	auditoria: "Auditoría de cumplimiento",
};
