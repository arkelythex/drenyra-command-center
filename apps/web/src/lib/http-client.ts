import { runtimeConfig } from "./runtime-config";

export class HttpClientError extends Error {
	readonly status?: number;
	readonly details?: unknown;
	readonly code: "network_error" | "http_error" | "parse_error" | "timeout";

	constructor(
		message: string,
		code: "network_error" | "http_error" | "parse_error" | "timeout",
		status?: number,
		details?: unknown,
	) {
		super(message);
		this.name = "HttpClientError";
		this.code = code;
		this.status = status;
		this.details = details;
	}
}

function readNumericStatus(value: unknown): number | undefined {
	return typeof value === "number" && Number.isFinite(value)
		? value
		: undefined;
}

export function getHttpStatusCode(error: unknown): number | undefined {
	if (error instanceof HttpClientError) {
		return readNumericStatus(error.status);
	}

	if (!error || typeof error !== "object") {
		return undefined;
	}

	const payload = error as {
		status?: unknown;
		response?: { status?: unknown };
		error?: { status?: unknown };
	};

	return (
		readNumericStatus(payload.status) ??
		readNumericStatus(payload.response?.status) ??
		readNumericStatus(payload.error?.status)
	);
}

export function buildApiUrl(path: string): string {
	if (path.startsWith("http://") || path.startsWith("https://")) {
		return path;
	}

	const useProxyBase = path.startsWith("/api") || path.startsWith("api/");
	const baseUrl = useProxyBase
		? runtimeConfig.apiUrl
		: runtimeConfig.directApiUrl;
	const normalizedPath = path.startsWith("/") ? path : `/${path}`;

	return `${baseUrl}${normalizedPath}`;
}

async function parseResponseBody(response: Response): Promise<unknown> {
	const contentType = response.headers.get("content-type") ?? "";
	const isJson = contentType.includes("application/json");

	if (isJson) {
		try {
			return await response.json();
		} catch {
			throw new HttpClientError(
				"Invalid JSON response",
				"parse_error",
				response.status,
			);
		}
	}

	try {
		const text = await response.text();
		return text.length ? text : null;
	} catch {
		return null;
	}
}

export async function requestJson<T>(
	path: string,
	init: RequestInit = {},
): Promise<T> {
	const controller = new AbortController();
	const timeoutMs = runtimeConfig.requestTimeoutMs;
	const timeout = setTimeout(() => controller.abort(), timeoutMs);

	const mergedHeaders = new Headers(init.headers);
	if (!mergedHeaders.has("Accept")) {
		mergedHeaders.set("Accept", "application/json");
	}

	try {
		const response = await fetch(buildApiUrl(path), {
			...init,
			credentials: init.credentials ?? "include",
			headers: mergedHeaders,
			signal: init.signal ?? controller.signal,
		});

		const body = await parseResponseBody(response);

		if (!response.ok) {
			const message =
				body &&
				typeof body === "object" &&
				"message" in body &&
				typeof (body as { message?: unknown }).message === "string"
					? (body as { message: string }).message
					: `HTTP ${response.status}`;
			throw new HttpClientError(message, "http_error", response.status, body);
		}

		return body as T;
	} catch (error) {
		if (error instanceof HttpClientError) {
			throw error;
		}

		if (error instanceof DOMException && error.name === "AbortError") {
			throw new HttpClientError(
				`Request timeout after ${timeoutMs}ms`,
				"timeout",
			);
		}

		const message = error instanceof Error ? error.message : "Network error";
		throw new HttpClientError(message, "network_error");
	} finally {
		clearTimeout(timeout);
	}
}
