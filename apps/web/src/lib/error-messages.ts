export interface ErrorPresentation {
	title: string;
	description?: string;
	code?: string;
}

const ERROR_COPY: Record<string, { title: string; description: string }> = {
	COMPANY_SCOPE_REQUIRED: {
		title: "Selecciona una empresa activa",
		description:
			"El sistema necesita una empresa activa para continuar. Cambia de empresa en el encabezado e intenta otra vez.",
	},
	COMPANY_SCOPE_MISMATCH: {
		title: "La factura pertenece a otra empresa",
		description:
			"Estás operando con una empresa distinta a la del comprobante. Cambia de empresa activa y vuelve a intentar.",
	},
	OSE_SEND_ERROR: {
		title: "No se pudo enviar la factura a OSE",
		description:
			"Revisa la configuracion del proveedor OSE, el certificado y el estado del comprobante antes de reenviar.",
	},
	INVOICE_NOT_FOUND: {
		title: "No se encontró la factura",
		description:
			"El comprobante ya no existe o fue movido a otro tenant. Actualiza la vista y vuelve a intentar.",
	},
	BILL_NOT_FOUND: {
		title: "No se encontró la factura de compra",
		description:
			"El documento ya no existe o fue movido a otro tenant. Actualiza la vista y vuelve a intentar.",
	},
	INVALID_STATUS_TRANSITION: {
		title: "La transición de estado no está permitida",
		description:
			"El comprobante no puede pasar a ese estado desde su estado actual. Revisa el flujo contable antes de continuar.",
	},
	ACCOUNT_NOT_FOUND: {
		title: "No se encontró la cuenta bancaria",
		description:
			"La cuenta ya no existe o pertenece a otra empresa activa. Actualiza la vista antes de continuar.",
	},
	TRANSACTION_NOT_FOUND: {
		title: "No se encontró la transacción",
		description:
			"El movimiento bancario ya no existe o fue conciliado desde otra sesión. Actualiza la vista e inténtalo otra vez.",
	},
};

export function presentError(
	error: unknown,
	fallbackTitle: string,
): ErrorPresentation {
	const errorMessage =
		error instanceof Error
			? error.message
			: typeof error === "string"
				? error
				: "";
	const code = extractErrorCode(errorMessage);

	if (code && ERROR_COPY[code]) {
		return {
			title: ERROR_COPY[code].title,
			description: ERROR_COPY[code].description,
			code,
		};
	}

	if (
		errorMessage.toLowerCase().includes("network") ||
		errorMessage.toLowerCase().includes("fetch")
	) {
		return {
			title: "No se pudo conectar con el servidor",
			description:
				"Verifica tu conexion a internet o el estado de la API antes de reintentar.",
		};
	}

	if (
		errorMessage.toLowerCase().includes("timeout") ||
		errorMessage.includes("504")
	) {
		return {
			title: "La operación tardó demasiado",
			description:
				"El servidor no respondió a tiempo. Reintenta en unos segundos.",
		};
	}

	if (
		errorMessage.includes("401") ||
		errorMessage.toLowerCase().includes("unauthorized")
	) {
		return {
			title: "Tu sesión ha expirado",
			description: "Inicia sesión nuevamente para continuar.",
		};
	}

	return {
		title: fallbackTitle,
		description: errorMessage || undefined,
		code,
	};
}

function extractErrorCode(message: string): string | undefined {
	if (!message) {
		return undefined;
	}

	const exactMatch = message.trim().match(/^[A-Z0-9_]+$/);
	if (exactMatch) {
		return exactMatch[0];
	}

	const embeddedMatch = message.match(/\b[A-Z][A-Z0-9_]{2,}\b/);
	return embeddedMatch?.[0];
}
