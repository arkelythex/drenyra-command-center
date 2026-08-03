/**
 * Live verification: Registrar -> Consultar against the REAL engram sidecar.
 *
 * Exercises the exact production path of the fiscal-memory loop:
 *   1. FiscalMemory.create + repository.save  (what EngramFiscalMemoryRecorder does on approval)
 *   2. repository.findByPeriod / findByCategory / findById (what the read side serves)
 *   3. Scope isolation check (different RUC must not see it)
 *
 * Run with: bun scripts/verify-fiscal-memory-live.ts
 * Requires: drenyra-engram serving on localhost:8733 (docker compose up -d drenyra-engram).
 */

import { FiscalMemory } from "@drenyra/domain/fiscal-memory";
import {
	EngramClient,
	EngramFiscalMemoryRepository,
	engramConfig,
} from "@drenyra/memory";

const RUC = "20123456789";
const OTHER_RUC = "20601234567";
const PERIOD = "2026-07";
const MEMORY_ID = `verify-mc-${Date.now()}`;

async function main() {
	const client = new EngramClient(engramConfig());
	const repo = new EngramFiscalMemoryRepository(client);

	const health = await client.health();
	console.log("1. sidecar health:", JSON.stringify(health).slice(0, 120));

	// ── Registrar (what the PR #152 recorder does on approval) ──
	const memory = FiscalMemory.create({
		id: MEMORY_ID,
		tenantId: "api",
		companyId: RUC,
		ruc: RUC,
		period: PERIOD,
		category: "monthly_closing",
		severity: "high",
		title: `Monthly close ${PERIOD} (live verify)`,
		summary: "Live end-to-end verification of the fiscal-memory loop",
		evidenceRefs: ["evidence/inv-live-1"],
		tags: ["monthly-close", "high", "live-verify"],
		createdBy: "pi-live-verify",
		sourceAgentId: "mission-live-verify",
	});
	await repo.save(memory);
	console.log(
		`2. saved fiscal memory ${MEMORY_ID} (ruc=${RUC}, period=${PERIOD})`,
	);

	// ── Consultar (what the read side serves) ──
	const byPeriod = await repo.findByPeriod(
		{ tenantId: "api", companyId: RUC, ruc: RUC },
		PERIOD,
	);
	const found = byPeriod.find((m) => m.id === MEMORY_ID);
	console.log(
		`3. findByPeriod(${PERIOD}) -> ${byPeriod.length} memories, ours found: ${found !== undefined}`,
	);

	const byCategory = await repo.findByCategory(
		{ tenantId: "api", companyId: RUC, ruc: RUC },
		"monthly_closing",
	);
	console.log(
		`4. findByCategory(monthly_closing) -> ${byCategory.length} memories, ours found: ${byCategory.some((m) => m.id === MEMORY_ID)}`,
	);

	const byId = await repo.findById(MEMORY_ID, {
		tenantId: "api",
		companyId: RUC,
		ruc: RUC,
	});
	console.log(
		`5. findById -> ${byId ? `found (period=${byId.period}, severity=${byId.severity}, evidence=${byId.evidenceRefs.join(",")})` : "MISSING"}`,
	);

	// ── Scope isolation: a different RUC must NOT see it ──
	const otherScope = await repo.findByPeriod(
		{ tenantId: "api", companyId: OTHER_RUC, ruc: OTHER_RUC },
		PERIOD,
	);
	const leaked = otherScope.some((m) => m.id === MEMORY_ID);
	console.log(
		`6. scope isolation: other RUC (${OTHER_RUC}) sees ours? ${leaked} (must be false)`,
	);

	const pass =
		found !== undefined &&
		byId !== null &&
		byId.category === "monthly_closing" &&
		byId.evidenceRefs.includes("evidence/inv-live-1") &&
		!leaked;

	console.log(
		pass ? "\n✅ FISCAL-MEMORY LOOP LIVE: PASS" : "\n❌ LOOP LIVE: FAIL",
	);
	process.exit(pass ? 0 : 1);
}

main().catch((error) => {
	console.error("❌ live verify failed:", error);
	process.exit(1);
});
