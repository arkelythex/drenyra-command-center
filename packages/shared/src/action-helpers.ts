import { ZodError } from "zod";
import { DomainError } from "./errors";

/**
 * Standard action response envelope for UI/server actions.
 *
 * @example
 * ```ts
 * const ok: ActionResponse<string> = { success: true, data: "done" };
 * const fail: ActionResponse = { success: false, error: "Bad request", code: "VALIDATION_ERROR" };
 * ```
 * @typeParam T - Generic type parameter for ActionResponse.
 */

export type ActionResponse<T = unknown> =
	| { success: true; data: T }
	| { success: false; error: string; code?: string };

/**
 * Converts unknown exceptions into a safe, user-facing `ActionResponse`.
 *
 * @param error - Any thrown value
 * @returns Normalized response (DomainError / ZodError / Error / fallback)
 *
 * @example
 * ```ts
 * try {
 *   // ...
 * } catch (e) {
 *   return handleActionError(e);
 * }
 * ```
 */
export function handleActionError(error: unknown): ActionResponse {
	if (error instanceof DomainError) {
		return {
			success: false,
			error: error.message,
			code: error.code,
		};
	}

	if (error instanceof ZodError) {
		return {
			success: false,
			error: error.issues
				.map((e) => `${e.path.join(".")}: ${e.message}`)
				.join(", "),
			code: "VALIDATION_ERROR",
		};
	}

	if (error instanceof Error) {
		return {
			success: false,
			error: error.message,
		};
	}

	return {
		success: false,
		error: "Error desconocido",
	};
}

/**
 * Maps a MIME type into the supported document types.
 *
 * @param mimeType - MIME type (e.g. `application/pdf`)
 * @returns Document type
 *
 * @example
 * ```ts
 * getDocumentType("application/pdf"); // "PDF"
 * ```
 */
export function getDocumentType(mimeType: string): "IMAGE" | "XML" | "PDF" {
	if (mimeType.startsWith("image/")) return "IMAGE";
	if (mimeType === "application/xml" || mimeType === "text/xml") return "XML";
	if (mimeType === "application/pdf") return "PDF";
	return "IMAGE";
}
