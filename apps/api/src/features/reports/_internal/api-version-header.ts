/**
 * API Version Header
 *
 * Adds X-API-Version header to all v1 responses.
 */

import { Elysia } from "elysia";

/**
 * Elysia plugin that injects `X-API-Version: 1` into every response.
 */
export const injectVersionHeader = new Elysia()
	.onAfterHandle({ as: "global" }, ({ set }) => {
		set.headers ??= {};
		(set.headers as Record<string, string>)["X-API-Version"] = "1";
	});
