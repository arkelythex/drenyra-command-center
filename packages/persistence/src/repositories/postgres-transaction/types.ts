export type DbTransactionStatus =
	| "DRAFT"
	| "SUBMITTED"
	| "ACCEPTED"
	| "OBSERVED"
	| "REJECTED"
	| "ANNULLED";

export type DbTransactionType = "INCOME" | "EXPENSE";
export type DbDocumentType =
	| "FACTURA"
	| "BOLETA"
	| "NOTA_CREDITO"
	| "NOTA_DEBITO"
	| "RECIBO_HONORARIOS"
	| "TICKET"
	| "MOVIMIENTO_BANCARIO";
