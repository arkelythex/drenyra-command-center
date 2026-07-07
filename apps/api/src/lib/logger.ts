/**
 * Backward-compatible re-export of @drenyra/shared/config/logger.
 *
 * All exports preserved for existing consumers.
 *
 * @see packages/shared/src/config/logger.ts
 */

export {
	createLogger,
	logOperation,
	logRequest,
	REDACTION_PLACEHOLDER,
	redactLogPayload,
	rootLogger as logger,
} from "@drenyra/shared/config/logger";
