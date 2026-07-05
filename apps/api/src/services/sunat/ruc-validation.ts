/**
 * RUC Validation Module
 * Handles RUC validation logic
 */

import { RUC } from "@drenyra/domain";
import { createLogger } from "../../lib/logger";
import type { RucValidationResult, RucType } from "./sunat-types";

const logger = createLogger({ module: "services/sunat-ruc-validation" });

function maskRuc(ruc: string): string {
	if (ruc.length <= 4) return "***";
	return `${"*".repeat(Math.max(0, ruc.length - 4))}${ruc.slice(-4)}`;
}

/**
 * Validate RUC format (11 digits)
 */
export function isValidRucFormat(ruc: string | null | undefined): boolean {
	if (ruc == null) return false;
	return /^\d{11}$/.test(ruc);
}

/**
 * Validate RUC using Modulo 11 algorithm
 */
export function validateRuc(ruc: string): {
	valid: boolean;
	message: string;
} {
	const isValid = RUC.isValid(ruc);

	return {
		valid: isValid,
		message: isValid
			? "RUC válido según algoritmo Módulo 11"
			: "RUC inválido - dígito verificador incorrecto",
	};
}

/**
 * Validate RUC online with SUNAT API
 * Uses apis.net.pe with caching and fallback to local validation
 */
export async function validateRucOnline(
	ruc: string,
): Promise<RucValidationResult> {
	// First validate format and check digit
	if (!isValidRucFormat(ruc)) {
		return {
			valid: false,
			ruc,
			message: "Formato de RUC inválido (debe ser 11 dígitos)",
		};
	}

	const localValidation = validateRuc(ruc);
	if (!localValidation.valid) {
		return {
			valid: false,
			ruc,
			message: localValidation.message,
		};
	}

	// Try to validate with external API
	try {
		const { validateRucWithAPI } = await import("./external-apis");
		const apiResult = await validateRucWithAPI(ruc);

		// If API validation successful, return it
		if (apiResult.valid) {
			return apiResult;
		}

		// If API failed, return local validation result
		return {
			valid: true,
			ruc,
			message: "RUC válido (validación local - API no disponible)",
		};
	} catch (error) {
		logger.error(
			{ error, rucMasked: maskRuc(ruc) },
			"Error calling external RUC validation API",
		);

		// Fallback to local validation
		return {
			valid: true,
			ruc,
			message: "RUC válido (validación local - API no disponible)",
		};
	}
}

/**
 * Get RUC type based on first digits
 */
export function getRucType(ruc: string): RucType {
	if (!isValidRucFormat(ruc)) {
		return "INVALID";
	}

	const firstDigit = ruc.charAt(0);
	const firstTwoDigits = ruc.substring(0, 2);

	if (firstDigit === "1") {
		return "PERSONA_NATURAL";
	} else if (firstDigit === "2") {
		return "EMPRESA";
	} else if (
		firstTwoDigits === "15" ||
		firstTwoDigits === "16" ||
		firstTwoDigits === "17"
	) {
		return "ENTIDAD_PUBLICA";
	}

	return "INVALID";
}
