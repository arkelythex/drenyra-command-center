// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface QuickActionTask {
	title: string;
	order: number;
}

export interface QuickActionTemplate {
	title: string;
	priority: string;
	tags: string[];
	tasks: QuickActionTask[];
}

export interface QuickAction {
	id: string;
	title: string;
	description: string;
	icon: string;
	template: QuickActionTemplate;
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

export class QuickActionsService {
	getForCompany(_companyId: string, period?: string): QuickAction[] {
		const p = period ?? "current";

		return [
			{
				id: "quick-close-month",
				title: "Cerrar mes",
				description: "Iniciar cierre mensual completo",
				icon: "calendar-check",
				template: {
					title: `Cierre ${p}`,
					priority: "HIGH",
					tags: ["cierre"],
					tasks: [
						{ title: "Validar SIRE compras", order: 1 },
						{ title: "Conciliar bancos", order: 2 },
						{ title: "Preparar declaración IGV", order: 3 },
						{ title: "Cerrar mes", order: 4 },
					],
				},
			},
			{
				id: "quick-reconcile-banks",
				title: "Conciliar bancos",
				description: "Conciliar movimientos bancarios del período",
				icon: "landmark",
				template: {
					title: `Conciliación bancaria ${p}`,
					priority: "MEDIUM",
					tags: ["conciliacion", "bancos"],
					tasks: [
						{ title: "Importar movimientos bancarios", order: 1 },
						{ title: "Conciliar transacciones", order: 2 },
						{ title: "Revisar diferencias", order: 3 },
					],
				},
			},
			{
				id: "quick-validate-sire",
				title: "Validar SIRE compras",
				description: "Revisar y validar compras en SIRE",
				icon: "file-search",
				template: {
					title: `Validación SIRE compras ${p}`,
					priority: "MEDIUM",
					tags: ["sire", "compras"],
					tasks: [
						{ title: "Descargar libro de compras SIRE", order: 1 },
						{ title: "Validar consistencia", order: 2 },
						{ title: "Reportar discrepancias", order: 3 },
					],
				},
			},
			{
				id: "quick-fiscal-risks",
				title: "Buscar riesgos fiscales",
				description: "Identificar anomalías y riesgos fiscales en el período",
				icon: "search",
				template: {
					title: `Riesgos fiscales ${p}`,
					priority: "MEDIUM",
					tags: ["riesgos", "fiscal"],
					tasks: [
						{ title: "Analizar inconsistencias SUNAT", order: 1 },
						{ title: "Generar reporte de riesgos", order: 2 },
					],
				},
			},
		];
	}
}

export const quickActionsService = new QuickActionsService();
