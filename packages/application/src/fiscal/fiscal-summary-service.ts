/**
 * FiscalSummaryService — genera resúmenes fiscales por período.
 *
 * Toma transacciones clasificadas por el FiscalClassificationEngine
 * y produce:
 * - FiscalPeriodSummary (IGV a pagar, detracciones, etc.)
 * - FiscalHealthScore (score 0-100 con breakdown)
 *
 * @example
 * ```ts
 * const summary = FiscalSummaryService.computeSummary(transactions, "2026-07", "20123456786");
 * console.log(summary.igvAPagar); // 1250.00
 * console.log(summary.healthScore.overall); // 85
 * ```
 */

import type {
	FiscalHealthScore,
	FiscalPeriodSummary,
	FiscalTransaction,
} from "@drenyra/domain/fiscal";

// ============================================================================
// FiscalSummaryService
// ============================================================================

export class FiscalSummaryService {
	/**
	 * Computa el resumen fiscal de un conjunto de transacciones para un período.
	 */
	static computeSummary(
		transactions: FiscalTransaction[],
	): FiscalPeriodSummary {
		const firstTx = transactions[0];
		const periodo = firstTx?.classification.periodo ?? "";
		const companyRuc = firstTx?.companyRuc ?? "";

		let ventasGravadas = 0;
		let ventasExoneradas = 0;
		let ventasInafectas = 0;
		let igvVentas = 0;
		let comprasGravadas = 0;
		let igvCompras = 0;
		let totalDetracciones = 0;
		let detraccionesPendientes = 0;
		let totalPercepciones = 0;
		let totalRetenciones = 0;
		let pendingReview = 0;

		for (const tx of transactions) {
			const c = tx.classification;

			if (c.sireCategory === "VENTAS") {
				ventasGravadas += c.baseImponible;
				igvVentas += c.igvAmount;

				if (c.igvTreatment === "EXONERADO") ventasExoneradas += c.baseImponible;
				if (c.igvTreatment === "INAFECTO") ventasInafectas += c.baseImponible;
			} else {
				comprasGravadas += c.baseImponible;
				igvCompras += c.igvAmount;
			}

			if (c.detraccion.aplica) {
				totalDetracciones += c.detraccion.monto;
				if (c.detraccion.estado === "PENDIENTE") {
					detraccionesPendientes += c.detraccion.monto;
				}
			}

			if (c.percepcion.aplica) totalPercepciones += c.percepcion.monto;
			if (c.retencion.aplica) totalRetenciones += c.retencion.monto;

			if (c.confidence < 0.7) pendingReview++;
		}

		const igvAPagar = Math.max(0, igvVentas - igvCompras);
		const igvAFavor = Math.max(0, igvCompras - igvVentas);

		return {
			periodo,
			companyRuc,
			ventasGravadas,
			ventasExoneradas,
			ventasInafectas,
			igvVentas,
			comprasGravadas,
			igvCompras,
			igvAPagar,
			igvAFavor,
			totalDetracciones,
			detraccionesPendientes,
			totalPercepciones,
			totalRetenciones,
			transactionCount: transactions.length,
			pendingReview,
			generatedAt: new Date().toISOString(),
		};
	}

	/**
	 * Computa el FiscalHealthScore a partir del resumen.
	 */
	static computeHealthScore(
		summary: FiscalPeriodSummary,
		anomaliesCount: number = 0,
	): FiscalHealthScore {
		// Reproducibilidad SIRE (0-40): basado en pendingReview
		const sireReproducibility =
			summary.pendingReview === 0
				? 40
				: Math.max(0, 40 - summary.pendingReview * 5);

		// Anomalías (0-30): menos anomalías = mejor score
		const anomaliesScore = Math.max(0, 30 - anomaliesCount * 5);

		// Puntualidad (0-20): basado en detracciones pendientes
		const timeliness =
			summary.detraccionesPendientes === 0
				? 20
				: Math.max(0, 20 - Math.floor(summary.detraccionesPendientes / 100));

		// Cumplimiento (0-10): si hay IGV a pagar, está cumpliendo
		const compliance = summary.igvAPagar > 0 || summary.igvAFavor > 0 ? 10 : 5;

		const overall =
			sireReproducibility + anomaliesScore + timeliness + compliance;

		const alerts: FiscalHealthScore["alerts"] = [];

		if (summary.pendingReview > 10) {
			alerts.push({
				severity: "WARNING",
				message: `${summary.pendingReview} transacciones requieren revisión`,
				affectedArea: "classification",
			});
		}

		if (summary.detraccionesPendientes > 1000) {
			alerts.push({
				severity: "CRITICAL",
				message: `Detracciones pendientes: S/ ${summary.detraccionesPendientes.toFixed(2)}`,
				affectedArea: "detracciones",
			});
		}

		if (summary.pendingReview > 0 && summary.pendingReview <= 10) {
			alerts.push({
				severity: "INFO",
				message: `${summary.pendingReview} transacción(es) por revisar`,
				affectedArea: "classification",
			});
		}

		return {
			companyRuc: summary.companyRuc,
			periodo: summary.periodo,
			overall,
			components: {
				sireReproducibility,
				anomaliesScore,
				timeliness,
				compliance,
			},
			alerts,
			generatedAt: new Date().toISOString(),
		};
	}
}
