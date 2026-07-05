type HeaderBag = Headers | Record<string, unknown>;

/**
 * readCompanyIdFromHeaders operation.
 *
 * @param headers - Input for headers.
 * @returns Result of readCompanyIdFromHeaders.
 * @example
 * ```ts
 * const result = readCompanyIdFromHeaders({} as HeaderBag);
 * console.log(result);
 * ```
 */
export function readCompanyIdFromHeaders(headers: HeaderBag): string | null {
	if (headers instanceof Headers) {
		const value = headers.get("x-company-id")?.trim();
		return value ? value : null;
	}

	const direct = headers["x-company-id"];
	if (typeof direct === "string" && direct.trim()) {
		return direct.trim();
	}

	const fallback = headers["X-Company-Id"];
	if (typeof fallback === "string" && fallback.trim()) {
		return fallback.trim();
	}

	return null;
}

/**
 * requireCompanyIdFromHeaders operation.
 *
 * @param headers - Input for headers.
 * @returns Result of requireCompanyIdFromHeaders.
 * @example
 * ```ts
 * const result = requireCompanyIdFromHeaders({} as HeaderBag);
 * console.log(result);
 * ```
 */
export function requireCompanyIdFromHeaders(headers: HeaderBag):
	| {
			ok: true;
			companyId: string;
	  }
	| {
			ok: false;
			error: string;
			code: string;
			status: 400;
	  } {
	const companyId = readCompanyIdFromHeaders(headers);
	if (!companyId) {
		return {
			ok: false,
			error: "X-Company-Id es requerido",
			code: "COMPANY_SCOPE_REQUIRED",
			status: 400,
		};
	}

	return {
		ok: true,
		companyId,
	};
}

/**
 * enforceCompanyScope operation.
 *
 * @param headers - Input for headers.
 * @param requestedCompanyId - Input for requestedCompanyId.
 * @returns Result of enforceCompanyScope.
 * @example
 * ```ts
 * const result = enforceCompanyScope({} as HeaderBag, "");
 * console.log(result);
 * ```
 */
export function enforceCompanyScope(
	headers: HeaderBag,
	requestedCompanyId: string,
):
	| {
			ok: true;
			companyId: string;
	  }
	| {
			ok: false;
			error: string;
			code: string;
			status: 400 | 403;
	  } {
	const headerScope = requireCompanyIdFromHeaders(headers);
	if (!headerScope.ok) {
		return headerScope;
	}

	if (headerScope.companyId !== requestedCompanyId) {
		return {
			ok: false,
			error: "Requested companyId does not match caller tenant scope",
			code: "TENANT_SCOPE_VIOLATION",
			status: 403,
		};
	}

	return headerScope;
}
