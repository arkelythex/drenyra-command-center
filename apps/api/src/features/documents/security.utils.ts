import { resolveSessionIdentityFromHeaders } from "../auth/handlers/session-identity";

const DEFAULT_ACTOR_ID = "system";
const SAFE_ACTOR_ID_PATTERN = /^[A-Za-z0-9:_-]+$/;

type HeaderContainer = Headers | Record<string, unknown> | undefined;

function readHeaderValue(headers: HeaderContainer, key: string): string {
	if (!headers) return "";

	if (headers instanceof Headers) {
		return headers.get(key) ?? headers.get(key.toLowerCase()) ?? "";
	}

	const direct = headers[key];
	if (typeof direct === "string") return direct;

	const lower = headers[key.toLowerCase()];
	if (typeof lower === "string") return lower;

	return "";
}

/**
 * sanitizeActorId operation.
 *
 * @param input - Input for input.
 * @returns Result of sanitizeActorId.
 * @example
 * ```ts
 * const result = sanitizeActorId(undefined);
 * console.log(result);
 * ```
 */
export function sanitizeActorId(input: unknown): string {
	if (typeof input !== "string") return "";
	const trimmed = input.trim();
	if (!trimmed) return "";

	const bounded = trimmed.slice(0, 128);
	return SAFE_ACTOR_ID_PATTERN.test(bounded) ? bounded : "";
}

/**
 * resolveActorIdFromHeaders operation.
 *
 * @param headers - Input for headers.
 * @param fallback - Input for fallback.
 * @returns Result of resolveActorIdFromHeaders.
 * @example
 * ```ts
 * const result = resolveActorIdFromHeaders({} as HeaderContainer, "");
 * console.log(result);
 * ```
 */
export async function resolveActorIdFromHeaders(
	headers: HeaderContainer,
	fallback: string = DEFAULT_ACTOR_ID,
): Promise<string> {
	const sessionIdentity = await resolveSessionIdentityFromHeaders(
		(headers ?? {}) as Record<string, string | string[] | undefined>,
	);
	if (sessionIdentity.authUserId) {
		return sanitizeActorId(sessionIdentity.authUserId) || DEFAULT_ACTOR_ID;
	}

	const candidates = [
		readHeaderValue(headers, "x-auth-user-id"),
		readHeaderValue(headers, "x-user-id"),
		readHeaderValue(headers, "x-actor-id"),
	];

	for (const candidate of candidates) {
		const sanitized = sanitizeActorId(candidate);
		if (sanitized) return sanitized;
	}

	const safeFallback = sanitizeActorId(fallback);
	return safeFallback || DEFAULT_ACTOR_ID;
}

/**
 * parseStoredExtractedData operation.
 *
 * @param raw - Input for raw.
 * @returns Result of parseStoredExtractedData.
 * @example
 * ```ts
 * const result = parseStoredExtractedData(undefined);
 * console.log(result);
 * ```
 */
export function parseStoredExtractedData(
	raw: unknown,
): Record<string, unknown> {
	if (!raw) return {};

	if (typeof raw === "string") {
		try {
			const parsed = JSON.parse(raw);
			return parsed && typeof parsed === "object" && !Array.isArray(parsed)
				? (parsed as Record<string, unknown>)
				: {};
		} catch {
			return {};
		}
	}

	if (typeof raw === "object" && !Array.isArray(raw)) {
		return raw as Record<string, unknown>;
	}

	return {};
}

/**
 * hasUnsafeXmlDeclarations operation.
 *
 * @param xmlContent - Input for xmlContent.
 * @returns Result of hasUnsafeXmlDeclarations.
 * @example
 * ```ts
 * const result = hasUnsafeXmlDeclarations("");
 * console.log(result);
 * ```
 */
export function hasUnsafeXmlDeclarations(xmlContent: string): boolean {
	return /<!DOCTYPE|<!ENTITY/i.test(xmlContent);
}
