import type { PeruRuleSource } from "./types";

/**
 * SOURCES_2026 const.
 *
 * @example
 * ```ts
 * console.log(SOURCES_2026);
 * ```
 */
export const SOURCES_2026 = {
	sireRs3922025: {
		title:
			"SUNAT - Resolución 000392-2025/SUNAT (postergación histórica del SIRE a junio de 2026 para PRICOS con ingresos > 2,300 UIT)",
		url: "https://www.sunat.gob.pe/legislacion/superin/2025/000392-2025.pdf",
	},
	sireRs1252026: {
		title:
			"SUNAT - Resolución 000125-2026/SUNAT (postergación del SIRE a octubre de 2026 para PRICOS con ingresos > 2,300 UIT)",
		url: "https://www.sunat.gob.pe/legislacion/superin/2026/000125-2026.pdf",
	},
	sireRsnati0000052026: {
		title:
			"SUNAT - RSNATI 000005-2026 (facultad discrecional y adaptación SIRE 2026)",
		url: "https://www.sunat.gob.pe/legislacion/superAdjunta/rsnati/2026/rsnati-000005-2026.pdf",
	},
	sireInformationPage: {
		title:
			"SUNAT CPE - Sistema Integrado de Registros Electrónicos (SIRE): RVIE y RCE",
		url: "https://cpe.sunat.gob.pe/node/139",
	},
	sirePortal: {
		title:
			"SUNAT - Portal del Sistema Integrado de Registros Electrónicos (SIRE)",
		url: "https://sire.sunat.gob.pe/",
	},
	cpeNotaDebito: {
		title:
			"SUNAT CPE - Nota de Débito Electrónica (validaciones de receptor y referencia)",
		url: "https://orientacion.sunat.gob.pe/preguntas-frecuentes-nota-de-debito-electronica",
	},
	rucNoHallado: {
		title: "SUNAT - Consulta estado No Hallado / No Habido",
		url: "https://www.sunat.gob.pe/ol-ti-itmrconsruc/jcrS03Alias",
	},
	rentaGastosRuc: {
		title: "SUNAT - Gastos deducibles y requisitos de RUC activo/habido",
		url: "https://www.sunat.gob.pe/campanas/renta/5ta-categoria/gastos-deducibles.html",
	},
	projectBoletosAereos2026: {
		title:
			"SUNAT - Proyecto RS 000002-2026 (declaración informativa boletos aéreos)",
		url: "https://www.sunat.gob.pe/legislacion/proyectos_superin/2026/proyecto-000002-2026.pdf",
	},
} as const satisfies Record<string, PeruRuleSource>;
