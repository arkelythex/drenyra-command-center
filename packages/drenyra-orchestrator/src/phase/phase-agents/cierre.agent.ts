// ─── Cierre Phase Agent ─────────────────────────────────────────────
// Handles the Cierre phase: monthly accounting close with adjustments,
// accruals, FX revaluation, and final trial balance generation.
//
// PR3: Real implementation with balance computation and close logic.

import type { CierreReport } from "../types";

/**
 * CierreAgentInput — what the agent needs to close the period.
 */
export interface CierreAgentInput {
	ruc: string;
	periodo: string;
	cuentas: Array<{
		cuentaPCGE: string;
		nombre: string;
		saldoInicial: number;
		movimientosDebe: number;
		movimientosHaber: number;
	}>;
	ajustes?: Array<{
		id: string;
		cuentaPCGE: string;
		tipo:
			| "devengo"
			| "revaluacion"
			| "provision"
			| "diferencia-cambio"
			| "cierre";
		monto: number;
		descripcion: string;
	}>;
}

/**
 * CierreAgent — executes monthly accounting close.
 *
 * For each account:
 * 1. Compute final balance = saldoInicial + movDebe - movHaber
 * 2. Apply adjustments (accruals, provisions, FX revaluation)
 * 3. Mark period as closed
 */
export class CierreAgent {
	/**
	 * Execute the close phase.
	 */
	async execute(input: CierreAgentInput): Promise<CierreReport> {
		const adjustmentsApplied = input.ajustes?.length ?? 0;
		const pendingItems: string[] = [];

		const saldosFinales = input.cuentas.map((cuenta) => {
			let debe = cuenta.movimientosDebe;
			let haber = cuenta.movimientosHaber;

			// Apply adjustments
			if (input.ajustes) {
				for (const ajuste of input.ajustes) {
					if (ajuste.cuentaPCGE === cuenta.cuentaPCGE) {
						if (ajuste.monto >= 0) {
							debe += ajuste.monto;
						} else {
							haber += Math.abs(ajuste.monto);
						}
					}
				}
			}

			const saldo = cuenta.saldoInicial + debe - haber;

			// Flag accounts with residual balances as pending
			if (cuenta.cuentaPCGE.startsWith("3") && Math.abs(saldo) > 0.01) {
				// Inventory accounts shouldn't have pending close
				pendingItems.push(
					`${cuenta.cuentaPCGE}: ${cuenta.nombre} — saldo residual ${saldo}`,
				);
			}

			return {
				cuentaPCGE: cuenta.cuentaPCGE,
				nombre: cuenta.nombre,
				debe,
				haber,
				saldo: Math.round(saldo * 100) / 100,
			};
		});

		return {
			phaseId: "cierre",
			ruc: input.ruc,
			periodo: input.periodo,
			success: true,
			summary: `Cierre contable completado: ${input.cuentas.length} cuentas procesadas, ${adjustmentsApplied} ajustes aplicados, ${pendingItems.length} pendientes`,
			data: {
				totalCuentas: input.cuentas.length,
				saldosFinales,
				ajustes: adjustmentsApplied,
				pendientes: pendingItems.length,
				fechaCierre: new Date().toISOString().split("T")[0],
			},
		};
	}
}
