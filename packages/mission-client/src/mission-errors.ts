export class MissionClientError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number = 400,
    public readonly details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "MissionClientError";
  }

  static fromResponse(status: number, body: { error?: string; code?: string; details?: Record<string, unknown> }): MissionClientError {
    const messages: Record<number, string> = {
      400: "Solicitud invalida",
      401: "No autorizado",
      403: "Acceso denegado",
      404: "Mision no encontrada",
      409: "Conflicto de version o idempotencia",
      422: "Datos invalidos",
      429: "Demasiadas solicitudes",
      500: "Error interno del servidor",
    };
    return new MissionClientError(
      body?.error ?? messages[status] ?? "Error desconocido",
      body?.code ?? `HTTP_${status}`,
      status,
      body?.details,
    );
  }

  static timeout(): MissionClientError {
    return new MissionClientError(
      "La solicitud excedio el tiempo de espera",
      "TIMEOUT",
      408,
    );
  }

  static network(error: string): MissionClientError {
    return new MissionClientError(
      `Error de red: ${error}`,
      "NETWORK_ERROR",
      0,
    );
  }

  static idempotencyConflict(): MissionClientError {
    return new MissionClientError(
      "Clave de idempotencia reutilizada con payload diferente",
      "IDEMPOTENCY_CONFLICT",
      409,
    );
  }

  static versionConflict(currentVersion: number, expectedVersion: number): MissionClientError {
    return new MissionClientError(
      "Conflicto de version",
      "VERSION_CONFLICT",
      409,
      { currentVersion, expectedVersion },
    );
  }

  static evidenceMismatch(): MissionClientError {
    return new MissionClientError(
      "La evidencia cambio desde que se reviso la propuesta",
      "EVIDENCE_MISMATCH",
      409,
    );
  }
}
