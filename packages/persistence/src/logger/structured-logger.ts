/**
 * StructuredLogger — Puerto para logging estructurado de jobs.
 *
 * Producción usa NoopLogger (default).
 * Infraestructura implementa el adapter con pino/bunyan/winston.
 *
 * Campos canónicos permitidos:
 *   executionId, outboxId, queueName, jobType, uniquenessPolicy,
 *   status, generation, attemptCount, organizationId, companyId,
 *   failureClass, failureCode, divergenceType, repairType,
 *   executionTokenHash, relayTokenHash
 *
 * NUNCA incluir:
 *   payloads, documentos fiscales, contenido OCR/IA, emails,
 *   tokens completos, API keys, stack traces sin sanitizar.
 */

// ─── Context ────────────────────────────────────────────────────────────────

export interface JobLogContext {
	executionId?: string;
	outboxId?: string;
	queueName?: string;
	jobType?: string;
	uniquenessPolicy?: string;
	status?: string;
	generation?: number;
	attemptCount?: number;
	organizationId?: string;
	companyId?: string;
	failureClass?: string;
	failureCode?: string;
	divergenceType?: string;
	repairType?: string;
	executionTokenHash?: string;
	relayTokenHash?: string;
	[key: string]: unknown;
}

// ─── Puerto ─────────────────────────────────────────────────────────────────

export interface StructuredLogger {
	debug(event: string, context: JobLogContext): void;
	info(event: string, context: JobLogContext): void;
	warn(event: string, context: JobLogContext): void;
	error(event: string, context: JobLogContext & { error?: unknown }): void;
}

// ─── Noop (producción) ──────────────────────────────────────────────────────

export class NoopLogger implements StructuredLogger {
	debug() {}
	info() {}
	warn() {}
	error() {}
}
