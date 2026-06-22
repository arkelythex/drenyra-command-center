import type { Context } from "elysia";

/**
 * Header names safe to forward from the incoming HTTP request into an in-process
 * `auth.handler(Request)` call. We intentionally omit `host` so the synthetic
 * Request’s URL (`BETTER_AUTH_URL` / :3000) matches the Host implied by fetch,
 * and we avoid leaking hop-by-hop headers.
 */
const ALLOWED = new Set([
	"accept",
	"accept-language",
	"cookie",
	"origin",
	"referer",
	"user-agent",
	"x-forwarded-for",
	"x-forwarded-host",
	"x-forwarded-proto",
	"x-real-ip",
]);

function getHeaderValue(
	headers: Context["headers"],
	name: string,
): string | undefined {
	const direct = headers[name];
	if (typeof direct === "string" && direct.length > 0) return direct;
	const lower = name.toLowerCase();
	for (const [k, v] of Object.entries(headers)) {
		if (k.toLowerCase() === lower && typeof v === "string" && v.length > 0) {
			return v;
		}
	}
	return undefined;
}

/**
 * Builds a plain header map for subrequests to `auth.handler`, without copying `host`.
 * Prefer `request` when provided so `Cookie` is always taken from the raw fetch headers.
 */
export function pickHeadersForAuthSubrequest(
	incoming: Context["headers"],
	extra?: Record<string, string>,
	request?: Request,
): Record<string, string> {
	const out: Record<string, string> = { ...extra };
	for (const name of ALLOWED) {
		const fromReq = request?.headers.get(name);
		if (fromReq) {
			out[name] = fromReq;
			continue;
		}
		const value = getHeaderValue(incoming, name);
		if (value) out[name] = value;
	}
	return out;
}
