import { createHash } from "node:crypto";

const FALLBACK_FINGERPRINT = "unavailable";

export function fingerprintSensitiveValue(
	value: string | null | undefined,
): string {
	if (!value?.trim()) {
		return FALLBACK_FINGERPRINT;
	}

	return createHash("sha256").update(value.trim()).digest("hex").slice(0, 16);
}

export function resolveClientIpAddress(
	requestHeaders: Headers,
	fallbackHeaders?: Record<string, string | undefined>,
): string {
	const fromRequest =
		requestHeaders.get("x-forwarded-for") ?? requestHeaders.get("x-real-ip");

	if (fromRequest?.trim()) {
		return fromRequest.split(",")[0]?.trim() ?? "unknown";
	}

	const fallback =
		fallbackHeaders?.["x-forwarded-for"] ??
		fallbackHeaders?.["x-real-ip"] ??
		"unknown";

	return fallback.split(",")[0]?.trim() || "unknown";
}
