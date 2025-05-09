/**
 * FailureProbe — Puerto mínimo para inyección de failpoints.
 *
 * Producción usa NoopFailureProbe (default). Test-utils implementa
 * DeterministicFailureHarness con acciones concretas.
 *
 * Diseño:
 *   - Puerto mínimo: un solo método hit().
 *   - Stages como unión cerrada y contextual.
 *   - Noop por defecto: cero overhead en producción.
 *   - Exports limpios: solo interface + Noop.
 */

// ─── Stages ─────────────────────────────────────────────────────────────────

/**
 * Puntos de inyección en el flujo de un job.
 * Cada stage tiene un nombre namespaced por componente.
 */
export type FailureStage =
	// ─── OutboxRelay ──────────────────────────────────────────
	| "outbox.after-claim"
	| "outbox.before-queue-add"
	| "outbox.after-queue-add"
	| "outbox.before-pg-confirm"
	| "outbox.after-pg-confirm"
	// ─── JobRunner ────────────────────────────────────────────
	| "runner.before-acquire"
	| "runner.after-acquire"
	| "runner.before-handler"
	| "runner.after-handler"
	| "runner.before-heartbeat"
	| "runner.after-heartbeat"
	| "runner.before-complete"
	| "runner.after-complete"
	| "runner.before-fail"
	| "runner.after-fail"
	// ─── RecoverySweep ────────────────────────────────────────
	| "recovery.before-claim"
	| "recovery.after-claim"
	| "recovery.before-transition"
	| "recovery.after-transition"
	// ─── ReconciliationSweep ───────────────────────────────────
	| "reconciliation.after-detect"
	| "reconciliation.before-repair"
	| "reconciliation.after-repair";

// ─── Context ────────────────────────────────────────────────────────────────

/**
 * Contexto disponible para el failpoint en el momento del hit.
 * Todos los campos son opcionales porque el contexto exacto varía por stage.
 */
export interface FailureContext {
	executionId?: string;
	outboxId?: string;
	relayToken?: string;
	relayTokenHash?: string;
	queueName?: string;
	jobType?: string;
	generation?: number;
	attemptCount?: number;
	component?: string;
	/** Tipo de divergencia detectada por reconciliation (tipado) */
	divergenceType?: string;
	/** Tipo de reparación realizada */
	repairType?: string;
	/** Estado actual de la execution (para recovery) */
	currentStatus?: string;
	/** Policy de unicidad */
	uniquenessPolicy?: string;
	executionTokenHash?: string;
	[key: string]: unknown;
}

// ─── Puerto ─────────────────────────────────────────────────────────────────

export interface FailureProbe {
	/**
	 * Señaliza que el flujo alcanzó un punto de inyección.
	 * Lanza si el failpoint está configurado para throw/crash.
	 * Espera si el failpoint está configurado como barrier.
	 * No-op si no hay failpoint configurado o está agotado.
	 */
	hit(stage: FailureStage, context?: FailureContext): Promise<void>;
}

// ─── Noop (producción) ──────────────────────────────────────────────────────

/**
 * Implementación por defecto para producción.
 * No-op puro: nunca lanza, nunca espera.
 */
export class NoopFailureProbe implements FailureProbe {
	async hit(): Promise<void> {
		// Production: zero-overhead no-op
	}
}
