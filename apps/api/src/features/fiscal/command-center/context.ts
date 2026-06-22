import { type ApiFailure, fail } from "../../shared/api-response";
import type { FiscalCommandCenterContext } from "./types";

interface ContextSuccess {
	ok: true;
	context: FiscalCommandCenterContext;
}

interface ContextFailure {
	ok: false;
	error: ApiFailure;
}

/**
 * ContextResolution type.
 *
 * @example
 * ```ts
 * const value: ContextResolution = {} as ContextResolution;
 * console.log(value);
 * ```
 */
export type ContextResolution = ContextSuccess | ContextFailure;

type HeaderBag = Record<string, string | undefined>;

const RUC_PATTERN = /^\d{11}$/;
const PERIOD_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/;

function readHeader(headers: HeaderBag, name: string): string | undefined {
	const value = headers[name] ?? headers[name.toLowerCase()];
	return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function requiredHeader(headers: HeaderBag, name: string): string | ApiFailure {
	const value = readHeader(headers, name);
	if (!value) {
		return fail(`Missing required header: ${name}`, "MISSING_FISCAL_CONTEXT", {
			field: name,
		});
	}
	return value;
}

/**
 * resolveFiscalCmdContext operation.
 *
 * @param headers - Input for headers.
 * @returns Result of resolveFiscalCmdContext.
 * @example
 * ```ts
 * const result = resolveFiscalCmdContext({} as HeaderBag);
 * console.log(result);
 * ```
 */
export function resolveFiscalCmdContext(headers: HeaderBag): ContextResolution {
	const organizationId = requiredHeader(headers, "x-organization-id");
	if (typeof organizationId !== "string")
		return { ok: false, error: organizationId };

	const companyId = requiredHeader(headers, "x-company-id");
	if (typeof companyId !== "string") return { ok: false, error: companyId };

	const companyRuc = requiredHeader(headers, "x-company-ruc");
	if (typeof companyRuc !== "string") return { ok: false, error: companyRuc };
	if (!RUC_PATTERN.test(companyRuc)) {
		return {
			ok: false,
			error: fail("Invalid company RUC", "INVALID_RUC", {
				field: "x-company-ruc",
			}),
		};
	}

	const period = requiredHeader(headers, "x-fiscal-period");
	if (typeof period !== "string") return { ok: false, error: period };
	if (!PERIOD_PATTERN.test(period)) {
		return {
			ok: false,
			error: fail("Invalid fiscal period", "INVALID_PERIOD", {
				field: "x-fiscal-period",
			}),
		};
	}

	const userId = requiredHeader(headers, "x-user-id");
	if (typeof userId !== "string") return { ok: false, error: userId };

	return {
		ok: true,
		context: {
			organizationId,
			companyId,
			companyRuc,
			period,
			userId,
		},
	};
}
