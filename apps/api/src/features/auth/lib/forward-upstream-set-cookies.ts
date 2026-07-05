import type { Context } from "elysia";

/**
 * Reads all `Set-Cookie` values from Fetch `Headers`.
 * Uses `getSetCookie()` when available so multiple cookies are not dropped
 * (`Headers#get("set-cookie")` is not reliable for multiple values in undici/Node).
 */
export function getSetCookieValues(headers: Headers): string[] {
	if (typeof headers.getSetCookie === "function") {
		return headers.getSetCookie();
	}
	const raw = headers.get("set-cookie");
	return raw ? [raw] : [];
}

/**
 * Copies upstream `Set-Cookie` header(s) onto Elysia `set.headers`.
 * Elysia accepts one string or `string[]`; arrays are normalized in `handleSet`.
 */
export function forwardSetCookiesFromHeaders(
	upstream: Headers,
	set: Context["set"],
): void {
	const cookies = getSetCookieValues(upstream);
	if (cookies.length === 0) return;
	set.headers["set-cookie"] = cookies.length === 1 ? cookies[0] : cookies;
}
