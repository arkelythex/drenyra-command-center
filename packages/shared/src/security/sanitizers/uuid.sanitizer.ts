/**
 * Supported UUID versions accepted by Drenyra validators.
 *
 * @example
 * ```ts
 * const version: UuidVersion = 7;
 * ```
 */
export type UuidVersion = 4 | 5 | 7;

/**
 * Result envelope returned by UUID sanitization helpers.
 *
 * @example
 * ```ts
 * const output: UuidSanitizeResult = {
 *   value: "550e8400-e29b-41d4-a716-446655440000",
 *   isValid: true,
 *   version: 4,
 *   normalized: "550e8400-e29b-41d4-a716-446655440000",
 * };
 * ```
 */
export interface UuidSanitizeResult {
	value: string | null;
	isValid: boolean;
	version: UuidVersion | null;
	normalized: string | null;
}

const UUID_PATTERNS: Record<UuidVersion, RegExp> = {
	4: /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
	5: /^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
	7: /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
};

function detectUuidVersion(uuid: string): UuidVersion | null {
	const versionChar = uuid.charAt(14);
	switch (versionChar) {
		case "4":
			return 4;
		case "5":
			return 5;
		case "7":
			return 7;
		default:
			return null;
	}
}

/**
 * Validates and normalizes a UUID against allowed versions.
 *
 * @param uuid - Candidate UUID input
 * @param allowedVersions - List of accepted UUID versions
 * @returns Validation result with normalized value and detected version
 * @example
 * ```ts
 * const result = sanitizeUuid("550E8400-E29B-41D4-A716-446655440000", [4]);
 * // { isValid: true, value: "550e8400-e29b-41d4-a716-446655440000", ... }
 * ```
 */
export function sanitizeUuid(
	uuid: unknown,
	allowedVersions: UuidVersion[] = [4, 5, 7],
): UuidSanitizeResult {
	if (typeof uuid !== "string") {
		return {
			value: null,
			isValid: false,
			version: null,
			normalized: null,
		};
	}

	const trimmed = uuid.trim();
	if (!trimmed) {
		return {
			value: null,
			isValid: false,
			version: null,
			normalized: null,
		};
	}

	const normalized = trimmed.toLowerCase();
	const detectedVersion = detectUuidVersion(normalized);

	if (!detectedVersion || !allowedVersions.includes(detectedVersion)) {
		return {
			value: null,
			isValid: false,
			version: detectedVersion,
			normalized,
		};
	}

	const pattern = UUID_PATTERNS[detectedVersion];
	const isValid = pattern.test(normalized);

	return {
		value: isValid ? normalized : null,
		isValid,
		version: detectedVersion,
		normalized,
	};
}

/**
 * Applies UUID sanitization to a list of candidate values.
 *
 * @param uuids - Candidate UUID values
 * @param allowedVersions - Optional whitelist of UUID versions
 * @returns Per-item sanitization results in input order
 * @example
 * ```ts
 * const results = sanitizeUuidBatch(["550e8400-e29b-41d4-a716-446655440000"]);
 * // [{ isValid: true, ... }]
 * ```
 */
export function sanitizeUuidBatch(
	uuids: unknown[],
	allowedVersions?: UuidVersion[],
): UuidSanitizeResult[] {
	return uuids.map((uuid) => sanitizeUuid(uuid, allowedVersions));
}

/**
 * Type guard that checks whether a value is a valid UUID.
 *
 * @param value - Candidate runtime value
 * @param version - Optional required UUID version
 * @returns `true` when value is a valid UUID string
 * @example
 * ```ts
 * const isValid = isValidUuid("550e8400-e29b-41d4-a716-446655440000", 4);
 * // true
 * ```
 */
export function isValidUuid(
	value: unknown,
	version?: UuidVersion,
): value is string {
	if (typeof value !== "string") return false;

	const result = sanitizeUuid(value, version ? [version] : undefined);
	return result.isValid;
}
