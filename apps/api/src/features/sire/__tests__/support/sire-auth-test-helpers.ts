import { createHmac } from "node:crypto";

function encodeBase64Url(value: string): string {
	return Buffer.from(value, "utf8")
		.toString("base64")
		.replace(/\+/g, "-")
		.replace(/\//g, "_")
		.replace(/=+$/g, "");
}

export function createSireTestJwt(companyId: string, secret: string): string {
	return createSireTestJwtWithClaims(
		{
			sub: "test-user",
			companyId,
			exp: Math.floor(Date.now() / 1000) + 60 * 60,
		},
		secret,
	);
}

export function createSireTestJwtWithClaims(
	claims: Record<string, unknown>,
	secret: string,
): string {
	const header = encodeBase64Url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
	const payload = encodeBase64Url(JSON.stringify(claims));
	const signature = createHmac("sha256", secret)
		.update(`${header}.${payload}`)
		.digest("base64")
		.replace(/\+/g, "-")
		.replace(/\//g, "_")
		.replace(/=+$/g, "");

	return `${header}.${payload}.${signature}`;
}

export function createSireAuthHeaders(
	companyId: string,
	secret: string,
	headers: HeadersInit = {},
): Headers {
	const resolvedHeaders = new Headers(headers);
	resolvedHeaders.set(
		"Authorization",
		`Bearer ${createSireTestJwt(companyId, secret)}`,
	);
	resolvedHeaders.set("X-Company-Id", companyId);

	return resolvedHeaders;
}
