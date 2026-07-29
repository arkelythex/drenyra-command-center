/**
 * Startup Secret Validation — environment-aware validation logic.
 *
 * Behavior varies by environment:
 * - CI: strict mode, process.exit(1) on failure
 * - Development: non-strict, warnings logged
 * - Production: non-strict, errors logged, health check reports
 *
 * @module secrets/validation
 */

import type { SecretProvider } from "./provider";
import { EnvProvider } from "./env-provider";

/** Validate all secrets at startup. */
export async function validateSecrets(
	provider?: SecretProvider,
	options?: { strict?: boolean },
): Promise<boolean> {
	const isCI = process.env.CI === "true";
	const strictEnv = process.env.SECRET_VALIDATION_STRICT === "true";
	const strict = options?.strict ?? isCI ?? strictEnv;

	const sp = provider ?? new EnvProvider();
	const result = await sp.validateSecrets({ strict });

	if (result.errors.length > 0) {
		const errorLines = result.errors.map(
			(e) => `  [${e.reason}] ${e.secretName}: ${e.detail}`,
		);

		if (strict || isCI) {
			console.error(
				`❌ SECRET VALIDATION FAILED (strict mode):\n${errorLines.join("\n")}`,
			);
			process.exit(1);
		} else {
			console.error(`⚠️  SECRET VALIDATION WARNINGS:\n${errorLines.join("\n")}`);
		}
	}

	if (result.warnings.length > 0) {
		const warnLines = result.warnings.map(
			(w) => `  ${w.secretName}: ${w.reason}`,
		);
		console.warn(`🔶 SECRET VALIDATION WARNINGS:\n${warnLines.join("\n")}`);
	}

	return result.valid;
}
