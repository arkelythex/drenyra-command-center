import type {
	ComplianceReproducibilityReport,
	SIRESummary,
	SIRESunatLiveSummary,
	SIRESunatLiveUnavailableReason,
} from "@drenyra/domain";
import { Money } from "@drenyra/domain";
import { buildFiscalTruthAdvisoryTrace } from "../../../fiscal/truth/trace";
import type {
	LedgerFlowStatus,
	LedgerSireAutopilotInput,
	LedgerSireAutopilotResult,
	LedgerSunatCrossCheck,
} from "../../ledger-mvp.types";
import { resolveLedgerPeriodRange } from "../period-range";
import type { LedgerSireAutopilotPorts } from "./types";

function readNonNegativeNumberEnvDual(
	primary: string,
	legacy: string,
	fallback: number,
): number {
	const raw = process.env[primary]?.trim() || process.env[legacy]?.trim();
	if (!raw) return fallback;
	const parsed = Number.parseFloat(raw);
	if (!Number.isFinite(parsed) || parsed < 0) return fallback;
	return parsed;
}

function readNonNegativeIntegerEnvDual(
	primary: string,
	legacy: string,
	fallback: number,
): number {
	const raw = process.env[primary]?.trim() || process.env[legacy]?.trim();
	if (!raw) return fallback;
	const parsed = Number.parseInt(raw, 10);
	if (!Number.isInteger(parsed) || parsed < 0) return fallback;
	return parsed;
}

function amountPenToCents(amountPen: number): number {
	const normalized =
		Number.isFinite(amountPen) && amountPen >= 0 ? amountPen : 0;
	return Money.fromAmount(normalized, "PEN").getCents();
}

function centsToPen(cents: number): number {
	return Money.fromCents(cents, "PEN").toNumber();
}

function parsePenAmount(value: string): Money {
	const parsed = Number.parseFloat(value);
	if (!Number.isFinite(parsed) || parsed < 0) {
		throw new Error(`Invalid PEN amount received: ${value}`);
	}

	return Money.fromAmount(parsed, "PEN");
}

function uniqueNonEmpty(values: string[]): string[] {
	return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

const BLOCKING_RECORD_GAP = readNonNegativeIntegerEnvDual(
	"LEDGER_MVP_BLOCKING_RECORD_GAP",
	"FLUX_MVP_BLOCKING_RECORD_GAP",
	25,
);
const BLOCKING_IGV_GAP_CENTS = amountPenToCents(
	readNonNegativeNumberEnvDual(
		"LEDGER_MVP_BLOCKING_IGV_GAP_PEN",
		"FLUX_MVP_BLOCKING_IGV_GAP_PEN",
		250,
	),
);
const BLOCKING_TOTAL_GAP_CENTS = amountPenToCents(
	readNonNegativeNumberEnvDual(
		"LEDGER_MVP_BLOCKING_TOTAL_GAP_PEN",
		"FLUX_MVP_BLOCKING_TOTAL_GAP_PEN",
		2000,
	),
);
const BLOCKING_SUNAT_RECORD_GAP = readNonNegativeIntegerEnvDual(
	"LEDGER_MVP_BLOCKING_SUNAT_RECORD_GAP",
	"FLUX_MVP_BLOCKING_SUNAT_RECORD_GAP",
	10,
);
const BLOCKING_SUNAT_IGV_GAP_CENTS = amountPenToCents(
	readNonNegativeNumberEnvDual(
		"LEDGER_MVP_BLOCKING_SUNAT_IGV_GAP_PEN",
		"FLUX_MVP_BLOCKING_SUNAT_IGV_GAP_PEN",
		500,
	),
);
const BLOCKING_SUNAT_TOTAL_GAP_CENTS = amountPenToCents(
	readNonNegativeNumberEnvDual(
		"LEDGER_MVP_BLOCKING_SUNAT_TOTAL_GAP_PEN",
		"FLUX_MVP_BLOCKING_SUNAT_TOTAL_GAP_PEN",
		3000,
	),
);

export class LedgerSireAutopilotService {
	constructor(private readonly ports: LedgerSireAutopilotPorts) {}

	async run(
		input: LedgerSireAutopilotInput,
	): Promise<LedgerSireAutopilotResult> {
		const periodRange = resolveLedgerPeriodRange(input.period);
		const reproducibility = await this.ports.verifySireReproducibility({
			companyId: input.companyId,
			year: periodRange.year,
			month: periodRange.month,
			...(input.totalTolerance !== undefined
				? { totalTolerance: input.totalTolerance }
				: {}),
			...(input.igvTolerance !== undefined
				? { igvTolerance: input.igvTolerance }
				: {}),
			...(input.recordTolerance !== undefined
				? { recordTolerance: input.recordTolerance }
				: {}),
		});

		const igvSummary = await this.ports.getIgvSummary(
			input.companyId,
			periodRange.year,
			periodRange.month,
		);
		const sireSummary = await this.ports.getSireSummary(
			input.companyId,
			periodRange.year,
			periodRange.month,
		);
		const sunatLiveSummary = await this.resolveSunatLiveSummary(input);
		const sunatVsLocalGap = this.resolveSunatVsLocalGap(
			sireSummary,
			sunatLiveSummary,
		);
		const sunatCrossCheck = this.resolveSunatCrossCheck(
			sunatLiveSummary,
			sunatVsLocalGap,
		);

		const pdt621Prefill = this.ports.pdtBuilder({
			ruc: input.ruc,
			period: input.period,
			razonSocial: input.razonSocial,
			ventasGravadasBase: parsePenAmount(igvSummary.sales).toNumber(),
			ventasGravadasIgv: parsePenAmount(igvSummary.igvSales).toNumber(),
			comprasGravadasBase: parsePenAmount(igvSummary.purchases).toNumber(),
			comprasGravadasIgv: parsePenAmount(igvSummary.igvPurchases).toNumber(),
			percepciones: centsToPen(input.percepcionesCents),
			retenciones: centsToPen(input.retencionesCents),
			exportaciones: Money.zero("PEN").toNumber(),
			operacionesNoGravadas: Money.zero("PEN").toNumber(),
		});

		const status = this.resolveStatus(reproducibility, sunatVsLocalGap);
		buildFiscalTruthAdvisoryTrace({
			traceId: this.ports.traceIdFactory(),
			source: "ledger-mvp",
			aggregateId: input.period,
			companyId: input.companyId,
			companyRuc: input.ruc,
		});

		return {
			traceId: this.ports.traceIdFactory(),
			flow: "sire_autopilot",
			generatedAt: this.ports.nowFactory().toISOString(),
			period: input.period,
			status,
			evidence: {
				reproducibility,
				sireSummary,
				sunatLiveSummary,
				sunatCrossCheck,
				sunatVsLocalGap,
				igvSummary,
				pdt621Prefill,
			},
			recommendedActions: this.buildActions(
				status,
				reproducibility,
				sunatLiveSummary,
				sunatVsLocalGap,
			),
		};
	}

	private async resolveSunatLiveSummary(
		input: LedgerSireAutopilotInput,
	): Promise<SIRESunatLiveSummary> {
		if (!this.ports.getSunatLiveSummary) {
			return {
				source: "sunat-api",
				status: "unavailable",
				reason: "api_mode_disabled",
				period: input.period,
				checkedAt: this.ports.nowFactory().toISOString(),
				message:
					"Cruce SUNAT API no habilitado en esta instancia. Continuar con validación manual en SOL.",
				ledgers: [],
			};
		}

		try {
			return await this.ports.getSunatLiveSummary({
				companyId: input.companyId,
				period: input.period,
				ruc: input.ruc,
			});
		} catch (error: unknown) {
			return {
				source: "sunat-api",
				status: "unavailable",
				reason: "internal_error",
				period: input.period,
				checkedAt: this.ports.nowFactory().toISOString(),
				message: `Cruce SUNAT API no disponible: ${error instanceof Error ? error.message : "error inesperado"}`,
				ledgers: [],
			};
		}
	}

	private resolveSunatVsLocalGap(
		localSummary: SIRESummary,
		sunatLiveSummary: SIRESunatLiveSummary,
	): {
		recordCount: number;
		totalAmount: number;
		totalIGV: number;
	} | null {
		if (sunatLiveSummary.status !== "available") {
			return null;
		}

		const aggregated = sunatLiveSummary.ledgers.reduce(
			(acc, ledger) => ({
				recordCount: acc.recordCount + ledger.recordCount,
				totalAmount: acc.totalAmount + ledger.totalAmount,
				totalIGV: acc.totalIGV + ledger.totalIGV,
			}),
			{
				recordCount: 0,
				totalAmount: 0,
				totalIGV: 0,
			},
		);

		return {
			recordCount: Math.abs(localSummary.recordCount - aggregated.recordCount),
			totalAmount: Math.abs(localSummary.totalAmount - aggregated.totalAmount),
			totalIGV: Math.abs(localSummary.totalIGV - aggregated.totalIGV),
		};
	}

	private resolveSunatCrossCheck(
		sunatLiveSummary: SIRESunatLiveSummary,
		sunatVsLocalGap: {
			recordCount: number;
			totalAmount: number;
			totalIGV: number;
		} | null,
	): LedgerSunatCrossCheck {
		if (sunatLiveSummary.status === "unavailable") {
			return {
				status: "unavailable",
				reason: this.mapUnavailableReason(sunatLiveSummary.reason),
				recommendedAction: "manual_review",
			};
		}

		const hasMismatch =
			sunatVsLocalGap !== null &&
			(sunatVsLocalGap.recordCount > 0 ||
				sunatVsLocalGap.totalAmount > 0 ||
				sunatVsLocalGap.totalIGV > 0);

		if (hasMismatch) {
			return {
				status: "mismatch",
				reason: "not_applicable",
				recommendedAction: "manual_review",
			};
		}

		return {
			status: "matched",
			reason: "not_applicable",
			recommendedAction: "auto_continue",
		};
	}

	private mapUnavailableReason(
		reason: SIRESunatLiveUnavailableReason,
	): LedgerSunatCrossCheck["reason"] {
		switch (reason) {
			case "missing_config":
				return "missing_config";
			case "auth_unavailable":
				return "auth_error";
			case "timeout":
				return "timeout";
			case "api_mode_disabled":
				return "not_applicable";
			default:
				return "upstream_error";
		}
	}

	private resolveStatus(
		reproducibility: ComplianceReproducibilityReport,
		sunatVsLocalGap: {
			recordCount: number;
			totalAmount: number;
			totalIGV: number;
		} | null,
	): LedgerFlowStatus {
		if (reproducibility.reproducible && sunatVsLocalGap === null) {
			return "ready";
		}

		if (reproducibility.reproducible && sunatVsLocalGap) {
			const hasSunatBlockingGap =
				sunatVsLocalGap.recordCount >= BLOCKING_SUNAT_RECORD_GAP ||
				amountPenToCents(sunatVsLocalGap.totalIGV) >=
					BLOCKING_SUNAT_IGV_GAP_CENTS ||
				amountPenToCents(sunatVsLocalGap.totalAmount) >=
					BLOCKING_SUNAT_TOTAL_GAP_CENTS;

			if (hasSunatBlockingGap) {
				return "blocked";
			}

			const hasAnySunatGap =
				sunatVsLocalGap.recordCount > 0 ||
				sunatVsLocalGap.totalAmount > 0 ||
				sunatVsLocalGap.totalIGV > 0;

			return hasAnySunatGap ? "manual_review" : "ready";
		}

		const hasBlockingGap =
			reproducibility.differences.recordCount >= BLOCKING_RECORD_GAP ||
			amountPenToCents(reproducibility.differences.totalIGV) >=
				BLOCKING_IGV_GAP_CENTS ||
			amountPenToCents(reproducibility.differences.totalAmount) >=
				BLOCKING_TOTAL_GAP_CENTS;

		return hasBlockingGap ? "blocked" : "manual_review";
	}

	private buildActions(
		status: LedgerFlowStatus,
		reproducibility: ComplianceReproducibilityReport,
		sunatLiveSummary: SIRESunatLiveSummary,
		sunatVsLocalGap: {
			recordCount: number;
			totalAmount: number;
			totalIGV: number;
		} | null,
	): string[] {
		if (status === "ready" && sunatLiveSummary.status === "available") {
			return ["Proceder con revisión final y envío de PDT 621 prellenado."];
		}

		const actions: string[] = [];

		if (reproducibility.differences.recordCount > 0) {
			actions.push(
				"Corregir discrepancias de registros RVIE/RCE antes del cierre.",
			);
		}

		if (reproducibility.differences.totalIGV > 0) {
			actions.push(
				"Reconciliar diferencias de IGV entre libros y evidencia contable.",
			);
		}

		if (status === "blocked") {
			actions.push(
				"Bloquear envío automático y requerir aprobación HITL del supervisor.",
			);
		}

		if (sunatLiveSummary.status === "unavailable") {
			actions.push(
				"Validar resumen del periodo en SUNAT SOL de forma manual antes de enviar PDT 621.",
			);
			if (sunatLiveSummary.reason === "auth_unavailable") {
				actions.push(
					"Renovar credenciales OAuth SUNAT antes del siguiente intento automático.",
				);
			}
			if (
				sunatLiveSummary.reason === "timeout" ||
				sunatLiveSummary.reason === "upstream_error"
			) {
				actions.push(
					"Reintentar consulta SUNAT API con ventana de recuperación antes del cierre.",
				);
			}
			if (sunatLiveSummary.reason === "invalid_payload") {
				actions.push(
					"Escalar payload SUNAT inválido a soporte técnico con evidencia de respuesta.",
				);
			}
		}

		if (
			sunatLiveSummary.status === "available" &&
			sunatVsLocalGap &&
			(sunatVsLocalGap.recordCount > 0 ||
				sunatVsLocalGap.totalAmount > 0 ||
				sunatVsLocalGap.totalIGV > 0)
		) {
			actions.push(
				"Resolver diferencias entre conciliación local y SUNAT API en tiempo real.",
			);
		}

		return uniqueNonEmpty(actions);
	}
}
