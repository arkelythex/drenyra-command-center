import { describe, expect, it, mock } from "bun:test";
import { SunatApiClient } from "../SunatApiClient";

function setupEnv() {
	process.env.SUNAT_CLIENT_ID = "test-client-id";
	process.env.SUNAT_CLIENT_SECRET = "test-client-secret";
}

function teardownEnv() {
	delete process.env.SUNAT_CLIENT_ID;
	delete process.env.SUNAT_CLIENT_SECRET;
}

function setupFetchMock(
	handler: (url: string, _options?: RequestInit) => Promise<Response>,
) {
	const fn = mock(handler);
	// @ts-expect-error
	globalThis.fetch = fn;
	return fn;
}

describe("SunatApiClient", () => {
	describe("initialize", () => {
		it("returns false when credentials are missing", async () => {
			const client = new SunatApiClient(1);
			const result = await client.initialize();
			expect(result).toBe(false);
		});

		it("returns true when credentials are present", async () => {
			setupEnv();
			const client = new SunatApiClient(1);
			const result = await client.initialize();
			expect(result).toBe(true);
		});
	});

	describe("getAccessToken", () => {
		it("throws when client is not initialized", async () => {
			const client = new SunatApiClient(1);
			expect(client.getAccessToken()).rejects.toThrow("not initialized");
		});

		it("fetches a new token on cache miss", async () => {
			setupEnv();
			setupFetchMock(async (url: string) => {
				if (url.includes("token")) {
					return new Response(
						JSON.stringify({
							access_token: "test-token-123",
							token_type: "Bearer",
							expires_in: 3600,
						}),
						{ status: 200 },
					);
				}
				return new Response("Not found", { status: 404 });
			});

			const client = new SunatApiClient(1);
			await client.initialize();
			const token = await client.getAccessToken();
			expect(token).toBe("test-token-123");
		});
	});

	describe("consultarRuc", () => {
		it("builds correct URL and returns data", async () => {
			setupEnv();
			setupFetchMock(async (url: string) => {
				if (url.includes("token")) {
					return new Response(
						JSON.stringify({
							access_token: "t",
							token_type: "Bearer",
							expires_in: 3600,
						}),
						{ status: 200 },
					);
				}
				if (url.includes("contribuyente")) {
					return new Response(
						JSON.stringify({
							ruc: "20123456789",
							razonSocial: "TEST SAC",
							estado: "ACTIVO",
							condicion: "HABIDO",
						}),
						{ status: 200 },
					);
				}
				return new Response("Not found", { status: 404 });
			});

			const client = new SunatApiClient(1);
			await client.initialize();
			const result = await client.consultarRuc("20123456789");

			expect(result.success).toBe(true);
			if (result.success && result.data) {
				expect(result.data.ruc).toBe("20123456789");
				expect(result.data.razonSocial).toBe("TEST SAC");
				expect(result.data.estado).toBe("ACTIVO");
			}
		});
	});

	describe("error handling", () => {
		it("returns error response on API failure", async () => {
			setupEnv();
			setupFetchMock(async (url: string) => {
				if (url.includes("token")) {
					return new Response(
						JSON.stringify({
							access_token: "t",
							token_type: "Bearer",
							expires_in: 3600,
						}),
						{ status: 200 },
					);
				}
				return new Response("Bad Request", { status: 400 });
			});

			const client = new SunatApiClient(1);
			await client.initialize();
			const result = await client.consultarRuc("00000000000");

			expect(result.success).toBe(false);
			expect(result.error?.code).toBe("400");
		});

		it("handles network errors gracefully", async () => {
			setupEnv();
			setupFetchMock(async (_url: string) => {
				throw new Error("connect ECONNREFUSED");
			});

			const client = new SunatApiClient(1);
			await client.initialize();
			const result = await client.consultarRuc("20123456789");

			expect(result.success).toBe(false);
			expect(result.error?.code).toBe("REQUEST_FAILED");
		});
	});
});
