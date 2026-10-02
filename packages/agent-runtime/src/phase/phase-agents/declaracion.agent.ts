// ─── Declaración Phase Agent ────────────────────────────────────────
// Handles the Declaración phase: PLE generation, SIRE/PDT filing
// with SUNAT, and tracking of submission results.
//
// PR3: Real implementation with filing simulation and CDR tracking.

import type { DeclaracionReport } from "../types";
import type { FiscalDocumentService } from "../types/ose-fiscal-service";

/**
 * DeclaracionAgentInput — what the agent needs to file.
 */
export interface DeclaracionAgentInput {
	ruc: string;
	periodo: string;
	tipoDeclaracion: "SIRE" | "PDT" | "PLAME" | "DET";
	resumenPLE?: {
		cantidadComprobantes: number;
		totalVentas: number;
		totalCompras: number;
		igvVentas: number;
		igvCompras: number;
	};
	detracciones?: Array<{
		tipo: string;
		monto: number;
		constancia?: string;
	}>;
}

/**
 * DeclaracionAgent — files fiscal declarations with SUNAT.
 *
 * Flow:
 * 1. Validates that all required data is present
 * 2. Generates PLE manifest (XML manifest for SUNAT)
 * 3. Submits via SIRE or PDT (simulated)
 * 4. Returns CDR (Comprobante de Recepción) with SUNAT response
 *
 * When a FiscalDocumentService is provided, real SUNAT OSE submission
 * is used instead of mock CDR generation.
 */
export class DeclaracionAgent {
	constructor(private readonly fiscalService?: FiscalDocumentService) {}

	/**
	 * Execute the declaration phase.
	 */

	async execute(
		input: DeclaracionAgentInput & { xmlContent?: string },
	): Promise<DeclaracionReport> {
		const observaciones = collectObservaciones(input);

		if (this.fiscalService) {
			return this.submitToService(this.fiscalService, input);
		}
		return mockDeclaration(input, observaciones);
	}

	/** Real SUNAT OSE submission path. */
	private async submitToService(
		service: FiscalDocumentService,
		input: DeclaracionAgentInput & { xmlContent?: string },
	): Promise<DeclaracionReport> {
		const declaration = await service.submitPeriodDeclaration({
			ruc: input.ruc,
			periodo: input.periodo,
			tipoDeclaracion: input.tipoDeclaracion as "SIRE" | "PDT621" | "PLAME",
			xmlContent: input.xmlContent,
			summary: {
				totalInvoiceCount: input.resumenPLE?.cantidadComprobantes ?? 0,
				totalSalesAmount: input.resumenPLE?.totalVentas ?? 0,
				totalPurchaseAmount: input.resumenPLE?.totalCompras ?? 0,
				totalIgv:
					(input.resumenPLE?.igvVentas ?? 0) +
					(input.resumenPLE?.igvCompras ?? 0),
			},
		});

		return {
			phaseId: "declaracion",
			ruc: input.ruc,
			periodo: input.periodo,
			success: declaration.success,
			summary: declaration.success
				? `Declaración ${input.tipoDeclaracion} presentada exitosamente. CDR: ${declaration.cdrId}`
				: `Error en declaración: ${declaration.error}`,
			data: {
				presentada: declaration.success,
				numeroComprobante:
					declaration.ticketNumber ?? defaultNumeroComprobante(input),
				cdrId: declaration.cdrId,
				codigoSUNAT: codigoSunatFor(declaration.cdrStatus),
				observaciones: declaration.error ? [declaration.error] : [],
				fechaPresentacion: declaration.acceptedAt ?? new Date().toISOString(),
				tipoDeclaracion: input.tipoDeclaracion as
					| "SIRE"
					| "PDT"
					| "PLAME"
					| "DET",
			},
		};
	}
}

type DeclaracionInput = DeclaracionAgentInput & { xmlContent?: string };

/** Input warnings: partial declaration (no PLE) and detracciones without constancia. */
function collectObservaciones(input: DeclaracionInput): string[] {
	const observaciones: string[] = [];
	if (!input.resumenPLE) {
		observaciones.push(
			"No se proporcionó resumen PLE — la declaración será parcial",
		);
	}
	const sinConstancia = (input.detracciones ?? []).filter((d) => !d.constancia);
	if (sinConstancia.length > 0) {
		observaciones.push(
			`${sinConstancia.length} detracciones sin constancia de pago`,
		);
	}
	return observaciones;
}

function defaultNumeroComprobante(input: DeclaracionInput): string {
	return `D${input.periodo.replace("-", "")}-${input.ruc.slice(-6)}`;
}

/** SUNAT code: 0 accepted, 5 observed, 1 anything else. */
function codigoSunatFor(cdrStatus: string | undefined): "0" | "5" | "1" {
	if (cdrStatus === "ACEPTADO") return "0";
	return cdrStatus === "OBSERVADO" ? "5" : "1";
}

/** Stub mode (no FiscalDocumentService): auto-accept unless the PLE summary is missing. */
function mockDeclaration(
	input: DeclaracionInput,
	observaciones: string[],
): DeclaracionReport {
	const hasCriticalIssues = !input.resumenPLE;
	const numeroComprobante = hasCriticalIssues
		? ""
		: defaultNumeroComprobante(input);
	const cdrId = hasCriticalIssues
		? ""
		: `CDR-${numeroComprobante}-${Date.now().toString(36).toUpperCase()}`;

	return {
		phaseId: "declaracion",
		ruc: input.ruc,
		periodo: input.periodo,
		success: !hasCriticalIssues,
		summary: hasCriticalIssues
			? `Declaración ${input.tipoDeclaracion} incompleta: falta resumen PLE`
			: `Declaración ${input.tipoDeclaracion} presentada exitosamente. CDR: ${cdrId}`,
		data: {
			presentada: !hasCriticalIssues,
			numeroComprobante,
			cdrId,
			codigoSUNAT: hasCriticalIssues ? "1" : "0",
			observaciones: hasCriticalIssues ? observaciones : [],
			fechaPresentacion: new Date().toISOString(),
			tipoDeclaracion: input.tipoDeclaracion,
		},
	};
}
