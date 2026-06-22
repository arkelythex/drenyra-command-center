/**
 * SPOT_DETRACTION_PROFILES const.
 *
 * @example
 * ```ts
 * console.log(SPOT_DETRACTION_PROFILES);
 * ```
 */
export const SPOT_DETRACTION_PROFILES = [
	"SERVICES",
	"TRANSPORT",
	"CONSTRUCTION",
	"GENERIC",
] as const;

/**
 * SpotDetractionProfile type.
 *
 * @example
 * ```ts
 * const value: SpotDetractionProfile = {} as SpotDetractionProfile;
 * console.log(value);
 * ```
 */
export type SpotDetractionProfile = (typeof SPOT_DETRACTION_PROFILES)[number];

/**
 * normalizeSpotDetractionProfile operation.
 *
 * @param value - Input for value.
 * @returns Result of normalizeSpotDetractionProfile.
 * @example
 * ```ts
 * const result = normalizeSpotDetractionProfile("");
 * console.log(result);
 * ```
 */
export function normalizeSpotDetractionProfile(
	value?: string | null,
): SpotDetractionProfile {
	if (!value) return "SERVICES";
	const normalized = value.toUpperCase();
	if (
		normalized === "SERVICES" ||
		normalized === "TRANSPORT" ||
		normalized === "CONSTRUCTION" ||
		normalized === "GENERIC"
	) {
		return normalized;
	}
	return "SERVICES";
}
