import { Elysia } from "elysia";
import { describe, expect, it } from "vitest";
import { getApiRootMetadata } from "../api-root-metadata";
import {
	CANONICAL_SWAGGER_JSON_PATH,
	CANONICAL_SWAGGER_PATH,
	registerLegacySwaggerRedirects,
} from "../swagger-docs-routes";

describe("swagger docs routes", () => {
	it("advertises the canonical Swagger URL in API root metadata", () => {
		expect(getApiRootMetadata().docs).toBe(CANONICAL_SWAGGER_PATH);
	});

	it("redirects legacy docs URLs to canonical /api/swagger URLs", async () => {
		const app = new Elysia();
		registerLegacySwaggerRedirects(app);

		const swaggerResponse = await app.handle(
			new Request("http://localhost/swagger", { redirect: "manual" }),
		);
		const swaggerJsonResponse = await app.handle(
			new Request("http://localhost/swagger/json", { redirect: "manual" }),
		);

		expect(CANONICAL_SWAGGER_PATH).toBe("/api/swagger");
		expect(CANONICAL_SWAGGER_JSON_PATH).toBe("/api/swagger/json");
		expect(swaggerResponse.status).toBe(308);
		expect(swaggerResponse.headers.get("Location")).toBe(CANONICAL_SWAGGER_PATH);
		expect(swaggerJsonResponse.status).toBe(308);
		expect(swaggerJsonResponse.headers.get("Location")).toBe(
			CANONICAL_SWAGGER_JSON_PATH,
		);
	});
});
