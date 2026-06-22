/**
 * resolveSireCompanyId operation.
 *
 * @param input - Input for input.
 * @returns Result of resolveSireCompanyId.
 * @example
 * ```ts
 * const result = resolveSireCompanyId({});
 * console.log(result);
 * ```
 */
export function resolveSireCompanyId(input: {
	body?: unknown;
	query?: unknown;
	request: Request;
}): string | null {
	const fromBody = readCompanyId(input.body);
	if (fromBody) return fromBody;

	const fromQuery = readCompanyId(input.query);
	if (fromQuery) return fromQuery;

	const headerCompanyId = input.request.headers.get("x-company-id");

	if (!headerCompanyId) {
		return null;
	}

	const normalized = headerCompanyId.trim();
	return normalized.length > 0 ? normalized : null;
}

function readCompanyId(source: unknown): string | null {
	if (!source || typeof source !== "object") {
		return null;
	}

	const candidate = Reflect.get(source, "companyId");
	if (typeof candidate !== "string") {
		return null;
	}

	const normalized = candidate.trim();
	return normalized.length > 0 ? normalized : null;
}
