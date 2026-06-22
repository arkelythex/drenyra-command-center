/**
 * Backward-compatible wrapper around the unified env schema.
 *
 * Previously validated only 7 keys inline.
 * Now delegates to @arkelythex/platform-core's unified schema (40+ keys).
 *
 * @see packages/platform-core/src/config/env-schema.ts
 */

import { validateEnv } from "@arkelythex/platform-core/config/env-schema";

export {
	type Env as ApiEnv,
	EnvSchema as ApiEnvSchema,
} from "@arkelythex/platform-core/config/env-schema";

export function validateApiEnv() {
	return validateEnv(process.env);
}
