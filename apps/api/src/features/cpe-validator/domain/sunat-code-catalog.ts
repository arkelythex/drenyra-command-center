/**
 * SunatCatalogState type.
 *
 * @example
 * ```ts
 * const value: SunatCatalogState = {} as SunatCatalogState;
 * console.log(value);
 * ```
 */
export type SunatCatalogState =
	| "OBSERVADO"
	| "RECHAZADO"
	| "ANULADO"
	| "NO_EXISTE";

/**
 * SunatCodeCatalogEntry interface.
 *
 * @example
 * ```ts
 * const value: SunatCodeCatalogEntry = {} as SunatCodeCatalogEntry;
 * console.log(value);
 * ```
 */
export interface SunatCodeCatalogEntry {
	state: SunatCatalogState;
	code: string;
	incidentCategory:
		| "SUNAT_OBSERVED"
		| "SUNAT_REJECTED"
		| "SUNAT_NOT_FOUND"
		| "SUNAT_ANNULLED";
	severity: "medium" | "high";
	summary: string;
	defaultErrorMessage: string;
	supportMessage: string;
	recommendedActions: readonly string[];
}

/**
 * SUNAT_CODE_CATALOG const.
 *
 * @example
 * ```ts
 * console.log(SUNAT_CODE_CATALOG);
 * ```
 */
export const SUNAT_CODE_CATALOG = [
	{
		state: "OBSERVADO",
		code: "0101",
		incidentCategory: "SUNAT_OBSERVED",
		severity: "medium",
		summary:
			"SUNAT returned observations that must be reviewed before final submission.",
		defaultErrorMessage: "Comprobante con observaciones",
		supportMessage:
			"Revisar tributos, totales y datos del comprobante antes de reenviar.",
		recommendedActions: [
			"Comparar el XML contra el detalle tributario antes de reenviar.",
			"Corregir montos, moneda o tributos observados por SUNAT.",
			"Reintentar el envio solo cuando el XML quede consistente.",
		],
	},
	{
		state: "RECHAZADO",
		code: "2320",
		incidentCategory: "SUNAT_REJECTED",
		severity: "high",
		summary: "SUNAT rejected the CPE because the emitter RUC is not valid.",
		defaultErrorMessage: "RUC no valido",
		supportMessage:
			"Verificar el RUC emisor y la configuracion del contribuyente antes de reenviar.",
		recommendedActions: [
			"Validar el RUC del emisor contra la ficha RUC activa.",
			"Corregir la configuracion del contribuyente y el certificado asociado.",
			"Reemitir el comprobante solo despues de corregir el padron.",
		],
	},
	{
		state: "NO_EXISTE",
		code: "4040",
		incidentCategory: "SUNAT_NOT_FOUND",
		severity: "high",
		summary: "SUNAT does not recognize the referenced CPE.",
		defaultErrorMessage: "No encontrado",
		supportMessage:
			"Confirmar serie, correlativo y fecha antes de escalar como inconsistencia.",
		recommendedActions: [
			"Revisar serie y correlativo contra el ERP y el XML firmado.",
			"Confirmar que la fecha de emision coincida con el documento enviado.",
			"Escalar como inconsistencia solo si los datos locales son correctos.",
		],
	},
	{
		state: "ANULADO",
		code: "0",
		incidentCategory: "SUNAT_ANNULLED",
		severity: "medium",
		summary: "SUNAT reports the CPE as annulled.",
		defaultErrorMessage: "Comprobante anulado",
		supportMessage:
			"Verificar si corresponde emitir una nota de credito o consultar el historial del CPE.",
		recommendedActions: [
			"Confirmar si el comprobante fue dado de baja previamente.",
			"Revisar el historial del CPE antes de reenviar o conciliar.",
			"Emitir nota de credito solo si el flujo contable lo requiere.",
		],
	},
] as const satisfies readonly SunatCodeCatalogEntry[];

/**
 * findSunatCatalogEntry operation.
 *
 * @param state - Input for state.
 * @param code - Input for code.
 * @returns Result of findSunatCatalogEntry.
 * @example
 * ```ts
 * const result = findSunatCatalogEntry("", "");
 * console.log(result);
 * ```
 */
export function findSunatCatalogEntry(
	state: string | undefined,
	code?: string | undefined,
): SunatCodeCatalogEntry | undefined {
	const normalizedState = (state ?? "").trim().toUpperCase();
	const normalizedCode = (code ?? "").trim();

	if (normalizedCode.length > 0) {
		const byCode = SUNAT_CODE_CATALOG.find(
			(entry) => entry.code === normalizedCode,
		);
		if (byCode) {
			return byCode;
		}
	}

	if (normalizedState.length > 0) {
		return SUNAT_CODE_CATALOG.find((entry) => entry.state === normalizedState);
	}

	return undefined;
}
