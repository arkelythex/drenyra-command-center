/**
 * Live integration tests against a RUNNING drenyra-engram sidecar.
 *
 * These are the tests that found the 4 real integration bugs the mocked
 * unit tests could not (empty content fields, period-in-scope vs
 * period-less reads, companyId != ruc). They REQUIRE a live engine:
 *
 *   drenyra-engram serve --db <temp> --addr 127.0.0.1:8799
 *
 * When the engine is unreachable the suite SKIPS (the env var
 * DRENYRA_ENGRAM_URL points the client at the instance; default
 * http://127.0.0.1:8799). A dedicated test tenant ("integration-test")
 * keeps the probes out of real data.
 *
 * No monetary fields exist in the observation model; Drenyra money values
 * are BigInt cents (repo-wide rule) and nothing here touches them.
 */

import { FiscalMemory } from "@drenyra/domain/fiscal-memory";
import { describe, expect, it } from "vitest";
import {
	EngramClient,
	EngramFiscalMemoryRepository,
	EngramSessionStore,
} from "../index.js";

const BASE = process.env.DRENYRA_ENGRAM_URL ?? "http://127.0.0.1:8799";
const RUC = "20123456789";
// Unique per run: the engine DB accumulates between runs, so a fixed
// tenant would make period/category queries return stale hits.
const TENANT = `integration-test-${Date.now()}`;

const client = new EngramClient({ baseUrl: BASE, timeoutMs: 1500 });

// Top-level await: the skip decision must be made at module load, before any
// test runs (a beforeAll would evaluate describe.skip too late).
let live = false;
try {
	const health = await client.health();
	live = health.schemaVersion === 1;
} catch {
	live = false;
}

const describeLive = live ? describe : describe.skip;

describeLive("engram live integration", () => {
	it("session store: save -> search -> context round trip (company-level)", async () => {
		const session = new EngramSessionStore(client);
		await session.save({
			agentId: "integration-test",
			sessionId: `it-${Date.now()}`,
			scope: { tenantId: TENANT, ruc: RUC },
			type: "mission_result",
			content: "Integration mission completed cleanly",
			metadata: { ruc: RUC, tenantId: TENANT },
		});
		const found = await session.search({
			text: "integration mission",
			scope: { tenantId: TENANT, metadata: { ruc: RUC } },
		});
		expect(found.length).toBeGreaterThanOrEqual(1);
	});

	it("fiscal repo: save -> findById/findByPeriod/findByCategory/evidence/severity round trip", async () => {
		const repo = new EngramFiscalMemoryRepository(client);
		const id = `fm-it-${Date.now()}`;
		const memory = FiscalMemory.create({
			id,
			tenantId: TENANT,
			companyId: "comp-it",
			ruc: RUC,
			period: "2026-07",
			category: "tax_decision",
			severity: "high",
			title: "Integration retention criteria",
			summary: "Retention applies at 4%",
			evidenceRefs: [`evidence/it-${id}`],
			tags: ["integration"],
			createdBy: "it-runner",
			sourceAgentId: "it-agent",
		});
		await repo.save(memory);

		const scope = { tenantId: TENANT, companyId: "comp-it", ruc: RUC };
		expect((await repo.findById(id, scope))?.severity).toBe("high");
		expect(await repo.findByPeriod(scope, "2026-07")).toHaveLength(1);
		expect((await repo.findByCategory(scope, "tax_decision"))[0]?.id).toBe(id);
		expect(
			(await repo.findByEvidenceRef(scope, `evidence/it-${id}`))[0]?.id,
		).toBe(id);
		expect((await repo.findBySeverity(scope, "high"))[0]?.id).toBe(id);
	});

	it("scope isolation: another RUC never sees the test tenant's memory", async () => {
		const otherRuc = await client.context({
			ruc: "20600995804",
			organizationId: TENANT,
		});
		expect(otherRuc).toHaveLength(0);
	});

	it("chain: full revision history for a fiscal topic key", async () => {
		const repo = new EngramFiscalMemoryRepository(client);
		const id = `fm-chain-${Date.now()}`;
		const memory = FiscalMemory.create({
			id,
			tenantId: TENANT,
			companyId: "comp-it",
			ruc: RUC,
			period: "2026-07",
			category: "accounting_criterion",
			severity: "low",
			title: "Chain criteria",
			summary: "v1",
			evidenceRefs: [],
			tags: [],
			createdBy: "it-runner",
		});
		await repo.save(memory);
		await repo.save(
			FiscalMemory.create({
				id,
				tenantId: TENANT,
				companyId: "comp-it",
				ruc: RUC,
				period: "2026-07",
				category: "accounting_criterion",
				severity: "low",
				title: "Chain criteria",
				summary: "v2",
				evidenceRefs: [],
				tags: [],
				createdBy: "it-runner",
			}),
		);

		const chain = await client.chain({
			topicKey: `fiscal-memory/${id}`,
			ruc: RUC,
			organizationId: TENANT,
		});
		expect(chain.length).toBeGreaterThanOrEqual(2);
		expect(chain[chain.length - 1].content.why).toBe("v2");
	});
});
