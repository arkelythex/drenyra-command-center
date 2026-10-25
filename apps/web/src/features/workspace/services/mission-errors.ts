import type { HarnessError } from "@drenyra/mission-domain";
import { MissionErrorCode } from "@drenyra/mission-domain";

/**
 * Reads `{ success: false, error: { code, message } }` (the missions API) and
 * the older flat `{ code, message }` shape.
 */
export function mapAPIErrorToHarnessError(
	status: number,
	body: unknown,
): HarnessError {
	const record =
		typeof body === "object" && body !== null
			? (body as Record<string, unknown>)
			: {};
	const nested =
		typeof record.error === "object" && record.error !== null
			? (record.error as Record<string, unknown>)
			: record;

	const details =
		typeof nested.details === "object" && nested.details !== null
			? (nested.details as Record<string, unknown>)
			: undefined;

	return {
		code: typeof nested.code === "string" ? nested.code : "UNKNOWN",
		message:
			typeof nested.message === "string"
				? nested.message
				: `Error del servidor (${status})`,
		statusCode: status,
		...(details ? { details } : {}),
		isTimeout: false,
	};
}

export function isHarnessError(error: unknown): error is HarnessError {
	return (
		typeof error === "object" &&
		error !== null &&
		"code" in error &&
		"message" in error &&
		"statusCode" in error
	);
}

const SPANISH_ERRORS: Record<string, string> = {
	[MissionErrorCode.INVALID_TRANSITION]: "Transición de estado no permitida",
	[MissionErrorCode.VERSION_CONFLICT]:
		"Conflicto de versión. Actualiza e inténtalo de nuevo.",
	[MissionErrorCode.IDEMPOTENCY_CONFLICT]:
		"Clave de idempotencia duplicada con datos diferentes",
	[MissionErrorCode.TENANT_MISMATCH]: "No tienes acceso a esta misión",
	[MissionErrorCode.MISSION_NOT_FOUND]: "Misión no encontrada",
	[MissionErrorCode.ALREADY_EXECUTING]: "La misión ya está en ejecución",
	[MissionErrorCode.TERMINAL_STATE_GUARD]: "La misión ya ha finalizado",
	[MissionErrorCode.RECEIPT_VERIFICATION]: "Error de integridad del recibo",
	[MissionErrorCode.SSE_CONNECTION_LOST]: "Conexión SSE perdida",
	[MissionErrorCode.HARNESS_TIMEOUT]:
		"La operación excedió el tiempo de espera",
	[MissionErrorCode.UNAUTHORIZED]: "No autorizado",
	FORBIDDEN: "Acceso denegado", // legacy code kept for older API responses
};

export function getErrorMessage(error: HarnessError): string {
	return SPANISH_ERRORS[error.code] ?? error.message;
}
