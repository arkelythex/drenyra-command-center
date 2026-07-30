/**
 * Mission Error Codes — canonical error taxonomy for the mission domain.
 *
 * Every error code maps to a default HTTP status code following
 * the spec Appendix B mapping.
 */

export enum MissionErrorCode {
  INVALID_TRANSITION = "INVALID_TRANSITION",
  VERSION_CONFLICT = "VERSION_CONFLICT",
  IDEMPOTENCY_CONFLICT = "IDEMPOTENCY_CONFLICT",
  TENANT_MISMATCH = "TENANT_MISMATCH",
  MISSION_NOT_FOUND = "MISSION_NOT_FOUND",
  ALREADY_EXECUTING = "ALREADY_EXECUTING",
  TERMINAL_STATE_GUARD = "TERMINAL_STATE_GUARD",
  RECEIPT_VERIFICATION = "RECEIPT_VERIFICATION",
  SSE_CONNECTION_LOST = "SSE_CONNECTION_LOST",
  HARNESS_TIMEOUT = "HARNESS_TIMEOUT",
  UNAUTHORIZED = "UNAUTHORIZED",
  FORBIDDEN = "FORBIDDEN",
  EVIDENCE_MISMATCH = "EVIDENCE_MISMATCH",
}

/**
 * Default HTTP status code for each MissionErrorCode.
 */
const DEFAULT_STATUS_CODES: Record<MissionErrorCode, number> = {
  [MissionErrorCode.INVALID_TRANSITION]: 409,
  [MissionErrorCode.VERSION_CONFLICT]: 409,
  [MissionErrorCode.IDEMPOTENCY_CONFLICT]: 409,
  [MissionErrorCode.TENANT_MISMATCH]: 403,
  [MissionErrorCode.MISSION_NOT_FOUND]: 404,
  [MissionErrorCode.ALREADY_EXECUTING]: 409,
  [MissionErrorCode.TERMINAL_STATE_GUARD]: 409,
  [MissionErrorCode.RECEIPT_VERIFICATION]: 500,
  [MissionErrorCode.SSE_CONNECTION_LOST]: 500,
  [MissionErrorCode.HARNESS_TIMEOUT]: 500,
  [MissionErrorCode.UNAUTHORIZED]: 401,
  [MissionErrorCode.FORBIDDEN]: 403,
  [MissionErrorCode.EVIDENCE_MISMATCH]: 409,
};

/**
 * Typed mission error with machine-readable code.
 *
 * Extends Error so it integrates with standard try/catch.
 * The `code` property enables programmatic error handling
 * without fragile string matching on message.
 */
export class MissionError extends Error {
  public readonly code: MissionErrorCode;
  public readonly statusCode: number;
  public readonly details: Record<string, unknown> | undefined;

  constructor(
    code: MissionErrorCode,
    statusCode?: number,
    message?: string,
    details?: Record<string, unknown>,
  ) {
    super(message ?? `Mission error: ${code}`);
    this.name = "MissionError";
    this.code = code;
    this.statusCode = statusCode ?? DEFAULT_STATUS_CODES[code] ?? 400;
    this.details = details;

    // Maintain proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, MissionError.prototype);
  }
}

/**
 * Type guard: narrows any error to MissionError.
 *
 * Checks for the `name` property being "MissionError" and
 * the `code` property being a valid MissionErrorCode.
 */
export function isMissionError(error: unknown): error is MissionError {
  return (
    error instanceof MissionError ||
    (typeof error === "object" &&
      error !== null &&
      (error as MissionError).name === "MissionError" &&
      typeof (error as MissionError).code === "string" &&
      Object.values(MissionErrorCode).includes(
        (error as MissionError).code as MissionErrorCode,
      ))
  );
}
