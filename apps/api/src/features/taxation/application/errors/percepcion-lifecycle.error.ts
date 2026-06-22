export class PercepcionLifecycleError extends Error {
	constructor(
		message: string,
		public readonly httpStatus: number,
		public readonly errorCode: string,
	) {
		super(message);
		this.name = "PercepcionLifecycleError";
	}
}

const CREATE_FROM_BILL_MESSAGES: Record<
	string,
	{ message: string; code: string }
> = {
	"Percepcion only applies to PEN amounts": {
		message: "La percepción solo aplica a montos expresados en PEN.",
		code: "BUSINESS_RULE_VIOLATION",
	},
	"Total amount must be positive": {
		message: "El monto total de la factura debe ser positivo.",
		code: "BUSINESS_RULE_VIOLATION",
	},
	"Percepcion only applies to PEN amounts of S/ 700 or more": {
		message: "La percepción IGV solo aplica a montos desde S/ 700.",
		code: "BUSINESS_RULE_VIOLATION",
	},
	"Agent RUC must contain 11 digits": {
		message: "El RUC del agente de percepción debe tener 11 dígitos.",
		code: "BUSINESS_RULE_VIOLATION",
	},
};

const DECLARE_DOMAIN_MESSAGES: Record<
	string,
	{ message: string; code: string }
> = {
	"Only pending percepciones can be declared": {
		message: "Solo las percepciones en estado PENDIENTE pueden declararse.",
		code: "INVALID_TRANSITION",
	},
	"PDT reference is required": {
		message: "La referencia del PDT es obligatoria.",
		code: "VALIDATION_ERROR",
	},
};

const PAY_DOMAIN_MESSAGES: Record<string, { message: string; code: string }> = {
	"Only declared percepciones can be marked as paid": {
		message:
			"Solo las percepciones declaradas pueden marcarse como pagadas a SUNAT.",
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
	"Paid percepciones cannot be cancelled": {
		message: "No se pueden cancelar percepciones ya pagadas a SUNAT.",
		code: "INVALID_TRANSITION",
	},
	"Percepcion is already cancelled": {
		message: "La percepción ya fue cancelada.",
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
): PercepcionLifecycleError | null {
	if (!(error instanceof Error)) return null;
	const row = table[error.message];
	if (!row) return null;
	return new PercepcionLifecycleError(row.message, 422, row.code);
}

export function mapCreateFromBillToPercepcionLifecycleError(
	error: unknown,
): PercepcionLifecycleError | null {
	return mapByTable(error, CREATE_FROM_BILL_MESSAGES);
}

export function mapDeclareDomainError(
	error: unknown,
): PercepcionLifecycleError | null {
	return mapByTable(error, DECLARE_DOMAIN_MESSAGES);
}

export function mapPayDomainError(
	error: unknown,
): PercepcionLifecycleError | null {
	return mapByTable(error, PAY_DOMAIN_MESSAGES);
}

export function mapCancelDomainError(
	error: unknown,
): PercepcionLifecycleError | null {
	return mapByTable(error, CANCEL_DOMAIN_MESSAGES);
}
