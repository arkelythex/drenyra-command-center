/**
 * Direct E2E validation of the engram sidecar harness + the real adapter stack
 * (@drenyra/memory EngramClient + EngramFiscalMemoryRepository), run with Bun:
 *
 *   DRENYRA_ENGRAM_BIN=/path/to/drenyra-engram bun run scripts/verify-engram-e2e.ts
 *
 * This is the cross-repo journey the vitest suite automates: start the sidecar
 * (compiled on demand from the sibling drenyra-engram checkout), wait for
 * health, then exercise save -> search -> context -> chain through the real
 * HTTP surface, and tear the sidecar down.
 */

import { FiscalMemory } from "@drenyra/domain/fiscal-memory";
import {
	EngramClient,
	EngramFiscalMemoryRepository,
	EngramSessionStore,
} from "@drenyra/memory";
import { startEngramSidecar } from "../packages/memory/src/__tests__/helpers/engram-sidecar.ts";

const RUC = "20123456789";
const TENANT = `e2e-direct-${Date.now()}`;

const sidecar = await startEngramSidecar();
if (!sidecar) {
	throw new Error("no drenyra-engram binary resolved — set DRENYRA_ENGRAM_BIN");
}
console.log(`sidecar up at ${sidecar.baseUrl}`);

const client = new EngramClient({ baseUrl: sidecar.baseUrl, timeoutMs: 2000 });

try {
	const health = await client.health();
	if (typeof health.schemaVersion !== "number" || health.schemaVersion < 1) {
		throw new Error(`bad schemaVersion ${health.schemaVersion}`);
	}
	console.log("health OK, schemaVersion", health.schemaVersion);

	// Session store: save -> search round trip.
	const session = new EngramSessionStore(client);
	await session.save({
		agentId: "e2e",
		sessionId: `e2e-${Date.now()}`,
		scope: { tenantId: TENANT, ruc: RUC },
		type: "mission_result",
		content: "E2E direct mission completed cleanly",
		metadata: { ruc: RUC, tenantId: TENANT },
	});
	const found = await session.search({
		text: "E2E direct mission",
		scope: { tenantId: TENANT, metadata: { ruc: RUC } },
	});
	if (found.length < 1) throw new Error("session search returned nothing");
	console.log(`session save->search OK (${found.length} hit(s))`);

	// Fiscal repo: save -> findById -> chain (two revisions).
	const repo = new EngramFiscalMemoryRepository(client);
	const id = `fm-e2e-${Date.now()}`;
	const mk = (summary: string) =>
		FiscalMemory.create({
			id,
			tenantId: TENANT,
			companyId: "comp-e2e",
			ruc: RUC,
			period: "2026-07",
			category: "tax_decision",
			severity: "high",
			title: "E2E retention criteria",
			summary,
			evidenceRefs: [`evidence/e2e-${id}`],
			tags: ["e2e"],
			createdBy: "e2e-runner",
			sourceAgentId: "e2e-agent",
		});
	await repo.save(mk("v1"));
	await repo.save(mk("v2"));

	const scope = { tenantId: TENANT, companyId: "comp-e2e", ruc: RUC };
	const byId = await repo.findById(id, scope);
	if (byId?.severity !== "high") throw new Error("findById failed");
	const byPeriod = await repo.findByPeriod(scope, "2026-07");
	if (byPeriod.length !== 1)
		throw new Error(`findByPeriod len ${byPeriod.length}`);
	const chain = await client.chain({
		topicKey: `fiscal-memory/${id}`,
		ruc: RUC,
		organizationId: TENANT,
	});
	if (chain.length < 2) throw new Error(`chain len ${chain.length}`);
	if (chain[chain.length - 1].content.why !== "v2")
		throw new Error("chain head not v2");
	console.log(
		`fiscal repo save->findById->chain OK (${chain.length} revisions, head v2)`,
	);

	// Scope isolation: a different RUC never sees this tenant.
	const other = await client.context({
		ruc: "20600995804",
		organizationId: TENANT,
	});
	if (other.length !== 0) throw new Error(`cross-tenant leak: ${other.length}`);
	console.log("cross-tenant isolation OK");

	console.log("E2E DIRECT: ALL CHECKS PASSED");
} finally {
	await sidecar.stop();
	console.log("sidecar stopped");
}
