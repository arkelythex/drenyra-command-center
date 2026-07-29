/**
 * SecretProvider Interface — decouples secret consumers from storage backends.
 *
 * Currently backed by environment variables. Designed to support
 * Infisical / HashiCorp Vault in the future without consumer changes.
 *
 * @module secrets/provider
 */

/** Result of secrets validation at startup. */
export interface ValidationResult {
	valid: boolean;
	errors: ValidationError[];
	warnings: ValidationWarning[];
}

export interface ValidationError {
	secretName: string;
	reason: "missing" | "empty" | "placeholder" | "low_entropy";
	detail: string;
}

export interface ValidationWarning {
	secretName: string;
	reason: string;
}

/** Error thrown when a requested secret is not found. */
export class SecretNotFoundError extends Error {
	constructor(secretName: string) {
		super(`Secret not found: ${secretName}`);
		this.name = "SecretNotFoundError";
	}
}

/** Core secret provider interface — implement for each backend. */
export interface SecretProvider {
	/** Resolve a single secret by name. Throws SecretNotFoundError on failure. */
	getSecret(name: string): Promise<string>;

	/** Validate all known secrets. Returns pass/fail + detailed diagnostics. */
	validateSecrets(options?: { strict?: boolean }): Promise<ValidationResult>;
}
