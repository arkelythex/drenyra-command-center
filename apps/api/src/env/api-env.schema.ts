/**
 * Backward-compatible wrapper around the unified env schema.
 *
 * Previously validated only 7 keys inline.
 * Now delegates to @drenyra/shared's unified schema (40+ keys).
 *
 * @see packages/shared/src/config/env-schema.ts
 */

import { validateEnv } from "@drenyra/shared/config/env-schema";

export {
	type Env as ApiEnv,
	EnvSchema as ApiEnvSchema,
} from "@drenyra/shared/config/env-schema";

export function validateApiEnv() {
	return validateEnv(process.env);
}
