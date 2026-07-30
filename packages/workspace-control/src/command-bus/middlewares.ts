import {
	WorkspaceCommandSchema,
	type CommandEnvelope,
	type WorkspaceCommand,
} from "@drenyra/workspace-contracts";
import type { CommandMiddleware, CommandResult } from "./types";

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Build a CommandResult, conditionally including correlationId when present.
 * Required because exactOptionalPropertyTypes forbids assigning `undefined`
 * to an optional property.
 */
function errorResult(
	code: string,
	error: string,
	correlationId?: string,
): CommandResult {
	const result = {
		ok: false as const,
		error,
		code,
	};
	if (correlationId) {
		return { ...result, correlationId } as unknown as CommandResult;
	}
	return result as unknown as CommandResult;
}

// ─── Validation Middleware ──────────────────────────────────────────────────

/**
 * Validates the command inside the envelope against the full discriminated
 * union schema. If validation fails, returns an error result immediately,
 * short-circuiting the pipeline.
 */
export function validationMiddleware(): CommandMiddleware {
	return (
		envelope: CommandEnvelope,
		next: (envelope: CommandEnvelope) => CommandResult,
	): CommandResult => {
		const result = WorkspaceCommandSchema.safeParse(envelope.command);

		if (!result.success) {
			const issues = result.error.issues
				.map((i) => `${i.path.map(String).join(".")}: ${i.message}`)
				.join("; ");

			return errorResult(
				"VALIDATION_ERROR",
				`Command validation failed: ${issues}`,
				envelope.correlationId,
			);
		}

		// Forward the validated command inside the envelope
		const validatedEnvelope: CommandEnvelope = {
			...envelope,
			command: result.data as WorkspaceCommand,
		};

		return next(validatedEnvelope);
	};
}

// ─── Auth Middleware ────────────────────────────────────────────────────────

/**
 * Ensures userId is present in the envelope.
 * Returns UNAUTHORIZED if missing.
 */
export function authMiddleware(): CommandMiddleware {
	return (
		envelope: CommandEnvelope,
		next: (envelope: CommandEnvelope) => CommandResult,
	): CommandResult => {
		if (!envelope.userId) {
			return errorResult(
				"UNAUTHORIZED",
				"Authentication required: userId is missing",
				envelope.correlationId,
			);
		}

		return next(envelope);
	};
}

// ─── Logging Middleware ─────────────────────────────────────────────────────

/**
 * Logs command execution for debugging purposes.
 * The logger callback is optional; when not provided, logging is silent.
 */
export interface LoggingMiddlewareOptions {
	logger?: (message: string) => void;
}

export function loggingMiddleware(
	options: LoggingMiddlewareOptions = {},
): CommandMiddleware {
	const log = options.logger;

	return (
		envelope: CommandEnvelope,
		next: (envelope: CommandEnvelope) => CommandResult,
	): CommandResult => {
		const commandType = envelope.command.commandType;
		const correlationId = envelope.correlationId ?? "none";

		if (log) {
			log(
				`[CommandBus] executing "${commandType}" (correlationId: ${correlationId})`,
			);
		}

		const start = Date.now();
		const result = next(envelope);
		const elapsed = Date.now() - start;

		if (log) {
			log(
				`[CommandBus] "${commandType}" ${result.ok ? "OK" : "FAILED"} (${elapsed}ms)`,
			);
		}

		return result;
	};
}
