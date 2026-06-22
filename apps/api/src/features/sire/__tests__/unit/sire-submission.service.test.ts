import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
	SireSubmissionService,
	type SubmitSireInput,
} from "../../sire-submission.service";
import type { TenantSunatContext } from "../../types";

const ORIGINAL_ENV = {
	SIRE_SUBMISSION_MODE: process.env.SIRE_SUBMISSION_MODE,
	SIRE_API_BASE_URL: process.env.SIRE_API_BASE_URL,
	SIRE_API_SUBMISSION_PATH: process.env.SIRE_API_SUBMISSION_PATH,
	SIRE_API_SALES_SUBMISSION_PATH: process.env.SIRE_API_SALES_SUBMISSION_PATH,
	SIRE_API_PURCHASES_SUBMISSION_PATH:
		process.env.SIRE_API_PURCHASES_SUBMISSION_PATH,
	SIRE_API_TOKEN: process.env.SIRE_API_TOKEN,
	SIRE_AUTH_MODE: process.env.SIRE_AUTH_MODE,
	SIRE_API_UPLOAD_MODE: process.env.SIRE_API_UPLOAD_MODE,
	SIRE_ALLOW_API_SIMULATION_FALLBACK:
		process.env.SIRE_ALLOW_API_SIMULATION_FALLBACK,
	SIRE_API_TIMEOUT_MS: process.env.SIRE_API_TIMEOUT_MS,
	COMPANY_RUC: process.env.COMPANY_RUC,
	SUNAT_OAUTH_BASE_URL: process.env.SUNAT_OAUTH_BASE_URL,
	SUNAT_OAUTH_TOKEN_PATH_TEMPLATE: process.env.SUNAT_OAUTH_TOKEN_PATH_TEMPLATE,
	SUNAT_OAUTH_SCOPE: process.env.SUNAT_OAUTH_SCOPE,
	SUNAT_CLIENT_ID: process.env.SUNAT_CLIENT_ID,
	SUNAT_CLIENT_SECRET: process.env.SUNAT_CLIENT_SECRET,
	SUNAT_SOL_USERNAME: process.env.SUNAT_SOL_USERNAME,
	SUNAT_SOL_PASSWORD: process.env.SUNAT_SOL_PASSWORD,
	SIRE_POLICY_REFERENCE_DATE: process.env.SIRE_POLICY_REFERENCE_DATE,
	SIRE_2026_POSTPONED_UNTIL: process.env.SIRE_2026_POSTPONED_UNTIL,
	SIRE_2026_PRICO_INCOME_THRESHOLD_PEN:
		process.env.SIRE_2026_PRICO_INCOME_THRESHOLD_PEN,
};

const ORIGINAL_FETCH = globalThis.fetch;

function resetEnv(): void {
	const setEnv = (key: string, value: string | undefined): void => {
		if (value === undefined) {
			delete process.env[key];
			return;
		}
		process.env[key] = value;
	};

	setEnv("SIRE_SUBMISSION_MODE", ORIGINAL_ENV.SIRE_SUBMISSION_MODE);
	setEnv("SIRE_API_BASE_URL", ORIGINAL_ENV.SIRE_API_BASE_URL);
	setEnv("SIRE_API_SUBMISSION_PATH", ORIGINAL_ENV.SIRE_API_SUBMISSION_PATH);
	setEnv(
		"SIRE_API_SALES_SUBMISSION_PATH",
		ORIGINAL_ENV.SIRE_API_SALES_SUBMISSION_PATH,
	);
	setEnv(
		"SIRE_API_PURCHASES_SUBMISSION_PATH",
		ORIGINAL_ENV.SIRE_API_PURCHASES_SUBMISSION_PATH,
	);
	setEnv("SIRE_API_TOKEN", ORIGINAL_ENV.SIRE_API_TOKEN);
	setEnv("SIRE_AUTH_MODE", ORIGINAL_ENV.SIRE_AUTH_MODE);
	setEnv("SIRE_API_UPLOAD_MODE", ORIGINAL_ENV.SIRE_API_UPLOAD_MODE);
	setEnv(
		"SIRE_ALLOW_API_SIMULATION_FALLBACK",
		ORIGINAL_ENV.SIRE_ALLOW_API_SIMULATION_FALLBACK,
	);
	setEnv("SIRE_API_TIMEOUT_MS", ORIGINAL_ENV.SIRE_API_TIMEOUT_MS);
	setEnv("COMPANY_RUC", ORIGINAL_ENV.COMPANY_RUC);
	setEnv("SUNAT_OAUTH_BASE_URL", ORIGINAL_ENV.SUNAT_OAUTH_BASE_URL);
	setEnv(
		"SUNAT_OAUTH_TOKEN_PATH_TEMPLATE",
		ORIGINAL_ENV.SUNAT_OAUTH_TOKEN_PATH_TEMPLATE,
	);
	setEnv("SUNAT_OAUTH_SCOPE", ORIGINAL_ENV.SUNAT_OAUTH_SCOPE);
	setEnv("SUNAT_CLIENT_ID", ORIGINAL_ENV.SUNAT_CLIENT_ID);
	setEnv("SUNAT_CLIENT_SECRET", ORIGINAL_ENV.SUNAT_CLIENT_SECRET);
	setEnv("SUNAT_SOL_USERNAME", ORIGINAL_ENV.SUNAT_SOL_USERNAME);
	setEnv("SUNAT_SOL_PASSWORD", ORIGINAL_ENV.SUNAT_SOL_PASSWORD);
	setEnv("SIRE_POLICY_REFERENCE_DATE", ORIGINAL_ENV.SIRE_POLICY_REFERENCE_DATE);
	setEnv("SIRE_2026_POSTPONED_UNTIL", ORIGINAL_ENV.SIRE_2026_POSTPONED_UNTIL);
	setEnv(
		"SIRE_2026_PRICO_INCOME_THRESHOLD_PEN",
		ORIGINAL_ENV.SIRE_2026_PRICO_INCOME_THRESHOLD_PEN,
	);
}

const validInput: SubmitSireInput = {
	companyId: "cmp_123",
	period: "2026-01",
	ledgerType: "ventas",
	payloadFormat: "txt",
	payloadBase64: "dGVzdA==",
	dryRun: false,
};

const tenantSunatContext: TenantSunatContext = {
	companyId: validInput.companyId,
	ruc: "20123456786",
	credential: {
		clientId: "client-tenant",
		fingerprint: "sha256:tenant",
		ruc: "20123456786",
		scope: "sire.submit",
	},
};

describe("SireSubmissionService", () => {
	beforeEach(() => {
		SireSubmissionService.clearOAuthTokenCacheForTests();
	});

	afterEach(() => {
		vi.restoreAllMocks();
		globalThis.fetch = ORIGINAL_FETCH;
		resetEnv();
	});

	it("simulates when mode is simulation", async () => {
		process.env.SIRE_SUBMISSION_MODE = "simulation";
		process.env.SIRE_API_TOKEN = "";

		const result = await SireSubmissionService.submit(validInput);

		expect(result.provider).toBe("simulation");
		expect(result.status).toBe("SIMULATED");
		expect(result.message).toContain("simulation");
	});

	it("simulates with deferred policy when PRICO is before June 2026 cutoff", async () => {
		process.env.SIRE_SUBMISSION_MODE = "api";
		process.env.SIRE_POLICY_REFERENCE_DATE = "2026-05-20T00:00:00.000Z";
		process.env.SIRE_2026_POSTPONED_UNTIL = "2026-06-01";

		const result = await SireSubmissionService.submit({
			...validInput,
			isPrico: true,
		});

		expect(result.provider).toBe("simulation");
		expect(result.status).toBe("SIMULATED");
		expect(result.message).toContain("diferido");
		expect(result.policy?.isDeferred).toBe(true);
	});

	it("simulates when api mode is enabled but token is missing", async () => {
		process.env.SIRE_SUBMISSION_MODE = "api";
		process.env.SIRE_API_TOKEN = "";
		process.env.SIRE_AUTH_MODE = "auto";
		process.env.SIRE_ALLOW_API_SIMULATION_FALLBACK = "true";
		delete process.env.SUNAT_CLIENT_ID;
		delete process.env.SUNAT_CLIENT_SECRET;
		delete process.env.SUNAT_SOL_USERNAME;
		delete process.env.SUNAT_SOL_PASSWORD;

		const result = await SireSubmissionService.submit(validInput);

		expect(result.provider).toBe("simulation");
		expect(result.status).toBe("SIMULATED");
		expect(result.message).toContain("fallback simulation");
	});

	it("fails closed before external API submission when tenant context is missing", async () => {
		process.env.SIRE_SUBMISSION_MODE = "api";
		process.env.SIRE_API_TOKEN = "token_123";
		process.env.SIRE_API_BASE_URL = "https://api.sunat.gob.pe";
		process.env.SIRE_API_SUBMISSION_PATH = "/v1/contribuyente/sire/submissions";

		const fetchMock = vi.fn(async () =>
			new Response(JSON.stringify({ id: "UNSAFE" }), { status: 200 }),
		);
		globalThis.fetch = fetchMock as typeof fetch;

		await expect(SireSubmissionService.submit(validInput)).rejects.toThrow(
			"Tenant SUNAT context is required for SIRE API submissions.",
		);
		expect(fetchMock).not.toHaveBeenCalled();
	});

	it("submits to SUNAT API when configured", async () => {
		process.env.SIRE_SUBMISSION_MODE = "api";
		process.env.SIRE_API_TOKEN = "token_123";
		process.env.SIRE_API_BASE_URL = "https://api.sunat.gob.pe";
		process.env.SIRE_API_SUBMISSION_PATH = "/v1/contribuyente/sire/submissions";
		process.env.COMPANY_RUC = "20123456789";

		const fetchMock = vi.fn(async () => {
			return new Response(
				JSON.stringify({
					id: "SUB-001",
					status: "ACCEPTED",
					ticket: "TICK-99",
					message: "Recibido correctamente",
				}),
				{
					status: 200,
					headers: { "content-type": "application/json" },
				},
			);
		});

		globalThis.fetch = fetchMock as typeof fetch;

		const result = await SireSubmissionService.submit(validInput, {
			tenantSunatContext,
		});

		expect(fetchMock).toHaveBeenCalledOnce();
		const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
		expect(url).toBe(
			"https://api.sunat.gob.pe/v1/contribuyente/sire/submissions",
		);
		expect(init.method).toBe("POST");
		expect(result.provider).toBe("sunat-api");
		expect(result.status).toBe("ACCEPTED");
		expect(result.submissionId).toBe("SUB-001");
		expect(result.sunatTicket).toBe("TICK-99");
		const body = JSON.parse(String(init.body));
		expect(body.ruc).toBe(tenantSunatContext.ruc);
		expect(body.ruc).not.toBe(process.env.COMPANY_RUC);
	});

	it("uses tenant RUC in multipart ZIP filename and form payload", async () => {
		process.env.SIRE_SUBMISSION_MODE = "api";
		process.env.SIRE_API_TOKEN = "token_123";
		process.env.SIRE_API_BASE_URL = "https://api.sunat.gob.pe";
		process.env.SIRE_API_SUBMISSION_PATH = "/v1/contribuyente/sire/submissions";
		process.env.SIRE_API_UPLOAD_MODE = "multipart-zip";
		process.env.COMPANY_RUC = "20999999999";

		const fetchMock = vi.fn(async () => {
			return new Response(JSON.stringify({ id: "SUB-ZIP", status: "ACCEPTED" }), {
				status: 200,
				headers: { "content-type": "application/json" },
			});
		});
		globalThis.fetch = fetchMock as typeof fetch;

		await SireSubmissionService.submit(
			{
				...validInput,
				payloadBase64: Buffer.from("PK-test-zip").toString("base64"),
			},
			{ tenantSunatContext },
		);

		const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
		const body = init.body as FormData;
		const file = body.get("archivo") as File;

		expect(body.get("ruc")).toBe(tenantSunatContext.ruc);
		expect(file.name).toBe(`202601-${tenantSunatContext.ruc}-RVIE.zip`);
		expect(file.name).not.toContain(process.env.COMPANY_RUC ?? "");
	});

	it("throws when SUNAT API returns non-success status", async () => {
		process.env.SIRE_SUBMISSION_MODE = "api";
		process.env.SIRE_API_TOKEN = "token_123";
		process.env.SIRE_API_BASE_URL = "https://api.sunat.gob.pe";
		process.env.SIRE_API_SUBMISSION_PATH = "/v1/contribuyente/sire/submissions";

		const fetchMock = vi.fn(async () => {
			return new Response(
				JSON.stringify({
					message: "Unauthorized",
				}),
				{
					status: 401,
					headers: { "content-type": "application/json" },
				},
			);
		});

		globalThis.fetch = fetchMock as typeof fetch;

		await expect(
			SireSubmissionService.submit(validInput, { tenantSunatContext }),
		).rejects.toThrow("SIRE API request failed (401): Unauthorized");
	});

	it("uses OAuth SOL when auth mode is oauth-sol", async () => {
		process.env.SIRE_SUBMISSION_MODE = "api";
		process.env.SIRE_API_TOKEN = "";
		process.env.SIRE_AUTH_MODE = "oauth-sol";
		process.env.SIRE_API_BASE_URL = "https://api.sunat.gob.pe";
		process.env.SIRE_API_SUBMISSION_PATH = "/v1/contribuyente/sire/submissions";
		process.env.SUNAT_OAUTH_BASE_URL = "https://api-seguridad.sunat.gob.pe";
		process.env.SUNAT_OAUTH_TOKEN_PATH_TEMPLATE =
			"/v1/clientessol/{clientId}/oauth2/token/";
		process.env.SUNAT_CLIENT_ID = "client-1";
		process.env.SUNAT_CLIENT_SECRET = "secret-1";
		process.env.SUNAT_SOL_USERNAME = "MODDATOS";
		process.env.SUNAT_SOL_PASSWORD = "sol-pass";
		process.env.COMPANY_RUC = "20123456789";

		const fetchMock = vi.fn(
			async (input: RequestInfo | URL, init?: RequestInit) => {
				const url = typeof input === "string" ? input : input.toString();
				if (url.includes("/oauth2/token/")) {
					return new Response(
						JSON.stringify({ access_token: "oauth-token-1", expires_in: 3600 }),
						{ status: 200, headers: { "content-type": "application/json" } },
					);
				}

				expect(init?.headers).toMatchObject({
					Authorization: "Bearer oauth-token-1",
				});
				return new Response(
					JSON.stringify({
						id: "SUB-009",
						status: "ACCEPTED",
					}),
					{ status: 200, headers: { "content-type": "application/json" } },
				);
			},
		);

		globalThis.fetch = fetchMock as typeof fetch;

		const result = await SireSubmissionService.submit(validInput, {
			tenantSunatContext,
		});

		expect(result.provider).toBe("sunat-api");
		expect(result.submissionId).toBe("SUB-009");
		expect(fetchMock).toHaveBeenCalledTimes(2);
	});

	it("caches OAuth token between submissions", async () => {
		process.env.SIRE_SUBMISSION_MODE = "api";
		process.env.SIRE_AUTH_MODE = "oauth-sol";
		process.env.SIRE_API_BASE_URL = "https://api.sunat.gob.pe";
		process.env.SIRE_API_SUBMISSION_PATH = "/v1/contribuyente/sire/submissions";
		process.env.SUNAT_OAUTH_BASE_URL = "https://api-seguridad.sunat.gob.pe";
		process.env.SUNAT_OAUTH_TOKEN_PATH_TEMPLATE =
			"/v1/clientessol/{clientId}/oauth2/token/";
		process.env.SUNAT_CLIENT_ID = "client-1";
		process.env.SUNAT_CLIENT_SECRET = "secret-1";
		process.env.SUNAT_SOL_USERNAME = "MODDATOS";
		process.env.SUNAT_SOL_PASSWORD = "sol-pass";
		process.env.COMPANY_RUC = "20123456789";

		const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
			const url = typeof input === "string" ? input : input.toString();
			if (url.includes("/oauth2/token/")) {
				return new Response(
					JSON.stringify({
						access_token: "oauth-token-cached",
						expires_in: 3600,
					}),
					{ status: 200, headers: { "content-type": "application/json" } },
				);
			}
			return new Response(
				JSON.stringify({ id: "SUB-777", status: "ACCEPTED" }),
				{ status: 200, headers: { "content-type": "application/json" } },
			);
		});
		globalThis.fetch = fetchMock as typeof fetch;

		await SireSubmissionService.submit(validInput, { tenantSunatContext });
		await SireSubmissionService.submit(
			{
				...validInput,
				idempotencyKey: "idem-0022",
			},
			{ tenantSunatContext },
		);

		expect(fetchMock).toHaveBeenCalledTimes(3);
		const tokenCalls = fetchMock.mock.calls.filter((call) => {
			const url = typeof call[0] === "string" ? call[0] : call[0].toString();
			return url.includes("/oauth2/token/");
		});
		expect(tokenCalls).toHaveLength(1);
	});
});
