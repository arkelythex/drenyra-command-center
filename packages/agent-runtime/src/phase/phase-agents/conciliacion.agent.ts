// ─── Conciliación Phase Agent ────────────────────────────────────────
// Handles bank reconciliation: matches classified entries against
// bank statements, flags discrepancies, and computes variance.
//
// PR3: Real implementation with matching logic and variance tracking.

import type { ConciliacionReport } from "../types";

/**
 * ConciliacionAgentInput — what the agent needs to reconcile.
 */
export interface ConciliacionAgentInput {
	ruc: string;
	periodo: string;
	transaccionesLibro: Array<{
		id: string;
		monto: number;
		fecha: string;
		descripcion: string;
	}>;
	movimientosBanco: Array<{
		id: string;
		monto: number;
		fecha: string;
		referencia: string;
	}>;
	saldoLibro?: number;
	saldoBanco?: number;
	tolerance?: number; // matching tolerance in soles (default: 0.50)
}

/**
 * A matched pair between a book transaction and a bank movement.
 */
interface MatchingResult {
	pares: Array<{
		transaccionId: string;
		movimientoId: string;
		monto: number;
		confianza: number;
	}>;
	noConciliadosLibro: Array<{ id: string; monto: number; descripcion: string }>;
	noConciliadosBanco: Array<{ id: string; monto: number; referencia: string }>;
}

/**
 * ConciliacionAgent — matches book entries against bank statements.
 *
 * Matching algorithm:
 * 1. Exact match by amount + date window (±2 days)
 * 2. Fuzzy match by amount only (with tolerance)
 * 3. Unmatched entries become discrepancies
 * 4. Computes variance = |saldoLibro - saldoBanco| / saldoLibro
 */
export class ConciliacionAgent {
	private readonly DEFAULT_TOLERANCE = 0.5;
	private readonly DATE_WINDOW_DAYS = 2;

	/**
	 * Execute the reconciliation phase.
	 */
	async execute(input: ConciliacionAgentInput): Promise<ConciliacionReport> {
		const tolerance = input.tolerance ?? this.DEFAULT_TOLERANCE;
		const matchingResult = this.matchTransactions(
			input.transaccionesLibro,
			input.movimientosBanco,
			tolerance,
		);

		const totalPairs = matchingResult.pares.length;
		const totalDiscrepancias =
			matchingResult.noConciliadosLibro.length +
			matchingResult.noConciliadosBanco.length;

		// Compute balances
		const saldoLibro =
			input.saldoLibro ??
			input.transaccionesLibro.reduce((s, t) => s + t.monto, 0);
		const saldoBanco =
			input.saldoBanco ??
			input.movimientosBanco.reduce((s, m) => s + m.monto, 0);
		const diferencia = Math.abs(saldoLibro - saldoBanco);
		const variance = saldoLibro !== 0 ? diferencia / Math.abs(saldoLibro) : 0;

		const detalleDiscrepancias = [
			...matchingResult.noConciliadosLibro.map((t) => ({
				id: t.id,
				monto: t.monto,
				tipo: "libro-sin-banco" as const,
				descripcion: t.descripcion,
			})),
			...matchingResult.noConciliadosBanco.map((m) => ({
				id: m.id,
				monto: m.monto,
				tipo: "banco-sin-libro" as const,
				descripcion: m.referencia,
			})),
		];

		return {
			phaseId: "conciliacion",
			ruc: input.ruc,
			periodo: input.periodo,
			success: true,
			summary: `Conciliación: ${totalPairs}/${input.transaccionesLibro.length + input.movimientosBanco.length} pares conciliados, ${totalDiscrepancias} discrepancias, variance=${(variance * 100).toFixed(2)}%`,
			data: {
				totalTransacciones:
					input.transaccionesLibro.length + input.movimientosBanco.length,
				paresConciliados: totalPairs,
				discrepancias: totalDiscrepancias,
				saldoLibro,
				saldoBanco,
				diferencia,
				variance,
				detalleDiscrepancias,
			},
		};
	}

	/**
	 * Match book transactions against bank movements.
	 */
	private matchTransactions(
		libro: ConciliacionAgentInput["transaccionesLibro"],
		banco: ConciliacionAgentInput["movimientosBanco"],
		tolerance: number,
	): MatchingResult {
		const pares: MatchingResult["pares"] = [];
		const bancoUsados = new Set<string>();

		// Phase 1: Exact match by amount
		for (const t of libro) {
			const match = banco.find(
				(m) =>
					!bancoUsados.has(m.id) &&
					Math.abs(m.monto - t.monto) <= tolerance &&
					this.isWithinDateWindow(t.fecha, m.fecha),
			);

			if (match) {
				pares.push({
					transaccionId: t.id,
					movimientoId: match.id,
					monto: t.monto,
					confianza: 0.95,
				});
				bancoUsados.add(match.id);
			}
		}

		// Phase 2: Fuzzy match by amount only (wider tolerance)
		const libroUsados = new Set(pares.map((p) => p.transaccionId));
		for (const t of libro) {
			if (libroUsados.has(t.id)) continue;

			const match = banco.find(
				(m) =>
					!bancoUsados.has(m.id) &&
					Math.abs(m.monto - t.monto) <= tolerance * 10,
			);

			if (match) {
				pares.push({
					transaccionId: t.id,
					movimientoId: match.id,
					monto: t.monto,
					confianza: 0.7,
				});
				bancoUsados.add(match.id);
			}
		}

		const libroNoConciliados = libro
			.filter((t) => !pares.find((p) => p.transaccionId === t.id))
			.map((t) => ({ id: t.id, monto: t.monto, descripcion: t.descripcion }));

		const bancoNoConciliados = banco
			.filter((m) => !bancoUsados.has(m.id))
			.map((m) => ({ id: m.id, monto: m.monto, referencia: m.referencia }));

		return {
			pares,
			noConciliadosLibro: libroNoConciliados,
			noConciliadosBanco: bancoNoConciliados,
		};
	}

	/**
	 * Check if two dates are within the configured window.
	 */
	private isWithinDateWindow(dateA: string, dateB: string): boolean {
		const a = new Date(dateA);
		const b = new Date(dateB);
		const diffDays =
			Math.abs(a.getTime() - b.getTime()) / (1000 * 60 * 60 * 24);
		return diffDays <= this.DATE_WINDOW_DAYS;
	}
}
