import { OverviewService } from "../application/services/overview.service";

interface InboxPhase {
	name: string;
	state: "completed" | "active" | "blocked" | "pending";
	evidenceCount: number;
}

interface InboxDashboardResponse {
	companyName: string;
	companyRuc: string;
	period: string;
	closeStatus: string;
	closeDeadline: string;
	phaseProgress: InboxPhase[];
	primaryDecision: {
		id: string;
		title: string;
		cause: string;
		impact: string;
		evidenceSummary: string;
		deadline: string;
		priority: string;
		module: string;
		actionTo: string;
	};
	secondaryDecisions: Array<{
		id: string;
		title: string;
		impact: string;
		priority: string;
		deadline: string;
		module: string;
		actionTo: string;
	}>;
	approvals: Array<{
		id: string;
		title: string;
		type: string;
		confidence: string;
		evidence: string;
	}>;
	agents: Array<{
		id: string;
		name: string;
		status: "running" | "waiting" | "completed";
		operation: string;
		evidence: string;
		finding: string;
		nextStep: string;
	}>;
	recommendations: Array<{
		id: string;
		title: string;
		confidence: string;
		reason: string;
		scope: string;
		closeImpact: string;
	}>;
	recentActivity: Array<{
		id: string;
		time: string;
		description: string;
		evidence: string;
	}>;
	companiesAttention: Array<{
		id: string;
		name: string;
		ruc: string;
		riskCause: string;
		blockers: number;
		approvals: number;
	}>;
	blockerCount: number;
	approvalCount: number;
}

const PHASE_NAMES = [
	"Importación",
	"Validación",
	"Conciliación",
	"Revisión",
	"Impuestos",
	"Reportes",
	"Declaración",
	"Archivo",
] as const;

/**
 * InboxDashboardService — aggregates KPIs and context for the Inbox / Home command center.
 */
export const InboxDashboardService = {
	async getDashboard(companyId: string): Promise<InboxDashboardResponse> {
		const systemStatus = await OverviewService.getSystemStatus();
		const processedDocs =
			(systemStatus as { totalDocuments?: number }).totalDocuments ?? 428;
		const formattedRuc = companyId.length === 11 ? companyId : "20123456789";

		return {
			companyName: "Drenyra Consulting SAC",
			companyRuc: formattedRuc,
			period: "Julio 2026",
			closeStatus: "Requiere decisión contable",
			closeDeadline: "Vence hoy · 17:00",
			phaseProgress: PHASE_NAMES.map((name, index) => ({
				name,
				state:
					index < 3
						? "completed"
						: index === 3
							? "active"
							: index === 4
								? "blocked"
								: "pending",
				evidenceCount: Math.max(0, processedDocs - index * 50),
			})),
			primaryDecision: {
				id: "sire-mismatch",
				title: "Resolver 3 inconsistencias entre SIRE y comprobantes",
				cause:
					"Los CDR de F001-456, F001-457 y B002-123 no coinciden con el registro de ventas.",
				impact: "Bloquea la validación del IGV y la declaración del período.",
				evidenceSummary: "3 XML, 3 CDR y 1 cruce SIRE disponibles.",
				deadline: "Vence hoy · 17:00",
				priority: "P0",
				module: "sire",
				actionTo: "/review-queue",
			},
			secondaryDecisions: [
				{
					id: "bank-match",
					title: "Aprobar 2 conciliaciones bancarias propuestas",
					impact: "Permite completar la fase de conciliación.",
					priority: "P1",
					deadline: "Hoy",
					module: "conciliacion",
					actionTo: "/review-queue",
				},
				{
					id: "expense-review",
					title: "Clasificar 12 gastos con deducibilidad pendiente",
					impact: "Reduce observaciones antes del cierre.",
					priority: "P2",
					deadline: "Antes de impuestos",
					module: "compras",
					actionTo: "/compliance",
				},
			],
			approvals: [
				{
					id: "approval-1",
					title: "Conciliación de abono BCP S/ 8,420",
					type: "Conciliación",
					confidence: "Alta",
					evidence: "Monto exacto, fecha coincidente y factura F001-457.",
				},
				{
					id: "approval-2",
					title: "Aplicar detracción a proveedor recurrente",
					type: "Impuestos",
					confidence: "Media",
					evidence: "Historial del proveedor y regla SPOT.",
				},
			],
			agents: [
				{
					id: "agent-classifier",
					name: "Clasificador contable",
					status: "running",
					operation:
						"Contrasta 142 compras contra el plan contable y reglas IGV.",
					evidence: "XML, RUC de proveedores y reglas de periodificación.",
					finding: "18 compras requieren cuenta analítica.",
					nextStep: "Enviar 18 propuestas a revisión humana.",
				},
				{
					id: "agent-sunat",
					name: "Validador SUNAT",
					status: "completed",
					operation: "Validó CDR y estado SUNAT de 428 comprobantes.",
					evidence: "CDR, XML y consulta de estado.",
					finding: "Detectó 3 inconsistencias SIRE.",
					nextStep: "Esperar decisión del contador sobre el P0.",
				},
				{
					id: "agent-bank",
					name: "Conciliador bancario",
					status: "waiting",
					operation:
						"Preparó dos coincidencias de banco con respaldo documental.",
					evidence: "Estado BCP, monto y fecha de comprobantes.",
					finding: "Dos propuestas superan el umbral de revisión.",
					nextStep: "Esperar aprobación para registrar la conciliación.",
				},
			],
			recommendations: [
				{
					id: "recommendation-classify",
					title: "Clasificar 142 compras antes de impuestos",
					confidence: "Alta",
					reason:
						"Coincidencia entre XML, patrón histórico y cuenta contable en 124 casos.",
					scope: "142 compras · julio 2026",
					closeImpact:
						"Reduce la revisión manual y prepara la fase de impuestos.",
				},
				{
					id: "recommendation-detraccion",
					title: "Revisar detracciones de 3 proveedores",
					confidence: "Media",
					reason:
						"La regla SPOT coincide, pero el servicio requiere confirmación humana.",
					scope: "S/ 4,200 · 3 proveedores",
					closeImpact: "Evita una observación antes de la declaración.",
				},
			],
			recentActivity: [
				{
					id: "activity-1",
					time: "Hace 8 min",
					description: "Validador SUNAT terminó la revisión de CDR.",
					evidence: "428 CDR revisados · 3 inconsistencias detectadas.",
				},
				{
					id: "activity-2",
					time: "Hace 19 min",
					description: "Se generaron 2 propuestas de conciliación bancaria.",
					evidence: "BCP · estados y comprobantes vinculados.",
				},
				{
					id: "activity-3",
					time: "Hace 41 min",
					description: "Se importaron comprobantes del período.",
					evidence: "428 XML aceptados · fuente OSE.",
				},
			],
			companiesAttention: [
				{
					id: "drenyra-sac",
					name: "Drenyra Consulting SAC",
					ruc: formattedRuc,
					riskCause: "3 inconsistencias SIRE bloquean la validación de IGV.",
					blockers: 1,
					approvals: 2,
				},
				{
					id: "lucuma-sac",
					name: "Restaurante Lúcuma SAC",
					ruc: "20987654321",
					riskCause: "Faltan estados bancarios para conciliar junio.",
					blockers: 0,
					approvals: 4,
				},
			],
			blockerCount: 1,
			approvalCount: 2,
		};
	},
};
