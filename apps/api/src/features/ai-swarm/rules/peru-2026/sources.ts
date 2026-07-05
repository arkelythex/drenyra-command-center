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
			"SUNAT - Resolución 000392-2025/SUNAT (SIRE desde junio 2026 para PRICOS >= 2,300 UIT)",
		url: "https://www.sunat.gob.pe/legislacion/superin/2025/392-2025.pdf",
	},
	sireRsnati0000052026: {
		title:
			"SUNAT - RSNATI 000005-2026 (facultad discrecional y adaptación SIRE 2026)",
		url: "https://www.sunat.gob.pe/legislacion/superAdjunta/rsnati/2026/rsnati-000005-2026.pdf",
	},
	sirePortal: {
		title: "SUNAT - Sistema Integrado de Registros Electrónicos (SIRE)",
		url: "https://www.sunat.gob.pe/soluciones_empresas/sire/",
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
