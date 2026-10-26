import { afterEach, describe, expect, it, vi } from "vitest";
import {
	ENGRAM_SCOPE_KIND,
	ENGRAM_WRITE_OUTCOME,
	EngramClient,
	EngramError,
} from "../engram-client.js";

const BASE_URL = "http://engram.test:8733";

const OBSERVATION = {
	identity: { id: "obs-1", topicKey: "run-1" },
	title: "agent_run",
	kind: "fact",
	scope: {
		kind: ENGRAM_SCOPE_KIND.COMPANY,
		organizationId: "org-1",
		companyId: "20123456789",
		ruc: "20123456789",
		period: "202601",
	},
	content: { what: "what", why: "why", where: "where", learned: "learned" },
	status: "active",
	fiscalEffect: "none",
	effectiveAt: "2026-01-15T10:00:00.000Z",
	recordedAt: "2026-01-15T10:00:00.000Z",
	source: {
		system: "drenyra-memory",
		actorId: "analysis",
		actorKind: "agent",
		session: "sess-1",
	},
	revision: 1,
};

const DOCTOR = {
	schemaVersion: 1,
	storage: "sqlite",
	dbPath: "/data/engram.db",
	observations: 3,
	revisionChains: 2,
	transitions: 1,
	relations: 0,
};

function jsonResponse(body: unknown, status = 200): Response {
	return new Response(JSON.stringify(body), {
		status,
		headers: { "Content-Type": "application/json" },
	});
}

describe("EngramClient", () => {
	afterEach(() => {
		vi.unstubAllGlobals();
	});

	function stubFetch(
		impl: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>,
	) {
		vi.stubGlobal("fetch", vi.fn(impl) as typeof fetch);
	}

	function lastFetchCall(): { input: RequestInfo | URL; init: RequestInit } {
		const calls = (vi.mocked(fetch).mock.calls.at(-1) ?? []) as [
			RequestInfo | URL,
			RequestInit?,
		];
		return { input: calls[0], init: calls[1] ?? {} };
	}

	function client(token?: string) {
		return new EngramClient({
			baseUrl: `${BASE_URL}/`,
			timeoutMs: 5_000,
			...(token === undefined ? {} : { token }),
		});
	}

	it("health() hits /v1/doctor and parses the report", async () => {
		stubFetch(() => Promise.resolve(jsonResponse(DOCTOR)));

		const report = await client().health();

		expect(report).toEqual(DOCTOR);
		const { input } = lastFetchCall();
		expect(String(input)).toBe(`${BASE_URL}/v1/doctor`);
	});

	it("save() POSTs the payload to /v1/observations and parses created", async () => {
		stubFetch(() =>
			Promise.resolve(
				jsonResponse(
					{ memory: OBSERVATION, outcome: ENGRAM_WRITE_OUTCOME.CREATED },
					201,
				),
			),
		);

		const result = await client().save({
			topicKey: "run-1",
			title: "agent_run",
			kind: "fact",
			scope: {
				kind: ENGRAM_SCOPE_KIND.COMPANY,
				companyId: "20123456789",
				ruc: "20123456789",
				period: "202601",
			},
			content: { what: "what", why: "why", where: "where", learned: "learned" },
			fiscalEffect: "none",
			source: {
				system: "drenyra-memory",
				actorId: "analysis",
				actorKind: "agent",
			},
		});

		expect(result.outcome).toBe(ENGRAM_WRITE_OUTCOME.CREATED);
		expect(result.observation.identity.id).toBe("obs-1");
		const { input, init } = lastFetchCall();
		expect(String(input)).toBe(`${BASE_URL}/v1/observations`);
		expect(init.method).toBe("POST");
		expect(init.headers).toMatchObject({ "Content-Type": "application/json" });
		expect(JSON.parse(String(init.body))).toMatchObject({
			topicKey: "run-1",
			scope: { ruc: "20123456789", period: "202601" },
		});
	});

	it("search() passes q, ruc, period and organizationId as query params", async () => {
		stubFetch(() =>
			Promise.resolve(
				jsonResponse([{ memory: OBSERVATION, score: 2, stale: false }]),
			),
		);

		const results = await client().search({
			q: "invoice",
			ruc: "20123456789",
			period: "202601",
			organizationId: "org-1",
		});

		expect(results).toHaveLength(1);
		expect(results[0]?.score).toBe(2);
		expect(results[0]?.stale).toBe(false);
		const { input } = lastFetchCall();
		const url = new URL(String(input));
		expect(url.pathname).toBe("/v1/search");
		expect(url.searchParams.get("q")).toBe("invoice");
		expect(url.searchParams.get("ruc")).toBe("20123456789");
		expect(url.searchParams.get("period")).toBe("202601");
		expect(url.searchParams.get("organizationId")).toBe("org-1");
	});

	it("context() sends an empty period explicitly (period-less scope)", async () => {
		stubFetch(() => Promise.resolve(jsonResponse([OBSERVATION])));

		const observations = await client().context({
			ruc: "20123456789",
			period: "",
		});

		expect(observations).toHaveLength(1);
		const { input } = lastFetchCall();
		const url = new URL(String(input));
		expect(url.pathname).toBe("/v1/context");
		expect(url.searchParams.get("ruc")).toBe("20123456789");
		expect(url.searchParams.get("period")).toBe("");
	});

	it("sends Authorization: Bearer when a token is configured", async () => {
		stubFetch(() => Promise.resolve(jsonResponse(DOCTOR)));

		await client("tok-123").health();

		const { init } = lastFetchCall();
		expect(init.headers).toMatchObject({ Authorization: "Bearer tok-123" });
	});

	it("does not send Authorization when no token is configured", async () => {
		stubFetch(() => Promise.resolve(jsonResponse(DOCTOR)));

		await client().health();

		const { init } = lastFetchCall();
		expect(init.headers).not.toHaveProperty("Authorization");
	});

	it("maps a 400 error envelope to a typed http EngramError", async () => {
		stubFetch(() =>
			Promise.resolve(
				jsonResponse(
					{ error: { code: "INVALID", message: "INVALID_RUC: ..." } },
					400,
				),
			),
		);

		const error = await client()
			.context({ ruc: "123" })
			.catch((caught: unknown) => caught);

		expect(error).toBeInstanceOf(EngramError);
		expect((error as EngramError).kind).toBe("http");
		expect((error as EngramError).code).toBe("INVALID");
		expect((error as EngramError).status).toBe(400);
	});

	it("falls back to an HTTP_<status> code when the envelope is missing", async () => {
		stubFetch(() => Promise.resolve(new Response("boom", { status: 500 })));

		const error = await client()
			.health()
			.catch((caught: unknown) => caught);

		expect((error as EngramError).kind).toBe("http");
		expect((error as EngramError).code).toBe("HTTP_500");
	});

	it("maps network failures to a typed network EngramError", async () => {
		stubFetch(() => Promise.reject(new TypeError("fetch failed")));

		const error = await client()
			.health()
			.catch((caught: unknown) => caught);

		expect(error).toBeInstanceOf(EngramError);
		expect((error as EngramError).kind).toBe("network");
		expect((error as EngramError).code).toBe("ENGINE_UNREACHABLE");
	});

	it("maps abort/timeout failures to a typed timeout EngramError", async () => {
		const timeoutLike = new Error("timed out");
		timeoutLike.name = "TimeoutError";
		stubFetch(() => Promise.reject(timeoutLike));

		const error = await client()
			.health()
			.catch((caught: unknown) => caught);

		expect((error as EngramError).kind).toBe("timeout");
		expect((error as EngramError).code).toBe("ENGINE_TIMEOUT");
	});

	it("maps a malformed 200 body to an invalid-response EngramError", async () => {
		stubFetch(() => Promise.resolve(jsonResponse({ not: "an observation" })));

		const error = await client()
			.context({ ruc: "20123456789" })
			.catch((caught: unknown) => caught);

		expect((error as EngramError).kind).toBe("invalid-response");
		expect((error as EngramError).code).toBe("INVALID_RESPONSE");
	});
});
