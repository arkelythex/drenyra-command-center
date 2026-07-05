import {
	CPE_COMPLIANCE_INCIDENT_RUNBOOK,
	type RunbookReference,
} from "../../../lib/compliance-runbooks";
import { findSunatCatalogEntry } from "../domain/sunat-code-catalog";
import type {
	ValidationError,
	ValidationStatus,
} from "../domain/value-objects/validation-result.vo";

/**
 * CpeIncidentCategory type.
 *
 * @example
 * ```ts
 * const value: CpeIncidentCategory = {} as CpeIncidentCategory;
 * console.log(value);
 * ```
 */
export type CpeIncidentCategory =
	| "NONE"
	| "MANUAL_REVIEW"
	| "SCHEMA_INVALID"
	| "SUNAT_REJECTED"
	| "SUNAT_OBSERVED"
	| "SUNAT_NOT_FOUND"
	| "SUNAT_ANNULLED"
	| "RUC_MISMATCH"
	| "TIMEOUT";

/**
 * CpeIncidentSeverity type.
 *
 * @example
 * ```ts
 * const value: CpeIncidentSeverity = {} as CpeIncidentSeverity;
 * console.log(value);
 * ```
 */
export type CpeIncidentSeverity = "low" | "medium" | "high" | "critical";

/**
 * CpeIncidentInfo interface.
 *
 * @example
 * ```ts
 * const value: CpeIncidentInfo = {} as CpeIncidentInfo;
 * console.log(value);
 * ```
 */
export interface CpeIncidentInfo {
	isIncident: boolean;
	category: CpeIncidentCategory;
	severity: CpeIncidentSeverity;
	summary: string;
	supportMessage?: string;
	runbook?: RunbookReference;
}

type ClassifyInput = {
	status: ValidationStatus;
	errors: ValidationError[];
	sunatState?: string;
	breachDetected: boolean;
	breachType?: string;
	fallbackActivated: boolean;
	hitlRequired: boolean;
	fallbackReason?: string;
};

/**
 * classifyCpeIncident operation.
 *
 * @param input - Input for input.
 * @returns Result of classifyCpeIncident.
 * @example
 * ```ts
 * const result = classifyCpeIncident({} as ClassifyInput);
 * console.log(result);
 * ```
 */
export function classifyCpeIncident(input: ClassifyInput): CpeIncidentInfo {
	if (input.breachDetected && input.breachType === "RUC_MISMATCH") {
		return {
			isIncident: true,
			category: "RUC_MISMATCH",
			severity: "critical",
			summary: "RUC mismatch detected between company and XML supplier.",
			supportMessage:
				"Contrastar el RUC del XML con la empresa activa antes de enviar el comprobante.",
			runbook: CPE_COMPLIANCE_INCIDENT_RUNBOOK,
		};
	}

	if (input.breachDetected && input.breachType === "SUNAT_REJECTED") {
		return classifySunatStateIncident(input.sunatState, input.errors);
	}

	if (input.status === "INVALID_SCHEMA") {
		return {
			isIncident: true,
			category: "SCHEMA_INVALID",
			severity: "high",
			summary: "CPE XML failed the current structural validation baseline.",
			supportMessage:
				"Corregir la estructura del XML y volver a validar antes de enviarlo a SUNAT.",
			runbook: CPE_COMPLIANCE_INCIDENT_RUNBOOK,
		};
	}

	if (input.fallbackActivated || input.hitlRequired) {
		return {
			isIncident: true,
			category: "MANUAL_REVIEW",
			severity: input.hitlRequired ? "high" : "medium",
			summary: input.hitlRequired
				? "Validation requires human intervention before continuing."
				: "Primary SUNAT validation failed and fallback mode was activated.",
			supportMessage: input.hitlRequired
				? "Resolver el desafio manual y reanudar la validacion con evidencia."
				: "Revisar el fallback aplicado y confirmar el resultado antes de continuar.",
			runbook: CPE_COMPLIANCE_INCIDENT_RUNBOOK,
		};
	}

	if (
		input.status === "TIMEOUT" ||
		(input.fallbackReason ?? "").toUpperCase().includes("TIMEOUT")
	) {
		return {
			isIncident: true,
			category: "TIMEOUT",
			severity: "medium",
			summary: "SUNAT validation exceeded the configured timeout window.",
			supportMessage:
				"Reintentar la validacion y confirmar conectividad antes de escalar el incidente.",
			runbook: CPE_COMPLIANCE_INCIDENT_RUNBOOK,
		};
	}

	if (input.status === "REJECTED_SUNAT") {
		return classifySunatStateIncident(input.sunatState, input.errors);
	}

	return {
		isIncident: false,
		category: "NONE",
		severity: "low",
		summary: "No incident detected.",
	};
}

function classifySunatStateIncident(
	sunatState: string | undefined,
	errors: ValidationError[],
): CpeIncidentInfo {
	const primaryErrorCode = errors[0]?.code ?? "";
	const knownIssue = findSunatCatalogEntry(sunatState, primaryErrorCode);

	if (knownIssue) {
		return {
			isIncident: true,
			category: knownIssue.incidentCategory,
			severity: knownIssue.severity,
			summary: knownIssue.summary,
			supportMessage: knownIssue.supportMessage,
			runbook: CPE_COMPLIANCE_INCIDENT_RUNBOOK,
		};
	}

	return {
		isIncident: true,
		category: "SUNAT_REJECTED",
		severity: "high",
		summary: "SUNAT rejected the CPE during validation.",
		supportMessage:
			"Revisar el codigo de rechazo y corregir el comprobante antes de reenviar.",
		runbook: CPE_COMPLIANCE_INCIDENT_RUNBOOK,
	};
}
