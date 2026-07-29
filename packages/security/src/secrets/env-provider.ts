/**
 * EnvProvider — reads secrets from process environment variables.
 *
 * Default SecretProvider implementation. Supports strict-mode entropy
 * validation for cryptographic secrets.
 *
 * @module secrets/env-provider
 */

import type {
	SecretProvider,
	ValidationResult,
	ValidationError,
	ValidationWarning,
} from "./provider";
import { SecretNotFoundError } from "./provider";
import { SECRETS_INVENTORY } from "./inventory";

const PLACEHOLDER_PATTERNS = [
	/^changeme$/i,
	/^todo$/i,
	/^your-secret-here$/i,
	/^replace-me$/i,
	/^secret$/i,
];

function isPlaceholder(value: string): boolean {
	const trimmed = value.trim();
	return PLACEHOLDER_PATTERNS.some((p) => p.test(trimmed));
}

/** Shannon entropy estimation (bits). */
function estimateEntropy(value: string): number {
	if (value.length === 0) return 0;

	const frequencies: Record<string, number> = {};
	for (const char of value) {
		frequencies[char] = (frequencies[char] ?? 0) + 1;
	}

	let entropy = 0;
	const len = value.length;
	for (const count of Object.values(frequencies)) {
		const p = count / len;
		entropy -= p * Math.log2(p);
	}

	return entropy * len;
}

export class EnvProvider implements SecretProvider {
	async getSecret(name: string): Promise<string> {
		const value = process.env[name];
		if (!value) {
			throw new SecretNotFoundError(name);
		}
		return value;
	}

	async validateSecrets(options?: {
		strict?: boolean;
	}): Promise<ValidationResult> {
		const strict = options?.strict ?? false;
		const errors: ValidationError[] = [];
		const warnings: ValidationWarning[] = [];

		for (const meta of SECRETS_INVENTORY) {
			if (!meta.required && !strict) continue;

			const value = process.env[meta.name];

			// Missing
			if (!value) {
				if (meta.required || strict) {
					errors.push({
						secretName: meta.name,
						reason: "missing",
						detail: `Required secret ${meta.name} is not set`,
					});
				} else {
					warnings.push({
						secretName: meta.name,
						reason: `Secret ${meta.name} is not set`,
					});
				}
				continue;
			}

			// Empty
			if (value.trim().length === 0) {
				errors.push({
					secretName: meta.name,
					reason: "empty",
					detail: `Secret ${meta.name} is an empty string`,
				});
				continue;
			}

			// Placeholder
			if (isPlaceholder(value)) {
				errors.push({
					secretName: meta.name,
					reason: "placeholder",
					detail: `Secret ${meta.name} contains a placeholder value: "${value}"`,
				});
				continue;
			}

			// Entropy check (strict mode only)
			if (strict && meta.minEntropy) {
				const entropy = estimateEntropy(value);
				if (entropy < meta.minEntropy) {
					errors.push({
						secretName: meta.name,
						reason: "low_entropy",
						detail: `Secret ${meta.name} has entropy ${entropy.toFixed(1)} bits, minimum ${meta.minEntropy} required`,
					});
				}
			}

			// Existing but optional secrets: just note they're present
			if (!meta.required && value) {
				// Present, no issue
			}
		}

		return {
			valid: errors.length === 0,
			errors,
			warnings,
		};
	}
}
