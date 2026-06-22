/**
 * Error thrown when DocumentSeries validation fails
 *
 * @example
 * ```ts
 * throw new InvalidDocumentSeriesError("X001");
 * ```
 */
export class InvalidDocumentSeriesError extends Error {
	constructor(series: string) {
		super(
			`Serie de documento inválida: "${series}". Formato válido: F001 (Factura), B001 (Boleta), FC01 (Nota Crédito), etc.`,
		);
		this.name = "InvalidDocumentSeriesError";
		Object.setPrototypeOf(this, InvalidDocumentSeriesError.prototype);
	}
}
