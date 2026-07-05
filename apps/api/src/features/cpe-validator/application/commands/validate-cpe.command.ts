/**
 * Validate CPE Command
 * Orchestrates CPE validation pipeline: UBL → SUNAT → Breach Detection
 *
 * Target: < 5s total validation time (configurable by CPE_BREACH_TARGET_MS)
 */

import { BreachDetectorService } from "../../domain/services/breach-detector.service";
import { UblValidatorService } from "../../domain/services/ubl-validator.service";
import { ValidationCacheService } from "../../domain/services/validation-cache.service";
import { CpeNumber } from "../../domain/value-objects/cpe-number.vo";
import { Ruc } from "../../domain/value-objects/ruc.vo";
import { ValidationResult } from "../../domain/value-objects/validation-result.vo";
import { SunatCpeClient } from "../../infrastructure/sunat-cpe-client";
import {
	type CpeIncidentInfo,
	classifyCpeIncident,
} from "../cpe-incident-classifier";
import { SunatFallbackOrchestrator } from "../fallback/sunat-fallback-orchestrator";

/**
 * ValidateCpeInput interface.
 *
 * @example
 * ```ts
 * const value: ValidateCpeInput = {} as ValidateCpeInput;
 * console.log(value);
 * ```
 */
export interface ValidateCpeInput {
	companyRuc: string;
	cpeNumber: string;
	xmlContent: string;
	issueDate: string; // YYYY-MM-DD
	totalAmount: number;
	skipCache?: boolean;
}

/**
 * ValidateCpeOutput interface.
 *
 * @example
 * ```ts
 * const value: ValidateCpeOutput = {} as ValidateCpeOutput;
 * console.log(value);
 * ```
 */
export interface ValidateCpeOutput {
	isValid: boolean;
	status: string;
	errors: Array<{ code: string; message: string }>;
	warnings: string[];
	durationMs: number;
	breachDetected: boolean;
	breachType?: string;
	cacheHit: boolean;
	targetMs: number;
	withinTarget: boolean;
	validationSource:
		| "cache"
		| "sunat_api"
		| "sunat_sandbox"
		| "sunat_replay"
		| "visual_subagent";
	fallbackActivated: boolean;
	fallbackReason?: string;
	hitlRequired: boolean;
	hitl?: {
		challengeType: "captcha" | "unexpected_popup";
		channel: "whatsapp";
		message: string;
		screenshotRef: string;
	};
	traceSteps: string[];
	incident: CpeIncidentInfo;
}

const ublValidator = new UblValidatorService();
const breachDetector = new BreachDetectorService();
const cache = new ValidationCacheService();
const sunatClient = new SunatCpeClient();
const sunatOrchestrator = new SunatFallbackOrchestrator(sunatClient);
const CPE_TARGET_MS = Number(process.env.CPE_BREACH_TARGET_MS ?? 5000);

/**
 * Returns read-only validation cache statistics for operational diagnostics.
 *
 * @returns Current in-memory cache utilization.
 */
export function getValidationCacheStats() {
	return cache.getStats();
}

/**
 * Validate CPE with parallel UBL + SUNAT validation
 * Returns breach detection in < target threshold
 * @param input - Input for input.
 * @returns Result of validateCpe.
 * @example
 * ```ts
 * const result = await validateCpe({} as ValidateCpeInput);
 * console.log(result);
 * ```
 */

export async function validateCpe(
	input: ValidateCpeInput,
): Promise<ValidateCpeOutput> {
	const startTime = Date.now();

	// 1. Parse value objects
	const companyRuc = Ruc.create(input.companyRuc);
	const cpeNumber = CpeNumber.create(input.cpeNumber);

	// 2. Check cache (unless skipped)
	if (!input.skipCache) {
		const cached = cache.get(cpeNumber);
		if (cached) {
			return {
				isValid: cached.isValid,
				status: cached.status,
				errors: cached.errors,
				warnings: cached.warnings,
				durationMs: Date.now() - startTime,
				breachDetected: cached.status === "BREACH_DETECTED",
				breachType: cached.errors[0]?.code,
				cacheHit: true,
				targetMs: CPE_TARGET_MS,
				withinTarget: Date.now() - startTime <= CPE_TARGET_MS,
				validationSource: "cache",
				fallbackActivated: false,
				hitlRequired: false,
				traceSteps: ["cache:hit"],
				incident: classifyCpeIncident({
					status: cached.status,
					errors: cached.errors,
					breachDetected: cached.status === "BREACH_DETECTED",
					breachType:
						cached.status === "BREACH_DETECTED"
							? cached.errors[0]?.code
							: undefined,
					fallbackActivated: false,
					hitlRequired: false,
				}),
			};
		}
	}

	// 3. Parallel validation: UBL (offline) + SUNAT (online)
	const [ublResult, sunatValidation] = await Promise.all([
		ublValidator.validate({ content: input.xmlContent }),
		sunatOrchestrator.validate({
			ruc: companyRuc,
			cpeNumber,
			issueDate: input.issueDate,
			totalAmount: input.totalAmount,
		}),
	]);

	const durationMs = Date.now() - startTime;

	// 4. Build validation result
	let validationResult: ValidationResult;

	if (!ublResult.isValid) {
		validationResult = ValidationResult.invalid(
			"INVALID_SCHEMA",
			ublResult.errors,
			durationMs,
		);
	} else {
		const sunatErrors = sunatClient.mapToErrors(sunatValidation.response);

		if (sunatErrors) {
			validationResult = ValidationResult.invalid(
				"REJECTED_SUNAT",
				sunatErrors,
				durationMs,
			);
		} else {
			validationResult = ValidationResult.valid(durationMs, ublResult.warnings);
		}
	}

	// 5. Extract document RUC from XML (simple extraction for MVP)
	const documentRuc = extractRucFromXml(input.xmlContent);

	// 6. Breach detection
	const breachDetection = await breachDetector.detect({
		companyRuc,
		documentRuc,
		validationResult,
	});

	// If breach detected, override validation result
	if (breachDetection.detected) {
		validationResult = ValidationResult.breach(
			breachDetection.message,
			breachDetection.detectedInMs,
		);
	}

	// 7. Cache result
	cache.set(cpeNumber, validationResult);

	return {
		isValid: validationResult.isValid,
		status: validationResult.status,
		errors: validationResult.errors,
		warnings: validationResult.warnings,
		durationMs: validationResult.durationMs,
		breachDetected: breachDetection.detected,
		breachType: breachDetection.type,
		cacheHit: false,
		targetMs: CPE_TARGET_MS,
		withinTarget: validationResult.durationMs <= CPE_TARGET_MS,
		validationSource: sunatValidation.source,
		fallbackActivated: sunatValidation.fallbackActivated,
		fallbackReason: sunatValidation.fallbackReason,
		hitlRequired: Boolean(sunatValidation.hitl),
		hitl: sunatValidation.hitl,
		traceSteps: sunatValidation.traceSteps,
		incident: classifyCpeIncident({
			status: validationResult.status,
			errors: validationResult.errors,
			sunatState: sunatValidation.response.estado,
			breachDetected: breachDetection.detected,
			breachType: breachDetection.type,
			fallbackActivated: sunatValidation.fallbackActivated,
			hitlRequired: Boolean(sunatValidation.hitl),
			fallbackReason: sunatValidation.fallbackReason,
		}),
	};
}

/**
 * Extract RUC from XML (MVP: simple regex)
 * Production: Use proper XML parser
 */
function extractRucFromXml(xml: string): Ruc {
	// Try both formats: nested PartyIdentification and direct
	const patterns = [
		/<cac:AccountingSupplierParty>[\s\S]*?<cac:PartyIdentification>[\s\S]*?<cbc:ID[^>]*>(\d{11})<\/cbc:ID>/,
		/<cac:AccountingSupplierParty>[\s\S]*?<cbc:ID[^>]*>(\d{11})<\/cbc:ID>/,
	];

	for (const pattern of patterns) {
		const match = xml.match(pattern);
		if (match) {
			return Ruc.create(match[1]);
		}
	}

	throw new Error("Cannot extract RUC from XML");
}
