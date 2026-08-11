/**
 * EngramFiscalMemoryRepository — unit tests.
 *
 * No monetary fields exist in the fiscal-memory model; Drenyra money values
 * are BigInt cents (repo-wide rule) and nothing here touches them.
 */

import { FiscalMemory } from "@drenyra/domain/fiscal-memory";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { EngramClient, EngramObservation } from "../engram-client";
import {
	EngramFiscalMemoryRepository,
	engramPeriodToFiscal,
	fiscalPeriodToEngram,
	observationToFiscalMemory,
} from "../engram-fiscal-memory.repository";

const RUC = "20123456789";
const TENANT = "tenant-1";
const COMPANY = "company-1";
const MEMORY_ID = "mem-001";

const SCOPE = { tenantId: TENANT, companyId: COMPANY, ruc: RUC };

function makeMemory(
	overrides: Partial<Parameters<typeof FiscalMemory.create>[0]> = {},
) {
	return FiscalMemory.create({
		id: MEMORY_ID,
		tenantId: TENANT,
		companyId: COMPANY,
		ruc: RUC,
		period: "2026-07",
		category: "tax_decision",
		severity: "high",
		title: "IGV retention criteria",
		summary: "Retention applies at 4% for this supplier class",
		evidenceRefs: ["evidence/invoice-1"],
		tags: ["igv", "retention"],
		relatedMemoryIds: ["mem-000"],
		createdBy: "user-1",
		sourceAgentId: "agent-1",
		...overrides,
	});
}

function makeClient() {
	return {
		save: vi.fn().mockResolvedValue({ observation: {}, outcome: "created" }),
		search: vi.fn().mockResolvedValue([]),
		context: vi.fn().mockResolvedValue([]),
		chain: vi.fn().mockResolvedValue([]),
	} as unknown as EngramClient;
}

/** Build the engram observation a save of `memory` would produce. */
function observationOf(memory: FiscalMemory): EngramObservation {
	const props = memory.toJSON();
	return {
		identity: { id: "obs-1", topicKey: `fiscal-memory/${props.id}` },
		title: `[${props.category}] ${props.title}`,
		kind: "decision",
		status: "active",
		fiscalEffect: "none",
		recordedAt: props.updatedAt.toISOString(),
		scope: {
			kind: "company",
			organizationId: TENANT,
			companyId: RUC,
			ruc: RUC,
			period: "202607",
		},
		content: {
			what: props.title,
			why: props.summary,
			where: props.evidenceRefs.join("\n"),
			learned: JSON.stringify({
				id: props.id,
				companyId: props.companyId,
				period: props.period,
				severity: props.severity,
				status: props.status,
				tags: [...props.tags],
				relatedMemoryIds: [...(props.relatedMemoryIds ?? [])],
				approvedBy: props.approvedBy,
				sourceAgentId: props.sourceAgentId,
				updatedAt: props.updatedAt.toISOString(),
			}),
		},
		source: {
			system: "drenyra-api",
			actorId: props.createdBy,
			actorKind: "human",
			session: props.sourceAgentId,
		},
		revision: 1,
	} as EngramObservation;
}

describe("period normalization", () => {
	it("converts YYYY-MM -> YYYYMM and back", () => {
		expect(fiscalPeriodToEngram("2026-07")).toBe("202607");
		expect(engramPeriodToFiscal("202607")).toBe("2026-07");
	});
	it("fails closed on malformed periods", () => {
		expect(() => fiscalPeriodToEngram("2026")).toThrow();
		expect(() => engramPeriodToFiscal("2026-1")).toThrow();
	});
});

describe("save mapping", () => {
	let client: ReturnType<typeof makeClient>;
	let repo: EngramFiscalMemoryRepository;

	beforeEach(() => {
		client = makeClient();
		repo = new EngramFiscalMemoryRepository(client);
	});

	it("maps a fiscal memory to a scoped observation", async () => {
		await repo.save(makeMemory());

		expect(client.save).toHaveBeenCalledTimes(1);
		const saved = client.save.mock.calls[0][0];
		expect(saved.topicKey).toBe(`fiscal-memory/${MEMORY_ID}`);
		expect(saved.kind).toBe("decision");
		expect(saved.title).toBe("[tax_decision] IGV retention criteria");
		expect(saved.scope).toEqual({
			kind: "company",
			organizationId: TENANT,
			companyId: RUC, // engine convention: companyId derived from the RUC
			ruc: RUC,
			// PERIOD-LESS scope: the fiscal period lives in learned so the
			// period-less search/context reads can match (exact-scope rule).
		});
		// The domain companyId AND period are preserved in the learned metadata.
		expect(saved.content.learned).toContain('"companyId":"company-1"');
		expect(saved.content.learned).toContain('"period":"2026-07"');
		expect(saved.content.what).toBe("IGV retention criteria");
		expect(saved.content.why).toBe(
			"Retention applies at 4% for this supplier class",
		);
		expect(saved.content.where).toBe("evidence/invoice-1");
		expect(saved.content.learned).toContain('"severity":"high"');
		expect(saved.source.actorId).toBe("user-1");
		expect(saved.source.session).toBe("agent-1");
	});
});

describe("round trip", () => {
	it("reconstructs the exact aggregate from an observation", () => {
		const memory = makeMemory();
		const restored = observationToFiscalMemory(observationOf(memory));
		expect(restored.id).toBe(MEMORY_ID);
		expect(restored.category).toBe("tax_decision");
		expect(restored.severity).toBe("high");
		expect(restored.title).toBe("IGV retention criteria");
		expect(restored.summary).toBe(
			"Retention applies at 4% for this supplier class",
		);
		expect(restored.evidenceRefs).toEqual(["evidence/invoice-1"]);
		expect(restored.tags).toEqual(["igv", "retention"]);
		expect(restored.relatedMemoryIds).toEqual(["mem-000"]);
		expect(restored.period).toBe("2026-07");
		expect(restored.ruc).toBe(RUC);
		expect(restored.createdBy).toBe("user-1");
	});

	it("save -> findById returns the same memory (search + exact topicKey filter)", async () => {
		const client2 = makeClient();
		const repo2 = new EngramFiscalMemoryRepository(client2);
		const memory = makeMemory();
		await repo2.save(memory);

		vi.mocked(client2.search).mockResolvedValue([
			{ observation: observationOf(memory), score: 1, stale: false },
		]);
		const found = await repo2.findById(MEMORY_ID, SCOPE);
		expect(found?.id).toBe(MEMORY_ID);
		expect(found?.severity).toBe("high");
		expect(found?.evidenceRefs).toEqual(["evidence/invoice-1"]);
		// The search must be scoped by ruc + tenant.
		expect(client2.search).toHaveBeenCalledWith({
			q: MEMORY_ID,
			ruc: RUC,
			organizationId: TENANT,
		});
	});

	it("findById returns null when the memory is not found", async () => {
		const localClient = makeClient();
		const localRepo = new EngramFiscalMemoryRepository(localClient);
		vi.mocked(localClient.search).mockResolvedValue([]);
		const found = await localRepo.findById("mem-nope", SCOPE);
		expect(found).toBeNull();
	});
});

describe("query methods", () => {
	let client: ReturnType<typeof makeClient>;
	let repo: EngramFiscalMemoryRepository;

	beforeEach(() => {
		client = makeClient();
		repo = new EngramFiscalMemoryRepository(client);
	});

	it("findByPeriod queries the period-less scope and filters by the exact period", async () => {
		const july = makeMemory();
		const august = makeMemory({ id: "mem-002", period: "2026-08" });
		vi.mocked(client.context).mockResolvedValue([
			observationOf(july),
			observationOf(august),
		]);
		const memories = await repo.findByPeriod(SCOPE, "2026-07");
		// The domain scope carries no period: context runs period-less and the
		// exact period is a filter over the learned metadata.
		expect(client.context).toHaveBeenCalledWith({
			ruc: RUC,
			organizationId: TENANT,
		});
		expect(memories).toHaveLength(1);
		expect(memories[0].id).toBe("mem-001");
		expect(memories[0].period).toBe("2026-07");
	});

	it("findByCategory searches and filters by exact category", async () => {
		vi.mocked(client.search).mockResolvedValue([
			{ observation: observationOf(makeMemory()), score: 1, stale: false },
			// A non-fiscal observation must be skipped, not crash the query.
			{
				observation: {
					identity: { id: "obs-x", topicKey: "mission/m1" },
					title: "other",
					type: "mission_result",
					scope: {
						kind: "company",
						organizationId: TENANT,
						companyId: COMPANY,
						ruc: RUC,
					},
					content: { what: "x", why: "y", where: "z", learned: "w" },
					provenance: {
						actor: "a",
						timestamp: "2026-01-01T00:00:00Z",
						source: "api",
					},
					revision: 1,
				} as EngramObservation,
				score: 1,
				stale: false,
			},
		]);
		const memories = await repo.findByCategory(SCOPE, "tax_decision");
		expect(memories).toHaveLength(1);
		expect(memories[0].category).toBe("tax_decision");
	});

	it("findBySeverity filters by exact severity", async () => {
		const high = makeMemory();
		vi.mocked(client.search).mockResolvedValue([
			{ observation: observationOf(high), score: 1, stale: false },
		]);
		const memories = await repo.findBySeverity(SCOPE, "high");
		expect(memories).toHaveLength(1);
		const none = await repo.findBySeverity(SCOPE, "low");
		expect(none).toHaveLength(0);
	});

	it("findByEvidenceRef filters by exact ref", async () => {
		vi.mocked(client.search).mockResolvedValue([
			{ observation: observationOf(makeMemory()), score: 1, stale: false },
		]);
		const hit = await repo.findByEvidenceRef(SCOPE, "evidence/invoice-1");
		expect(hit).toHaveLength(1);
		const miss = await repo.findByEvidenceRef(SCOPE, "evidence/other");
		expect(miss).toHaveLength(0);
	});

	it("mixed search results never crash the query (non-fiscal rows skipped)", async () => {
		// Regression (live integration): a token-overlap search in a shared
		// scope returns mission/session observations too; findBySeverity /
		// findByEvidenceRef / findRelated must skip them, not throw
		// FISCAL_MEMORY_CORRUPT.
		const nonFiscal = {
			identity: { id: "obs-x", topicKey: "mission/m1" },
			title: "Mission m1 completed",
			type: "mission_result",
			scope: {
				kind: "company",
				organizationId: TENANT,
				companyId: RUC,
				ruc: RUC,
			},
			content: { what: "x", why: "y", where: "z", learned: "w" },
			provenance: {
				actor: "a",
				timestamp: "2026-01-01T00:00:00Z",
				source: "api",
			},
			revision: 1,
		} as EngramObservation;
		vi.mocked(client.search).mockResolvedValue([
			{ observation: nonFiscal, score: 2, stale: false },
			{ observation: observationOf(makeMemory()), score: 1, stale: false },
		]);

		const bySeverity = await repo.findBySeverity(SCOPE, "high");
		expect(bySeverity).toHaveLength(1);
		const byEvidence = await repo.findByEvidenceRef(
			SCOPE,
			"evidence/invoice-1",
		);
		expect(byEvidence).toHaveLength(1);
		const related = await repo.findRelated(SCOPE, "mem-000");
		expect(related).toHaveLength(1);
	});

	it("a memory with no evidence refs saves with a non-empty where field", async () => {
		// Regression (live integration): the engine's AssertValidContent
		// requires all four content fields non-empty; a valid domain memory
		// with empty evidenceRefs must not produce where = "".
		// client_explanation does not require evidenceRefs in the domain.
		const memory = makeMemory({
			category: "client_explanation",
			evidenceRefs: [],
		});
		await repo.save(memory);
		const saved = client.save.mock.calls[0][0];
		expect(saved.content.where.length).toBeGreaterThan(0);
	});
});

describe("revisions", () => {
	let client: ReturnType<typeof makeClient>;
	let repo: EngramFiscalMemoryRepository;

	beforeEach(() => {
		client = makeClient();
		repo = new EngramFiscalMemoryRepository(client);
	});

	it("findRevisions fails closed (no scope in the domain interface)", async () => {
		// The domain interface provides no scope for findRevisions, and the
		// engram engine is scope-first — an unscoped query would violate
		// structural isolation. The adapter fails closed instead of running an
		// unscoped search.
		await expect(repo.findRevisions(MEMORY_ID)).rejects.toMatchObject({
			code: "FISCAL_MEMORY_NO_SCOPE",
		});
		expect(client.search).not.toHaveBeenCalled();
	});

	it("saveRevision records the next state on the same chain with revision metadata", async () => {
		const v1 = makeMemory();
		const v2 = makeMemory({ title: "Updated criteria" });
		await repo.saveRevision({
			id: `fiscal-memory/${MEMORY_ID}/rev-1`,
			memoryId: MEMORY_ID,
			revisionNumber: 1,
			changedBy: "user-2",
			changeReason: "Criteria updated",
			previousValue: v1.toJSON(),
			nextValue: v2.toJSON(),
			createdAt: new Date("2026-08-01T00:00:00Z"),
		});

		const saved = client.save.mock.calls[0][0];
		expect(saved.topicKey).toBe(`fiscal-memory/${MEMORY_ID}`);
		expect(saved.content.learned).toContain('"revisionNumber":1');
		expect(saved.content.learned).toContain(
			'"changeReason":"Criteria updated"',
		);
		expect(saved.source.actorId).toBe("user-2");
	});
});
