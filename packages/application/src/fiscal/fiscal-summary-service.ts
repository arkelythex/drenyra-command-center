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
// Acumulación de totales (una transacción a la vez, en orden)
// ============================================================================

type Classification = FiscalTransaction["classification"];

interface Totals {
	ventasGravadas: number;
	ventasExoneradas: number;
	ventasInafectas: number;
	igvVentas: number;
	comprasGravadas: number;
	igvCompras: number;
	totalDetracciones: number;
	detraccionesPendientes: number;
	totalPercepciones: number;
	totalRetenciones: number;
	pendingReview: number;
}

function emptyTotals(): Totals {
	return {
		ventasGravadas: 0,
		ventasExoneradas: 0,
		ventasInafectas: 0,
		igvVentas: 0,
		comprasGravadas: 0,
		igvCompras: 0,
		totalDetracciones: 0,
		detraccionesPendientes: 0,
		totalPercepciones: 0,
		totalRetenciones: 0,
		pendingReview: 0,
	};
}

/** Nota: `ventasGravadas` suma toda la base de ventas (incluye exoneradas e inafectas). */
function accumulate(t: Totals, c: Classification): void {
	if (c.sireCategory === "VENTAS") {
		t.ventasGravadas += c.baseImponible;
		t.igvVentas += c.igvAmount;
		if (c.igvTreatment === "EXONERADO") t.ventasExoneradas += c.baseImponible;
		if (c.igvTreatment === "INAFECTO") t.ventasInafectas += c.baseImponible;
	} else {
		t.comprasGravadas += c.baseImponible;
		t.igvCompras += c.igvAmount;
	}

	if (c.detraccion.aplica) {
		t.totalDetracciones += c.detraccion.monto;
		if (c.detraccion.estado === "PENDIENTE") {
			t.detraccionesPendientes += c.detraccion.monto;
		}
	}
	if (c.percepcion.aplica) t.totalPercepciones += c.percepcion.monto;
	if (c.retencion.aplica) t.totalRetenciones += c.retencion.monto;
	if (c.confidence < 0.7) t.pendingReview++;
}

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

		const totals = emptyTotals();
		for (const tx of transactions) {
			accumulate(totals, tx.classification);
		}

		const {
			ventasGravadas,
			ventasExoneradas,
			ventasInafectas,
			igvVentas,
			comprasGravadas,
			igvCompras,
			totalDetracciones,
			detraccionesPendientes,
			totalPercepciones,
			totalRetenciones,
			pendingReview,
		} = totals;

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
