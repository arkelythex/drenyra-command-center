import { SOURCES_2026 } from "./sources";
import type { PeruRule2026 } from "./types";

/**
 * SIRE_RULES_2026 const.
 *
 * @example
 * ```ts
 * console.log(SIRE_RULES_2026);
 * ```
 */
export const SIRE_RULES_2026: PeruRule2026[] = [
	{
		id: "SIRE-001",
		domain: "sire",
		status: "active",
		severity: "high",
		summary: "SIRE genera mensualmente las propuestas del RVIE y del RCE.",
		effectiveFrom: "2026-01-01",
		tags: ["rvie", "rce", "periodicidad"],
		sources: [SOURCES_2026.sireInformationPage],
	},
	{
		id: "SIRE-002",
		domain: "sire",
		status: "active",
		severity: "high",
		summary:
			"Los PRICOS no exceptuados con ingresos > 2,300 UIT inician SIRE obligatorio en el periodo octubre 2026.",
		effectiveFrom: "2026-10-01",
		tags: ["prico", "2300-uit", "obligatoriedad"],
		sources: [SOURCES_2026.sireRs1252026],
	},
	{
		id: "SIRE-003",
		domain: "sire",
		status: "active",
		severity: "high",
		summary:
			"La obligación SIRE aplicable a los PRICOS se determina según la designación al 31/12/2024 y los ingresos netos del ejercicio 2024.",
		effectiveFrom: "2026-01-01",
		tags: ["prico", "clasificacion"],
		sources: [SOURCES_2026.sireInformationPage],
	},
	{
		id: "SIRE-004",
		domain: "sire",
		status: "active",
		severity: "medium",
		summary:
			"La propuesta RVIE/RCE debe aceptarse, reemplazarse o complementarse antes del cierre mensual.",
		effectiveFrom: "2026-01-01",
		tags: ["propuesta", "cierre", "control-mensual"],
		sources: [SOURCES_2026.sireInformationPage],
	},
	{
		id: "SIRE-005",
		domain: "sire",
		status: "active",
		severity: "high",
		summary:
			"Toda inconsistencia entre CPE y registro mensual debe generar alerta preventiva de cierre.",
		effectiveFrom: "2026-01-01",
		tags: ["inconsistencia", "cpe", "alerta"],
		sources: [SOURCES_2026.sirePortal],
	},
	{
		id: "SIRE-006",
		domain: "sire",
		status: "active",
		severity: "medium",
		summary:
			"El motor debe conservar trazabilidad de cambios sobre la propuesta para auditoría.",
		effectiveFrom: "2026-01-01",
		tags: ["auditoria", "trazabilidad"],
		sources: [SOURCES_2026.sirePortal],
	},
	{
		id: "SIRE-007",
		domain: "sire",
		status: "active",
		severity: "medium",
		summary:
			"Toda factura aceptada debe mapearse a periodo tributario único para evitar duplicidad de registro.",
		effectiveFrom: "2026-01-01",
		tags: ["periodo", "duplicidad"],
		sources: [SOURCES_2026.sirePortal],
	},
	{
		id: "SIRE-008",
		domain: "sire",
		status: "active",
		severity: "high",
		summary:
			"Los PRICOS con ingresos > 2,300 UIT continúan con SLE-PLE o SLE-Portal, según corresponda, hasta septiembre de 2026 y transitan a SIRE desde octubre de 2026.",
		effectiveFrom: "2026-10-01",
		tags: ["transicion", "umbral", "riesgo"],
		sources: [SOURCES_2026.sireRs1252026],
	},
	{
		id: "SIRE-009",
		domain: "sire",
		status: "active",
		severity: "medium",
		summary:
			"RSNATI 000005-2026 amplía la facultad discrecional para infracciones de RVIE/RCE en el periodo de adaptación 2026.",
		effectiveFrom: "2026-01-01",
		tags: ["discrecionalidad", "adaptacion", "sanciones"],
		sources: [SOURCES_2026.sireRsnati0000052026],
	},
];
