/**
 * Breach Detector Service
 * Detects RUC/validation breaches in near real-time (target configurable, default 5s)
 *
 * Breach scenarios:
 * - RUC mismatch (emisor vs. company)
 * - Invalid UBL schema
 * - SUNAT rejection
 * - Timeout (> target)
 */

import type { Ruc } from "../value-objects/ruc.vo";
import type { ValidationResult } from "../value-objects/validation-result.vo";

/**
 * BreachContext interface.
 *
 * @example
 * ```ts
 * const value: BreachContext = {} as BreachContext;
 * console.log(value);
 * ```
 */
export interface BreachContext {
	companyRuc: Ruc;
	documentRuc: Ruc;
	validationResult: ValidationResult;
}

/**
 * BreachDetection interface.
 *
 * @example
 * ```ts
 * const value: BreachDetection = {} as BreachDetection;
 * console.log(value);
 * ```
 */
export interface BreachDetection {
	detected: boolean;
	type?:
		| "RUC_MISMATCH"
		| "SCHEMA_INVALID"
		| "SUNAT_REJECTED"
		| "TIMEOUT"
		| "NONE";
	severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
	message: string;
	detectedInMs: number;
}

/**
 * BreachDetectorService class.
 *
 * @example
 * ```ts
 * const value = new BreachDetectorService();
 * console.log(value);
 * ```
 */
export class BreachDetectorService {
	private static readonly TIMEOUT_THRESHOLD_MS = Number(
		process.env.CPE_BREACH_TARGET_MS ?? 5000,
	);

	/**
	 * Detect breaches in real-time (< target threshold)
	 */
	async detect(context: BreachContext): Promise<BreachDetection> {
		const startTime = Date.now();

		// 1. Check RUC mismatch (highest priority)
		if (!context.companyRuc.equals(context.documentRuc)) {
			return {
				detected: true,
				type: "RUC_MISMATCH",
				severity: "CRITICAL",
				message: `RUC mismatch: company ${context.companyRuc} ≠ document ${context.documentRuc}`,
				detectedInMs: Date.now() - startTime,
			};
		}

		// 2. Check schema validation
		if (context.validationResult.status === "INVALID_SCHEMA") {
			return {
				detected: true,
				type: "SCHEMA_INVALID",
				severity: "HIGH",
				message: `Invalid UBL schema: ${context.validationResult.errors[0]?.message}`,
				detectedInMs: Date.now() - startTime,
			};
		}

		// 3. Check SUNAT rejection
		if (context.validationResult.status === "REJECTED_SUNAT") {
			return {
				detected: true,
				type: "SUNAT_REJECTED",
				severity: "HIGH",
				message: `SUNAT rejected: ${context.validationResult.errors[0]?.message}`,
				detectedInMs: Date.now() - startTime,
			};
		}

		// 4. Check timeout
		if (context.validationResult.durationMs > BreachDetectorService.TIMEOUT_THRESHOLD_MS) {
			return {
				detected: true,
				type: "TIMEOUT",
				severity: "MEDIUM",
				message: `Validation timeout (${context.validationResult.durationMs}ms > ${BreachDetectorService.TIMEOUT_THRESHOLD_MS}ms)`,
				detectedInMs: Date.now() - startTime,
			};
		}

		// No breach detected
		return {
			detected: false,
			severity: "LOW",
			message: "No breach detected",
			detectedInMs: Date.now() - startTime,
		};
	}

	/**
	 * Check if detection was fast (< target threshold)
	 */
	isFastDetection(detection: BreachDetection): boolean {
		return detection.detectedInMs < BreachDetectorService.TIMEOUT_THRESHOLD_MS;
	}
}
