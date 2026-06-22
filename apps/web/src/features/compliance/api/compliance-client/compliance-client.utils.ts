/**
 * Compliance API client utilities
 *
 * @module compliance-client/utils
 */

import { api } from "@/lib/api";
import type { CpeValidationEnvelope } from "./compliance-client.types";

export function getComplianceClient() {
	const client = api.compliance;
	if (!client) throw new Error("compliance API client not configured");
	return client;
}

export function getCpeValidatorClient() {
	const client = api["cpe-validator"];
	if (!client) throw new Error("cpe-validator API client not configured");
	return client;
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null;
}

export function isCpeValidationEnvelope(
	value: unknown,
): value is CpeValidationEnvelope {
	if (!isRecord(value)) return false;
	const data = value.data;
	return (
		typeof value.success === "boolean" &&
		isRecord(data) &&
		typeof data.isValid === "boolean" &&
		typeof data.status === "string" &&
		typeof data.durationMs === "number" &&
		typeof data.validationSource === "string" &&
		isRecord(data.incident)
	);
}
