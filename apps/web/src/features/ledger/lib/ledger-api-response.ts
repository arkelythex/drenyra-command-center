/**
 * Normaliza respuestas HTTP `{ success, data | error }` del API (ok/fail de Elysia).
 */

export function unwrapOkEnvelope<T>(payload: unknown): T {
	if (payload === undefined || payload === null) {
		throw new Error("Empty ledger API response");
	}
	if (typeof payload !== "object" || payload === null || !("success" in payload)) {
		return payload as T;
	}
	const body = payload as { success: boolean; data?: unknown; error?: string };
	if (body.success === true && "data" in body && body.data !== undefined) {
		return body.data as T;
	}
	if (body.success === false && typeof body.error === "string") {
		throw new Error(body.error);
	}
	return payload as T;
}

export function getLedgerErrorMessage(value: unknown): string {
	if (typeof value === "string") return value;
	if (value instanceof Error) return value.message;

	if (
		typeof value === "object" &&
		value !== null &&
		"message" in value &&
		typeof value.message === "string"
	) {
		return value.message;
	}

	if (
		typeof value === "object" &&
		value !== null &&
		"summary" in value &&
		typeof value.summary === "string"
	) {
		return value.summary;
	}

	return "Unexpected ledger API error";
}
