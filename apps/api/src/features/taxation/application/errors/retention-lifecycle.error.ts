/**
 * Structured HTTP mapping for retention lifecycle commands (declare / pay / cancel).
 * Mirrors `RetentionApplyError` at the vertical-slice boundary.
 */
export class RetentionLifecycleError extends Error {
	constructor(
		message: string,
		public readonly httpStatus: number,
		public readonly errorCode: string,
	) {
		super(message);
		this.name = "RetentionLifecycleError";
	}
}

const CREATE_FROM_BILL_MESSAGES: Record<
	string,
	{ message: string; code: string }
> = {
	"Retention only applies to PEN amounts": {
		message: "La retención solo aplica a montos expresados en PEN.",
		code: "BUSINESS_RULE_VIOLATION",
	},
	"Base amount must be positive": {
		message: "El monto base de la factura debe ser positivo.",
		code: "BUSINESS_RULE_VIOLATION",
	},
	"Retention only applies to PEN amounts above S/ 700": {
		message: "La retención del 3% solo aplica a montos mayores a S/ 700.",
		code: "BUSINESS_RULE_VIOLATION",
	},
	"Supplier RUC must contain 11 digits": {
		message: "El RUC del proveedor debe tener 11 dígitos.",
		code: "BUSINESS_RULE_VIOLATION",
	},
};

const DECLARE_DOMAIN_MESSAGES: Record<
	string,
	{ message: string; code: string }
> = {
	"Only pending retentions can be declared": {
		message:
			"Solo las retenciones en estado PENDIENTE pueden declararse en el PDT 626.",
		code: "INVALID_TRANSITION",
	},
	"PDT reference is required": {
		message: "La referencia del PDT 626 es obligatoria.",
		code: "VALIDATION_ERROR",
	},
};

const PAY_DOMAIN_MESSAGES: Record<string, { message: string; code: string }> = {
	"Only declared retentions can be marked as paid": {
		message:
			"Solo las retenciones declaradas pueden marcarse como pagadas a SUNAT.",
		code: "INVALID_TRANSITION",
	},
	"Bank transaction ID is required": {
		message: "El identificador de la transacción bancaria es obligatorio.",
		code: "VALIDATION_ERROR",
	},
};

const CANCEL_DOMAIN_MESSAGES: Record<
	string,
	{ message: string; code: string }
> = {
	"Paid retentions cannot be cancelled": {
		message: "No se pueden cancelar retenciones ya pagadas a SUNAT.",
		code: "INVALID_TRANSITION",
	},
	"Retention is already cancelled": {
		message: "La retención ya fue cancelada.",
		code: "INVALID_TRANSITION",
	},
	"Cancellation reason is required": {
		message: "El motivo de cancelación es obligatorio.",
		code: "VALIDATION_ERROR",
	},
};

function mapByTable(
	error: unknown,
	table: Record<string, { message: string; code: string }>,
): RetentionLifecycleError | null {
	if (!(error instanceof Error)) return null;
	const row = table[error.message];
	if (!row) return null;
	return new RetentionLifecycleError(row.message, 422, row.code);
}

/** Map domain errors from `Retencion.createFromBill` to a lifecycle error. */
export function mapCreateFromBillToLifecycleError(
	error: unknown,
): RetentionLifecycleError | null {
	return mapByTable(error, CREATE_FROM_BILL_MESSAGES);
}

export function mapDeclareDomainError(
	error: unknown,
): RetentionLifecycleError | null {
	return mapByTable(error, DECLARE_DOMAIN_MESSAGES);
}

export function mapPayDomainError(
	error: unknown,
): RetentionLifecycleError | null {
	return mapByTable(error, PAY_DOMAIN_MESSAGES);
}

export function mapCancelDomainError(
	error: unknown,
): RetentionLifecycleError | null {
	return mapByTable(error, CANCEL_DOMAIN_MESSAGES);
}
