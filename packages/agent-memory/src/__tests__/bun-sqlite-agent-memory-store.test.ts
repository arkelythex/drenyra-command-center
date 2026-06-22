import { mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { afterEach, describe, expect, it } from "vitest";
import { AGENT_MEMORY_TYPE } from "../types";
import { BunSqliteAgentMemoryStore } from "../bun-sqlite-agent-memory-store";

const scope = {
	tenantId: "tenant-1",
	organizationId: "org-1",
	companyId: "company-1",
	ruc: "20123456789",
};

describe("BunSqliteAgentMemoryStore", () => {
	let tempDir: string | undefined;

	afterEach(async () => {
		if (tempDir === undefined) return;
		await rm(tempDir, { recursive: true, force: true });
		tempDir = undefined;
	});

	async function createStore() {
		tempDir = await mkdtemp(join(tmpdir(), "agent-memory-"));
		return BunSqliteAgentMemoryStore.create({
			path: join(tempDir, "memory.sqlite"),
		});
	}

	it("persists scoped memories across store instances", async () => {
		const first = await createStore();

		await first.save({
			agentId: "finance",
			sessionId: "session-1",
			scope,
			type: AGENT_MEMORY_TYPE.FACT,
			content: "SUNAT validation found invoice F001-1 ready for SIRE review",
			metadata: { tags: ["sunat", "sire"], confidence: 0.91 },
		});
		first.close();

		const second = await BunSqliteAgentMemoryStore.create({
			path: join(tempDir ?? "", "memory.sqlite"),
		});
		const results = await second.search({ text: "SIRE", scope });

		expect(results).toHaveLength(1);
		expect(results[0]?.record.content).toContain("F001-1");
		expect(results[0]?.record.metadata.tags).toEqual(["sunat", "sire"]);
		second.close();
	});

	it("does not leak memories across tenant scope", async () => {
		const store = await createStore();

		await store.save({
			agentId: "finance",
			scope,
			type: AGENT_MEMORY_TYPE.FACT,
			content: "tenant one cashflow anomaly",
			metadata: { tags: ["cashflow"] },
		});
		await store.save({
			agentId: "finance",
			scope: { ...scope, tenantId: "tenant-2" },
			type: AGENT_MEMORY_TYPE.FACT,
			content: "tenant two cashflow anomaly",
			metadata: { tags: ["cashflow"] },
		});

		const results = await store.search({ text: "cashflow", scope });

		expect(results.map((result) => result.record.content)).toEqual([
			"tenant one cashflow anomaly",
		]);
		store.close();
	});
});
