/**
 * Pipeline Dashboard Types — para el dashboard de cambios activos.
 *
 * Estos tipos se comparten entre API (Elysia) y Web (React) para
 * mostrar el timeline de cambios normativos activos, fase actual,
 * estado de aprobación, y artefactos generados.
 */

/** Estado visible de un cambio normativo en el dashboard. */
export interface ActiveChange {
	/** ID único del cambio. */
	changeId: string;
	/** Título del cambio (del metadata). */
	title: string;
	/** Referencia normativa (ley, artículo). */
	regulationRef?: string;
	/** RUC de la compañía. */
	companyRuc: string;
	/** Período fiscal. */
	period: string;
	/** Fase actual (la última ejecutada o en progreso). */
	currentFase: string;
	/** Estado general del pipeline. */
	status:
		| "COMPLETED"
		| "PREFLIGHT_BLOCKED"
		| "AWAITING_APPROVAL"
		| "FAILED"
		| "BLOCKED"
		| "REVIEW_NEEDED"
		| "RUNNING";
	/** Cuándo se inició. */
	startedAt: string;
	/** Cuándo se actualizó por última vez. */
	updatedAt: string;
	/** Si requiere aprobación humana. */
	needsApproval: boolean;
	/** Fase que requiere aprobación. */
	approvalFase?: string;
	/** Número de artefactos generados. */
	artifactCount: number;
}

/** Detalle completo de un cambio. */
export interface ActiveChangeDetail extends ActiveChange {
	/** Artefactos por fase. */
	artifacts: Array<{
		fase: string;
		status: string;
		confidence: number;
		ejecutadoEn: string;
		errors: string[];
	}>;
	/** Razones de bloqueo (si aplica). */
	blockReasons?: string[];
}

/** Timeline de cambios activos — respuesta de API. */
export interface PipelineDashboardData {
	/** Cambios activos (en progreso o pendientes de aprobación). */
	active: ActiveChange[];
	/** Cambios completados recientemente. */
	recent: ActiveChange[];
	/** Métricas del pipeline. */
	metrics: {
		totalActive: number;
		totalCompleted: number;
		pendingApproval: number;
		blockedCount: number;
		averageConfidence: number;
	};
}
