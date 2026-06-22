/**
 * Deterministic JSON serialization.
 *
 * Produces a stable string representation of arbitrary JSON data by
 * sorting object keys alphabetically and handling edge cases (null,
 * undefined) explicitly. Two calls with the same logical data always
 * return the same string.
 *
 * This is a PURE function — no side effects, no dependencies.
 *
 * @example
 * ```ts
 * normalizeJson({ b: 2, a: 1 })        // '{"a":1,"b":2}'
 * normalizeJson([3, { y: 1, x: 2 }])   // '[3,{"x":2,"y":1}]'
 * normalizeJson(null)                   // 'null'
 * normalizeJson(undefined)              // 'null'
 * ```
 */
export function normalizeJson(data: unknown): string {
	if (data === null || data === undefined) return "null";
	if (typeof data !== "object") return JSON.stringify(data);

	if (Array.isArray(data)) {
		return `[${data.map((item) => normalizeJson(item)).join(",")}]`;
	}

	const sorted = Object.keys(data as Record<string, unknown>)
		.sort()
		.reduce<Record<string, unknown>>(
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
