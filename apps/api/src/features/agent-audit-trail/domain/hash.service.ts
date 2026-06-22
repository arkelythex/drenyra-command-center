/**
 * Hash Service
 * SHA-256 computation using Web Crypto API
 * @example
 * ```ts
 * const value: HashableData = {} as HashableData;
 * console.log(value);
 * ```
 */

export interface HashableData {
	id: string;
	createdAt: Date;
	inputs: unknown;
	outputs: unknown;
	prevHash: string | null;
}

/**
 * computeHash operation.
 *
 * @param data - Input for data.
 * @returns Result of computeHash.
 * @example
 * ```ts
 * const result = await computeHash({} as HashableData);
 * console.log(result);
 * ```
 */
export async function computeHash(data: HashableData): Promise<string> {
	const payload = [
		data.id,
		data.createdAt.toISOString(),
		normalizeJson(data.inputs),
		normalizeJson(data.outputs),
		data.prevHash ?? "GENESIS",
	].join("|");

	const encoder = new TextEncoder();
	const dataBuffer = encoder.encode(payload);
	const hashBuffer = await crypto.subtle.digest("SHA-256", dataBuffer);

	const hashArray = Array.from(new Uint8Array(hashBuffer));
	return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * verifyHash operation.
 *
 * @param data - Input for data.
 * @param storedHash - Input for storedHash.
 * @returns Result of verifyHash.
 * @example
 * ```ts
 * const result = await verifyHash({} as HashableData, "");
 * console.log(result);
 * ```
 */
export async function verifyHash(
	data: HashableData,
	storedHash: string,
): Promise<boolean> {
	const expectedHash = await computeHash(data);
	return expectedHash === storedHash;
}

function normalizeJson(data: unknown): string {
	if (data === null || data === undefined) return "null";
	if (typeof data !== "object") return JSON.stringify(data);
	if (Array.isArray(data))
		return `[${data.map((item) => normalizeJson(item)).join(",")}]`;

	const sorted = Object.keys(data)
		.sort()
		.reduce(
			(acc, key) => {
				acc[key] = (data as Record<string, unknown>)[key];
				return acc;
			},
			{} as Record<string, unknown>,
		);

	const pairs = Object.entries(sorted).map(
		([k, v]) => `"${k}":${normalizeJson(v)}`,
	);
	return `{${pairs.join(",")}}`;
}
