import { describe, expect, it, vi } from "vitest";
import { type EngramClient, EngramError } from "../engram-client.js";
import { EngramSessionStore } from "../engram-session-store.js";

function mockClient() {
	const client = {
		save: vi.fn(),
		search: vi.fn(),
		context: vi.fn(),
		health: vi.fn(),
	} as unknown as EngramClient;
	return client;
}

const RUC = "20123456789";
const PERIOD = "202601";
const NOW = "2026-01-15T10:00:00.000Z";

const SAVE_INPUT = {
	agentId: "analysis",
	sessionId: "sess-1",
	scope: { tenantId: "org-1" },
	type: "fact",
	content: "Analysis complete",
	metadata: { tenantId: "org-1", ruc: RUC, period: PERIOD },
};

const OBSERVATION = {
	identity: { id: "obs-1", topicKey: "sess-1" },
	title: "fact",
	type: "fact",
	scope: {
		kind: "company",
		organizationId: "org-1",
		companyId: RUC,
		ruc: RUC,
		period: PERIOD,
	},
	content: { what: "Analysis complete", why: "", where: "", learned: "" },
	authorityStatus: "draft",
	provenance: {
		actor: "analysis",
		timestamp: NOW,
		source: "drenyra-memory",
		session: "sess-1",
	},
	revision: 1,
};

function store(client = mockClient(), source = "drenyra-memory") {
	return new EngramSessionStore(client, { source });
}

describe("EngramSessionStore.save", () => {
	it("builds the engram save payload with the full field mapping", async () => {
		const client = mockClient();
		client.save.mockResolvedValue({
			observation: OBSERVATION,
			outcome: "created",
		});
		const sessionStore = store(client);

		await sessionStore.save(SAVE_INPUT);

		expect(client.save).toHaveBeenCalledTimes(1);
		const payload = client.save.mock.calls[0]?.[0] as Record<string, unknown>;
		expect(payload.topicKey).toBe("sess-1");
		expect(payload.title).toBe("fact");
		expect(payload.type).toBe("fact");
		expect(payload.scope).toEqual({
			kind: "company",
			organizationId: "org-1",
			companyId: RUC,
			ruc: RUC,
			period: PERIOD,
		});
		expect(payload.content).toEqual({
			what: "Analysis complete",
			why: "",
			where: "",
			learned: "",
		});
		expect(payload.provenance).toMatchObject({
			actor: "analysis",
			source: "drenyra-memory",
			session: "sess-1",
		});
	});

	it("defaults period to an empty string when absent", async () => {
		const client = mockClient();
		client.save.mockResolvedValue({
			observation: OBSERVATION,
			outcome: "created",
		});
		const sessionStore = store(client);

		await sessionStore.save({
			...SAVE_INPUT,
			metadata: { tenantId: "org-1", ruc: RUC },
		});

		const payload = client.save.mock.calls[0]?.[0] as {
			scope: Record<string, unknown>;
		};
		expect(payload.scope.period).toBe("");
	});

	it("uses agent:type as topicKey when no sessionId is present", async () => {
		const client = mockClient();
		client.save.mockResolvedValue({
			observation: OBSERVATION,
			outcome: "created",
		});
		const sessionStore = store(client);

		await sessionStore.save({
			...SAVE_INPUT,
			sessionId: undefined,
		});

		const payload = client.save.mock.calls[0]?.[0] as { topicKey: string };
		expect(payload.topicKey).toBe("memory:analysis:fact");
	});

	it("throws a typed EngramError when metadata.ruc is missing", async () => {
		const sessionStore = store();

		const error = await sessionStore
			.save({ ...SAVE_INPUT, metadata: { tenantId: "org-1" } })
			.catch((caught: unknown) => caught);

		expect(error).toBeInstanceOf(EngramError);
		expect((error as EngramError).kind).toBe("invalid-input");
		expect((error as EngramError).code).toBe("INVALID_SCOPE");
	});

	it("returns a MemoryRecord preserving the input scope and metadata", async () => {
		const client = mockClient();
		client.save.mockResolvedValue({
			observation: OBSERVATION,
			outcome: "created",
		});
		const sessionStore = store(client);

		const record = await sessionStore.save(SAVE_INPUT);

		expect(record.id).toBe("obs-1");
		expect(record.agentId).toBe("analysis");
		expect(record.sessionId).toBe("sess-1");
		expect(record.scope).toEqual({ tenantId: "org-1" });
		expect(record.metadata).toEqual(SAVE_INPUT.metadata);
		expect(record.type).toBe("fact");
		expect(record.content).toBe("Analysis complete");
		expect(record.createdAt.toISOString()).toBe(NOW);
	});
});

describe("EngramSessionStore.search", () => {
	it("passes ruc, period and organizationId to the client and maps results", async () => {
		const client = mockClient();
		client.search.mockResolvedValue([
			{ observation: OBSERVATION, score: 3, stale: false },
		]);
		const sessionStore = store(client);

		const results = await sessionStore.search({
			text: "analysis",
			scope: { tenantId: "org-1", metadata: { ruc: RUC, period: PERIOD } },
		});

		expect(client.search).toHaveBeenCalledWith({
			ruc: RUC,
			period: PERIOD,
			organizationId: "org-1",
			q: "analysis",
		});
		expect(results).toHaveLength(1);
		expect(results[0]?.score).toBe(3);
		expect(results[0]?.record.content).toBe("Analysis complete");
		expect(results[0]?.record.scope.metadata).toEqual({
			ruc: RUC,
			period: PERIOD,
		});
	});

	it("throws a typed EngramError when scope.metadata.ruc is missing", async () => {
		const sessionStore = store();

		const error = await sessionStore
			.search({ text: "x", scope: { tenantId: "org-1" } })
			.catch((caught: unknown) => caught);

		expect((error as EngramError).kind).toBe("invalid-input");
	});
});

describe("EngramSessionStore.context", () => {
	it("calls the context endpoint and condenses records into a summary", async () => {
		const client = mockClient();
		client.context.mockResolvedValue([OBSERVATION]);
		const sessionStore = store(client);

		const context = await sessionStore.context({
			scope: { tenantId: "org-1", metadata: { ruc: RUC } },
		});

		expect(client.context).toHaveBeenCalledWith({
			ruc: RUC,
			period: "",
			organizationId: "org-1",
		});
		expect(context.records).toHaveLength(1);
		expect(context.summary).toBe("Analysis complete");
	});

	it("applies the query limit", async () => {
		const client = mockClient();
		client.context.mockResolvedValue([OBSERVATION, OBSERVATION]);
		const sessionStore = store(client);

		const context = await sessionStore.context({
			scope: { tenantId: "org-1", metadata: { ruc: RUC } },
			limit: 1,
		});

		expect(context.records).toHaveLength(1);
	});
});

describe("EngramSessionStore.getBySession", () => {
	it("filters context observations by provenance.session", async () => {
		const other = {
			...OBSERVATION,
			identity: { id: "obs-2", topicKey: "other" },
			provenance: {
				...OBSERVATION.provenance,
				session: "sess-2",
			},
		};
		const client = mockClient();
		client.context.mockResolvedValue([OBSERVATION, other]);
		const sessionStore = store(client);

		const records = await sessionStore.getBySession("sess-1", {
			tenantId: "org-1",
			metadata: { ruc: RUC },
		});

		expect(records).toHaveLength(1);
		expect(records[0]?.id).toBe("obs-1");
		expect(records[0]?.sessionId).toBe("sess-1");
	});
});
