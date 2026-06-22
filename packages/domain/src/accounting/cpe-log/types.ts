/**
 * CPELog — Types & Interfaces
 */

export type SunatStatus =
	| "pendiente"
	| "enviado"
	| "aceptado"
	| "rechazado"
	| "observado"
	| "baja";

/**
 * CDR (Constancia de Recepción) metadata from SUNAT.
 */
export interface CDRData {
	/** CDR identifier from SUNAT */
	id: string;
	/** CDR XML content or URL */
	content: string;
	/** Processing result code (e.g., "0" for accepted) */
	resultCode: string;
	/** Processing result description */
	resultDescription: string;
	/** SUNAT ticket number */
	ticket: string;
	/** When the CDR was issued */
	receivedAt: Date;
}
