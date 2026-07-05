/**
 * Type-safe helpers for Eden Treaty + ok()/fail() discriminated unions
 *
 * Leverages the 82.9% API Pattern Adoption from backend to provide
 * full type inference and error handling in the frontend.
 *
 * @module api-helpers
 */

interface ApiRunbook {
	path: string;
	anchor?: string;
}

interface ApiFailureValue {
	error?: string;
	code?: string;
	runbook?: ApiRunbook;
}

interface TreatyErrorEnvelope {
	value?: ApiFailureValue;
}

export interface TreatyResponse<TData> {
	data?: TData;
	error?: TreatyErrorEnvelope | string | null;
}

/** Eden Treaty may return a stricter `{ data, error }` shape; unwrap accepts it at the boundary. */
export type TreatyUnwrapInput<TData> = {
	data?: TData;
	error?: unknown;
};

/**
 * Error thrown when API returns fail() response
 */
export class ApiError extends Error {
	constructor(
		message: string,
		public readonly code?: string,
		public readonly runbook?: ApiRunbook,
	) {
		super(message);
		this.name = "ApiError";
	}
}

/**
 * Type guard to check if response is success
 */
export function isSuccess<T>(
	response:
		| { success: true; data: T }
		| { success: false; error: string; code?: string },
): response is { success: true; data: T } {
	return response.success === true;
}

/**
 * Type guard to check if response is failure
 */
export function isFailure(
	response:
		| { success: true; data: unknown }
		| { success: false; error: string; code?: string },
): response is { success: false; error: string; code?: string } {
	return response.success === false;
}

/**
 * Unwraps ok() response or throws ApiError on fail()
 *
 * @example
 * ```ts
 * const customer = await unwrap(api.customers.index.post(payload));
 * // customer is fully typed, no need for assertions
 * ```
 */
export async function unwrap<TData>(
	promise: Promise<TreatyResponse<TData> | TreatyUnwrapInput<TData>>,
): Promise<TData> {
	const response = await promise;

	// Eden Treaty returns { data, error } structure
	if ("error" in response && response.error) {
		const err = response.error;

		if (typeof err === "string") {
			throw new ApiError(err);
		}

		if (typeof err === "object" && err !== null && "value" in err) {
			const rawValue = (err as { value?: unknown }).value;
			if (rawValue && typeof rawValue === "object" && rawValue !== null) {
				const fv = rawValue as ApiFailureValue;
				if (typeof fv.error === "string" || typeof fv.code === "string") {
					throw new ApiError(fv.error || "Request failed", fv.code, fv.runbook);
				}
			}
			if (typeof rawValue === "string") {
				throw new ApiError(rawValue);
			}
		}

		throw new ApiError("Request failed");
	}

	if ("data" in response && response.data !== undefined) {
		return response.data as TData;
	}

	throw new ApiError("Invalid response structure");
}

/**
 * Second hop after {@link unwrap}: the Treaty `data` is often the API JSON body
 * shaped as `ok(data)` / `fail(...)` (`{ success, data?, error? }`).
 */
export function extractOkData<T>(
	envelope: unknown,
	fallbackMessage: string,
): T {
	if (envelope == null) {
		throw new ApiError(fallbackMessage);
	}
	if (typeof envelope !== "object") {
		throw new ApiError(fallbackMessage);
	}
	if (!("success" in envelope) || envelope.success !== true) {
		const failed = envelope as {
			error?: string;
			message?: string;
			code?: string;
		};
		const msg =
			typeof failed.error === "string"
				? failed.error
				: typeof failed.message === "string"
					? failed.message
					: fallbackMessage;
		throw new ApiError(msg, failed.code);
	}
	return (envelope as unknown as { data: T }).data;
}

/**
 * Like {@link extractOkData} but allows payloads that omit the `ok()` envelope
 * (raw `T` when the route returns an unwrapped body).
 */
export function extractOkDataOrPassthrough<T>(
	payload: unknown,
	fallbackMessage: string,
): T {
	if (payload == null) {
		throw new ApiError(fallbackMessage);
	}
	if (typeof payload !== "object" || !("success" in payload)) {
		return payload as T;
	}
	return extractOkData(
		payload as
			| { success: true; data: T }
			| { success: false; error?: string; message?: string; code?: string },
		fallbackMessage,
	);
}

/**
 * Handles ok()/fail() discriminated union safely
 *
 * @example
 * ```ts
 * const result = await handleApiCall(
 *   api.customers.index.get(),
 *   (data) => data, // success handler
 *   (error, code) => { // failure handler
 *     console.error(`Error ${code}: ${error}`);
 *     return [];
 *   }
 * );
 * ```
 */
export async function handleApiCall<T, R>(
	promise: Promise<TreatyResponse<T> | TreatyUnwrapInput<T>>,
	onSuccess: (data: T) => R,
	onFailure: (error: string, code?: string) => R,
): Promise<R> {
	try {
		const data = await unwrap(promise);
		return onSuccess(data as T);
	} catch (error) {
		if (error instanceof ApiError) {
			return onFailure(error.message, error.code);
		}
		return onFailure(error instanceof Error ? error.message : "Unknown error");
	}
}

/**
 * Type helper to extract data type from Eden Treaty endpoint
 *
 * @example
 * ```ts
 * type CustomerData = ExtractData<typeof api.customers.index.get>;
 * ```
 */
export type ExtractData<T> = T extends (
	...args: unknown[]
) => Promise<{ data: infer D }>
	? D
	: never;
