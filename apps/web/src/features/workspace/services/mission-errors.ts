import { MissionErrorCode } from "@drenyra/mission-domain";
import type { HarnessError } from "@drenyra/mission-domain";

export function mapAPIErrorToHarnessError(
  status: number,
  body: unknown,
): HarnessError {
  const message =
    typeof body === "object" && body !== null && "message" in body
      ? String((body as Record<string, unknown>).message)
      : `Error del servidor (${status})`;

  const code =
    typeof body === "object" && body !== null && "code" in body
      ? String((body as Record<string, unknown>).code)
      : "UNKNOWN";

  return {
    code,
    message,
    statusCode: status,
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
  [MissionErrorCode.VERSION_CONFLICT]: "Conflicto de versión. Actualiza e inténtalo de nuevo.",
  [MissionErrorCode.IDEMPOTENCY_CONFLICT]: "Clave de idempotencia duplicada con datos diferentes",
  [MissionErrorCode.TENANT_MISMATCH]: "No tienes acceso a esta misión",
  [MissionErrorCode.MISSION_NOT_FOUND]: "Misión no encontrada",
  [MissionErrorCode.ALREADY_EXECUTING]: "La misión ya está en ejecución",
  [MissionErrorCode.TERMINAL_STATE_GUARD]: "La misión ya ha finalizado",
  [MissionErrorCode.RECEIPT_VERIFICATION]: "Error de integridad del recibo",
  [MissionErrorCode.SSE_CONNECTION_LOST]: "Conexión SSE perdida",
  [MissionErrorCode.HARNESS_TIMEOUT]: "La operación excedió el tiempo de espera",
  [MissionErrorCode.UNAUTHORIZED]: "No autorizado",
  [MissionErrorCode.FORBIDDEN]: "Acceso denegado",
};

export function getErrorMessage(error: HarnessError): string {
  return SPANISH_ERRORS[error.code] ?? error.message;
}
