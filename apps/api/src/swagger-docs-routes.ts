import type { Elysia } from "elysia";

export const CANONICAL_SWAGGER_PATH = "/api/swagger";
export const CANONICAL_SWAGGER_JSON_PATH = "/api/swagger/json";
export const LEGACY_SWAGGER_PATH = "/swagger";
export const LEGACY_SWAGGER_JSON_PATH = "/swagger/json";

export function registerLegacySwaggerRedirects(app: unknown): void {
	const docsApp = app as Elysia;
	docsApp.get(LEGACY_SWAGGER_PATH, () => redirectTo(CANONICAL_SWAGGER_PATH));
	docsApp.get(LEGACY_SWAGGER_JSON_PATH, () =>
		redirectTo(CANONICAL_SWAGGER_JSON_PATH),
	);
}

function redirectTo(location: string): Response {
	return new Response(null, {
		status: 308,
		headers: {
			Location: location,
		},
	});
}
