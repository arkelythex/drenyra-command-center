/**
 * ActivePipelinePanel — Tipos para el componente.
 *
 * Refleja los tipos del dominio (packages/domain/src/fiscal/pipeline-dashboard.types.ts)
 * para mantener el componente libre de dependencias del backend.
 */

export interface ActiveChange {
	changeId: string;
	title: string;
	regulationRef?: string;
	companyRuc: string;
	period: string;
	currentFase: string;
	status:
		| "COMPLETED"
		| "PREFLIGHT_BLOCKED"
		| "AWAITING_APPROVAL"
		| "FAILED"
		| "BLOCKED"
		| "REVIEW_NEEDED"
		| "RUNNING";
	startedAt: string;
	updatedAt: string;
	needsApproval: boolean;
	approvalFase?: string;
	artifactCount: number;
}
