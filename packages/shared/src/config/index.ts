/**
 * Config — env schema, logger, rate-limit
 *
 * Migrated from @drenyra/platform-core/config
 *
 * @module @drenyra/shared/config
 */

export type { Env } from "./env-schema.js";
export { EnvSchema, validateEnv } from "./env-schema.js";
export {
	createLogger,
	logOperation,
	logRequest,
	REDACTION_PLACEHOLDER,
	rootLogger,
} from "./logger.js";
export {
	lenientRateLimit,
	rateLimitMiddleware,
	standardRateLimit,
	strictRateLimit,
} from "./rate-limit.js";
