/**
 * useCierreMensual — hook for monthly close mission data.
 *
 * Returns mock mission data for the vertical slice.
 * Will be replaced with real TanStack Query + backend when the
 * AccountingMission entity is connected.
 */

export interface CierreMensualMission {
	id: string;
	companyId: string;
	companyName: string;
	companyRuc: string;
	periodo: string;
	progress: number;
	startedAt: string;
	globalRiskLevel: string;
	checklist: Array<{ id: string; label: string; completado: boolean }>;
	blockers: Array<{
		id: string;
		reason: string;
		severity: string;
		resolved: boolean;
	}>;
	firmas: Record<string, { firmado: boolean }>;
	timeline: Array<{
		id: string;
		type: string;
		label: string;
		timestamp: string;
		actor: string;
	}>;
	agentAnalysis?: {
		agentId: string;
		agentName: string;
		confidence: number;
		summary: string;
		recommendations: string[];
		discrepancies: number;
	};
}

export function useCierreMensual(): {
	data: CierreMensualMission | null;
	isLoading: boolean;
	isError: boolean;
} {
	const mockMission: CierreMensualMission = {
		id: "mission-close-2026-03",
		companyId: "1",
		companyName: "Arkelythex SAC",
		companyRuc: "20123456789",
		periodo: "Marzo 2026",
		progress: 0.65,
		startedAt: "2026-04-01T08:00:00Z",
		globalRiskLevel: "MEDIUM",
		checklist: [
			{ id: "c1", label: "Importar movimientos bancarios", completado: true },
			{ id: "c2", label: "Conciliar cuenta corriente", completado: true },
			{ id: "c3", label: "Validar facturas electrónicas", completado: true },
			{ id: "c4", label: "Calcular IGV del período", completado: false },
			{ id: "c5", label: "Revisar detracciones", completado: false },
			{ id: "c6", label: "Conciliar SIRE mensual", completado: false },
			{ id: "c7", label: "Generar estados financieros", completado: false },
			{ id: "c8", label: "Obtener firmas de cierre", completado: false },
		],
		blockers: [
			{
				id: "b1",
				reason: "3 facturas electrónicas sin CDR de SUNAT",
				severity: "high",
				resolved: false,
			},
			{
				id: "b2",
				reason: "Diferencia en conciliación bancaria: S/ 1,250.00",
				severity: "medium",
				resolved: false,
			},
		],
		firmas: {
			"contador-general": { firmado: true },
			"gerente-financiero": { firmado: false },
		},
		timeline: [
			{
				id: "t1",
				type: "system",
				label: "Inicio del proceso de cierre",
				timestamp: "2026-04-01T08:00:00Z",
				actor: "Sistema",
			},
			{
				id: "t2",
				type: "agent",
				label: "Importación de movimientos completada (428 comprobantes)",
				timestamp: "2026-04-01T08:15:00Z",
				actor: "@drenyra/pi",
			},
			{
				id: "t3",
				type: "agent",
				label: "Conciliación bancaria: 1 diferencia detectada",
				timestamp: "2026-04-01T08:30:00Z",
				actor: "@drenyra/pi",
			},
			{
				id: "t4",
				type: "user",
				label: "Revisión de facturas pendientes",
				timestamp: "2026-04-01T09:00:00Z",
				actor: "Usuario",
			},
		],
		agentAnalysis: {
			agentId: "pi-close-agent",
			agentName: "@drenyra/pi",
			confidence: 0.87,
			summary:
				"Proceso de cierre avanzado al 65%. Se detectaron 2 bloqueos y 3 facturas sin CDR. Se recomienda revisar las discrepancias antes de proceder con el cálculo de IGV.",
			recommendations: [
				"Revisar facturas electrónicas sin CDR (3 unidades)",
				"Resolver diferencia bancaria de S/ 1,250.00",
				"Completar cálculo de IGV después de resolver bloqueos",
			],
			discrepancies: 2,
		},
	};

	return {
		data: mockMission,
		isLoading: false,
		isError: false,
	};
}
