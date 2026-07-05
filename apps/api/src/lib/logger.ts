/**
 * Backward-compatible re-export of @drenyra/platform-core logger.
 *
 * All exports preserved for existing consumers.
 *
 * @see packages/platform-core/src/config/logger.ts
 */

export {
	createLogger,
	logOperation,
	logRequest,
	REDACTION_PLACEHOLDER,
	redactLogPayload,
	rootLogger as logger,
} from "@drenyra/platform-core/config/logger";
