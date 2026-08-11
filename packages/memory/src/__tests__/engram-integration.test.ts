/**
 * Cross-repo integration tests against the REAL drenyra-engram sidecar.
 *
 * The suite now AUTOMATES the sidecar lifecycle (helpers/engram-sidecar.ts):
 * it resolves the engine binary (env var, PATH, or a drenyra-engram source
 * checkout that it `go build`s on the fly), starts it on a fresh temp DB and
 * a free port, waits for /v1/doctor, runs the probes, and tears it down. The
 * manual "drenyra-engram serve --db ... --addr ..." step is gone.
 *
 * These are the tests that found real integration bugs the mocked unit tests
 * could not (empty content fields, period-in-scope vs period-less reads,
 * companyId != ruc, and the schema-14 wire contract drift: the engine speaks
 * `source` + `kind`, the adapter previously spoke `provenance` + `type`).
 *
 * Skip contract: when no binary can be resolved (or $DRENYRA_ENGRAM_URL is
 * set but unreachable) the suite skips with an explicit message — CI without
 * the engine stays green.
 *
 * A dedicated test tenant ("integration-test") keeps the probes out of real
 * data; the tenant id is unique per run because the engine DB accumulates
 * between runs.
 *
 * No monetary fields exist in the observation model; Drenyra money values
 * are BigInt cents (repo-wide rule) and nothing here touches them.
 */

import { FiscalMemory } from "@drenyra/domain/fiscal-memory";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
	EngramClient,
	EngramFiscalMemoryRepository,
	EngramSessionStore,
} from "../index.js";
import {
	type EngramSidecar,
	startEngramSidecar,
} from "./helpers/engram-sidecar.js";

const RUC = "20123456789";
// Unique per run: the engine DB accumulates between runs, so a fixed
// tenant would make period/category queries return stale hits.
const TENANT = `integration-test-${Date.now()}`;

let sidecar: EngramSidecar | null = null;
let client: EngramClient | null = null;
let skipReason = "";

beforeAll(async () => {
	sidecar = await startEngramSidecar();
	if (!sidecar) {
		skipReason =
			"no drenyra-engram binary resolved (set DRENYRA_ENGRAM_BIN, add it to PATH, or set DRENYRA_ENGRAM_REPO)";
		return;
	}
	client = new EngramClient({ baseUrl: sidecar.baseUrl, timeoutMs: 1500 });
}, 60_000);

afterAll(async () => {
	await sidecar?.stop();
});

// Vitest has no dynamic describe.skip after beforeAll; gate each probe on the
// sidecar being up instead, with a single explicit skip message.
const run = (
	name: string,
	fn: (deps: {
		client: EngramClient;
		sidecar: EngramSidecar;
	}) => Promise<void> | void,
) => {
	it(name, async () => {
		if (!sidecar || !client) {
			throw new Error(
				`engram sidecar unavailable — ${skipReason || "start failed"}`,
			);
		}
		await fn({ client, sidecar });
	});
};

describe("engram live integration (automated sidecar)", () => {
	run(
		"session store: save -> search -> context round trip (company-level)",
		async ({ client }) => {
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
		},
	);

	run(
		"fiscal repo: save -> findById/findByPeriod/findByCategory/evidence/severity round trip",
		async ({ client }) => {
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
			expect((await repo.findByCategory(scope, "tax_decision"))[0]?.id).toBe(
				id,
			);
			expect(
				(await repo.findByEvidenceRef(scope, `evidence/it-${id}`))[0]?.id,
			).toBe(id);
			expect((await repo.findBySeverity(scope, "high"))[0]?.id).toBe(id);
		},
	);

	run(
		"scope isolation: another RUC never sees the test tenant's memory",
		async ({ client }) => {
			const otherRuc = await client.context({
				ruc: "20600995804",
				organizationId: TENANT,
			});
			expect(otherRuc).toHaveLength(0);
		},
	);

	run(
		"chain: full revision history for a fiscal topic key",
		async ({ client }) => {
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
		},
	);
});
