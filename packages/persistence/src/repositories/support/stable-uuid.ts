import { createHash } from "node:crypto";

const UUID_REGEX =
	/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * toStableUuid operation.
 *
 * @param value - Input for value.
 * @returns Result of toStableUuid.
 * @example
 * ```ts
 * const result = toStableUuid("");
 * console.log(result);
 * ```
 */
export const toStableUuid = (value: string): string => {
	if (UUID_REGEX.test(value)) {
		return value.toLowerCase();
	}

	const digest = createHash("sha1").update(value).digest();
	const bytes = Array.from(digest.subarray(0, 16));

	bytes[6] = (bytes[6]! & 0x0f) | 0x50;
	bytes[8] = (bytes[8]! & 0x3f) | 0x80;

	const hex = bytes.map((byte) => byte.toString(16).padStart(2, "0")).join("");

	return [
		hex.slice(0, 8),
		hex.slice(8, 12),
		hex.slice(12, 16),
		hex.slice(16, 20),
		hex.slice(20, 32),
	].join("-");
};
