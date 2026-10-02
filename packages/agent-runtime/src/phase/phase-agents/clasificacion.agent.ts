// ─── Clasificación Phase Agent ───────────────────────────────────────
// Handles the Clasificación phase: PCGE account classification of CPEs,
// IGV auto-calculation, and ambiguity resolution.
//
// PR3: Real implementation with classification logic and coverage tracking.

import type { ClasificacionReport } from "../types";

/**
 * ClasificacionAgentInput — what the agent needs to classify.
 */
export interface ClasificacionAgentInput {
	ruc: string;
	periodo: string;
	cpes: Array<{
		id: string;
		tipo: string; // "factura" | "boleta" | "nota-credito" | etc.
		monto: number;
		fecha: string;
		proveedorRuc?: string;
	}>;
}

/**
 * Default PCGE account mapping by comprobante type.
 */
const DEFAULT_PCGE_MAP: Record<string, string> = {
	factura: "60", // Compras
	boleta: "60", // Compras (menor cuantía)
	"nota-credito": "61", // Devoluciones
	"nota-debito": "62", // Cargos
	recibo: "63", // Servicios
	planilla: "64", // Planillas
};

/**
 * ClasificacionAgent — classifies fiscal documents into PCGE accounts.
 *
 * For each CPE:
 * 1. Determines PCGE account based on document type + rules
 * 2. Calculates IGV (18% for most operations)
 * 3. Flags ambiguous documents for human review
 * 4. Returns coverage metrics
 */
export class ClasificacionAgent {
	/**
	 * Execute the classification phase.
	 */
	async execute(input: ClasificacionAgentInput): Promise<ClasificacionReport> {
		const clasificaciones: Array<{
			comprobanteId: string;
			cuentaPCGE: string;
			confianza: number;
			igvCalculado: number;
		}> = [];

		let totalAmbiguos = 0;

		for (const cpe of input.cpes) {
			const cuentaBase = DEFAULT_PCGE_MAP[cpe.tipo] ?? "99"; // 99 = Other
			const confianza = cuentaBase === "99" ? 0.3 : 0.85;
			const igvCalculado = this.calcularIGV(cpe.monto, cpe.tipo);

			if (confianza < 0.6) {
				totalAmbiguos++;
			}

			clasificaciones.push({
				comprobanteId: cpe.id,
				cuentaPCGE: cuentaBase,
				confianza,
				igvCalculado,
			});
		}

		const totalProcesados = input.cpes.length;
		const totalClasificados = clasificaciones.filter(
			(c) => c.confianza >= 0.6,
		).length;
		const cobertura =
			totalProcesados > 0 ? totalClasificados / totalProcesados : 1;

		return {
			phaseId: "clasificacion",
			ruc: input.ruc,
			periodo: input.periodo,
			success: true,
			summary: `Clasificación: ${totalClasificados}/${totalProcesados} CPEs clasificados (${(cobertura * 100).toFixed(1)}% cobertura)`,
			data: {
				totalProcesados,
				totalClasificados,
				totalAmbiguos,
				cobertura,
				clasificaciones,
			},
		};
	}

	/**
	 * Calculate IGV (18%) for a transaction.
	 * Returns 0 for exempt operations.
	 */
	private calcularIGV(monto: number, tipo: string): number {
		// Exportaciones and some operations are IGV-exempt
		if (tipo === "exportacion" || tipo === "operacion-no-gravada") {
			return 0;
		}
		// IGV = 18% of taxable base (monto / 1.18)
		const baseImponible = monto / 1.18;
		return Math.round(baseImponible * 0.18 * 100) / 100;
	}
}
