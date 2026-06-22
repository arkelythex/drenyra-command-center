import { getGovernanceAuditHeaders, getTenantHeaders } from "@/lib/api";
import { ApiError } from "@/lib/api-helpers";
import type { BinaryFilePayload, InvoiceOseLifecycle } from "./types";

const CONTENT_DISPOSITION_FILENAME_UTF8 = /filename\*=UTF-8''([^;]+)/i;
const CONTENT_DISPOSITION_FILENAME = /filename="?([^";]+)"?/i;

export function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null;
}

export function toOptionalString(value: unknown): string | undefined {
	if (typeof value !== "string") {
		return undefined;
	}

	const normalized = value.trim();
	return normalized.length > 0 ? normalized : undefined;
}

export function resolveApiUrl(path: string): string {
	return path;
}

export function resolveFilename(
	contentDisposition: string | null,
	fallbackFilename: string,
): string {
	if (!contentDisposition) {
		return fallbackFilename;
	}

	const utf8Match = contentDisposition.match(CONTENT_DISPOSITION_FILENAME_UTF8);
	if (utf8Match?.[1]) {
		try {
			return decodeURIComponent(utf8Match[1]);
		} catch {
			return utf8Match[1];
		}
	}

	const filenameMatch = contentDisposition.match(CONTENT_DISPOSITION_FILENAME);
	if (filenameMatch?.[1]) {
		return filenameMatch[1];
	}

	return fallbackFilename;
}

export async function extractResponseErrorMessage(
	response: Response,
): Promise<string | undefined> {
	const contentType = response.headers.get("Content-Type") ?? "";

	try {
		if (contentType.includes("application/json")) {
			const payload: unknown = await response.json();
			if (isRecord(payload)) {
				return (
					toOptionalString(payload.error) ??
					toOptionalString(payload.message) ??
					toOptionalString(payload.code)
				);
			}
		}

		const text = await response.text();
		return toOptionalString(text);
	} catch {
		return undefined;
	}
}

export function isInvoiceOseLifecycle(
	value: unknown,
): value is InvoiceOseLifecycle {
	if (!isRecord(value)) {
		return false;
	}

	return (
		typeof value.transactionId === "string" &&
		typeof value.invoiceNumber === "string" &&
		typeof value.currentStatus === "string"
	);
}

export function normalizeInvoicingError(
	error: unknown,
	fallbackMessage: string,
): Error {
	if (error instanceof Error) {
		return error;
	}

	const rawMessage = toOptionalString(error);
	if (rawMessage) {
		return new Error(rawMessage);
	}

	return new Error(fallbackMessage);
}

export function downloadBlobFile(blob: Blob, filename: string): void {
	const url = URL.createObjectURL(blob);
	const link = document.createElement("a");
	link.href = url;
	link.download = filename;
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
	URL.revokeObjectURL(url);
}

export async function requestBinaryFile(
	path: string,
	fallbackFilename: string,
	fallbackErrorMessage: string,
): Promise<BinaryFilePayload> {
	try {
		const response = await fetch(resolveApiUrl(path), {
			method: "GET",
			credentials: "include",
			headers: {
				...getTenantHeaders(),
				...getGovernanceAuditHeaders(),
			},
		});

		if (!response.ok) {
			const message = await extractResponseErrorMessage(response);
			throw new ApiError(
				message ?? `${fallbackErrorMessage} (${response.status})`,
				response.status.toString(),
			);
		}

		const blob = await response.blob();
		const filename = resolveFilename(
			response.headers.get("Content-Disposition"),
			fallbackFilename,
		);

		return { blob, filename };
	} catch (error: unknown) {
		throw normalizeInvoicingError(error, fallbackErrorMessage);
	}
}

/**
 * Helper: Convert number to decimal string
 */
export function toNumericString(value: string | number): string {
	if (typeof value === "number") {
		return Number.isFinite(value) ? value.toString() : "0";
	}
	const normalized = value.trim();
	return normalized.length > 0 ? normalized : "0";
}
