/**
 * readHeader operation.
 *
 * @param headers - Input for headers.
 * @param key - Input for key.
 * @returns Result of readHeader.
 * @example
 * ```ts
 * const result = readHeader({} as Record, "");
 * console.log(result);
 * ```
 */
export function readHeader(
	headers: Record<string, unknown>,
	key: string,
): string {
	const direct = headers[key];
	if (typeof direct === "string" && direct.trim()) return direct.trim();

	const lower = headers[key.toLowerCase()];
	if (typeof lower === "string" && lower.trim()) return lower.trim();

	return "";
}
