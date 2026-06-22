/**
 * OSE Configuration Validator
 * Single Responsibility: Validate OSE configuration
 *
 * @principle SRP - Only validates config, nothing else
 * @principle Pure Functions - No side effects
 */

import type { OSEConfig, ValidationResult } from "./types";

export class OSEConfigValidator {
	validate(config: OSEConfig): ValidationResult {
		const missing: string[] = [];
		const errors: string[] = [];
		const isSimulation = config.provider === "simulation" || config.simulationMode === true;

		if (isSimulation) {
			return { valid: true, missing, errors };
		}

		if (!this.isValidString(config.apiToken)) {
			missing.push("OSE_API_TOKEN");
		}

		if (!this.isValidString(config.ruc)) {
			missing.push("COMPANY_RUC");
		} else if (!this.isValidRUC(config.ruc)) {
			errors.push("COMPANY_RUC debe tener 11 dígitos");
		}

		if (!this.isValidString(config.username)) {
			missing.push("OSE_USERNAME");
		}

		if (!this.isValidString(config.apiUrl)) {
			missing.push("OSE_API_URL");
		}

		return {
			valid: missing.length === 0 && errors.length === 0,
			missing,
			errors,
		};
	}

	private isValidString(value: string | undefined): boolean {
		return typeof value === "string" && value.trim().length > 0;
	}

	private isValidRUC(ruc: string): boolean {
		return /^\d{11}$/.test(ruc);
	}
}

export const oseConfigValidator = new OSEConfigValidator();
