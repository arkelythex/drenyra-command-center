import { afterEach, describe, expect, it, vi } from "vitest";
import {
	clearOAuthTokenCache,
	resolveAuthToken,
} from "../../services/sire-oauth.service";
import type { SireSubmissionConfig, TenantSunatContext } from "../../types";

const ORIGINAL_FETCH = globalThis.fetch;

const createConfig = (): SireSubmissionConfig => ({
	mode: "api",
	baseUrl: "https://api.sunat.gob.pe",
	salesSubmissionPath: "/sales",
	purchasesSubmissionPath: "/purchases",
	apiToken: "",
	authMode: "oauth-sol",
	uploadMode: "json-base64",
	uploadFieldName: "archivo",
	allowSimulationFallbackInApiMode: false,
	timeoutMs: 15_000,
	companyRuc: "20999999999",
	deprecatedCompanyRuc: "20999999999",
	oauth: {
		baseUrl: "https://api-seguridad.sunat.gob.pe",
		tokenPathTemplate: "/v1/clientessol/{clientId}/oauth2/token/",
		scope: "https://api-sire.sunat.gob.pe",
		clientId: "client-1",
		clientSecret: "secret-1",
		solUsername: "MODDATOS",
		solPassword: "sol-pass",
	},
});

const createContext = (
	ruc: string,
	fingerprint: string,
): TenantSunatContext => ({
	companyId: `company-${ruc}`,
	ruc,
	credential: {
		clientId: "client-1",
		fingerprint,
		ruc,
		scope: "sire.submit",
	},
});

describe("SIRE OAuth tenant context", () => {
	afterEach(() => {
		vi.restoreAllMocks();
		globalThis.fetch = ORIGINAL_FETCH;
		clearOAuthTokenCache();
	});

	it("builds SOL username from tenant RUC and isolates token cache by credential identity", async () => {
		const requests: URLSearchParams[] = [];
		const fetchMock = vi.fn(
			async (_input: RequestInfo | URL, init?: RequestInit) => {
				requests.push(init?.body as URLSearchParams);
				return new Response(
					JSON.stringify({
						access_token: `token-${requests.length}`,
						expires_in: 3600,
					}),
					{ status: 200, headers: { "content-type": "application/json" } },
				);
			},
		);
		globalThis.fetch = fetchMock as typeof fetch;

		const config = createConfig();
		const firstContext = createContext("20123456786", "sha256:first");
		const secondContext = createContext("20492928373", "sha256:second");

		await expect(resolveAuthToken(config, firstContext)).resolves.toBe(
			"token-1",
		);
		await expect(resolveAuthToken(config, firstContext)).resolves.toBe(
			"token-1",
		);
		await expect(resolveAuthToken(config, secondContext)).resolves.toBe(
			"token-2",
		);

		expect(fetchMock).toHaveBeenCalledTimes(2);
		expect(requests.map((body) => body.get("username"))).toEqual([
			"20123456786MODDATOS",
			"20492928373MODDATOS",
		]);
		const submittedOAuthFields = requests.map((body) =>
			Object.fromEntries(body.entries()),
		);
		expect(submittedOAuthFields).toEqual(
			expect.arrayContaining([
				expect.objectContaining({ client_secret: "secret-1" }),
			]),
		);
		expect(fetchMock).not.toHaveBeenCalledWith(
			expect.anything(),
			expect.objectContaining({
				headers: expect.objectContaining({ "X-Cache-Key": expect.any(String) }),
			}),
		);
	});
});
