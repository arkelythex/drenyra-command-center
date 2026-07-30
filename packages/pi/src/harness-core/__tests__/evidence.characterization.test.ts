/**
 * Characterization tests for InMemoryEvidenceStore.
 *
 * These tests capture current behavior BEFORE migration to Pi SDK.
 * Evidence is a Drenyra domain concern that will be preserved.
 *
 * @module @drenyra/pi/harness-core
 */

import { describe, expect, it } from "vitest";
import { InMemoryEvidenceStore } from "../evidence";

describe("InMemoryEvidenceStore — characterization", () => {
	it("should save and retrieve an evidence record by id", async () => {
		const store = new InMemoryEvidenceStore();
		await store.save({
			id: "ev-1",
			runId: "run-1",
			type: "agent-result",
			content: { status: "done" },
			timestamp: new Date().toISOString(),
		});

		const record = await store.getById("ev-1");
		expect(record).not.toBeNull();
		expect(record?.id).toBe("ev-1");
		expect(record?.runId).toBe("run-1");
		expect(record?.content).toEqual({ status: "done" });
	});

	it("should return null for non-existent id", async () => {
		const store = new InMemoryEvidenceStore();
		expect(await store.getById("nonexistent")).toBeNull();
	});

	it("should query records by runId", async () => {
		const store = new InMemoryEvidenceStore();
		await store.save({
			id: "ev-1", runId: "run-1", type: "result",
			content: {}, timestamp: "2025-01-01T00:00:00Z",
		});
		await store.save({
			id: "ev-2", runId: "run-1", type: "approval",
			content: {}, timestamp: "2025-01-01T00:00:01Z",
		});
		await store.save({
			id: "ev-3", runId: "run-2", type: "result",
			content: {}, timestamp: "2025-01-01T00:00:02Z",
		});

		const results = await store.query({ runId: "run-1" });
		expect(results).toHaveLength(2);
	});

	it("should query records by type", async () => {
		const store = new InMemoryEvidenceStore();
		await store.save({
			id: "ev-1", runId: "run-1", type: "result",
			content: {}, timestamp: "2025-01-01T00:00:00Z",
		});
		await store.save({
			id: "ev-2", runId: "run-1", type: "approval",
			content: {}, timestamp: "2025-01-01T00:00:01Z",
		});

		const results = await store.query({ type: "approval" });
		expect(results).toHaveLength(1);
		expect(results[0].id).toBe("ev-2");
	});

	it("should sort results by timestamp descending", async () => {
		const store = new InMemoryEvidenceStore();
		await store.save({
			id: "old", runId: "run-1", type: "result",
			content: {}, timestamp: "2025-01-01T00:00:00Z",
		});
		await store.save({
			id: "new", runId: "run-1", type: "result",
			content: {}, timestamp: "2025-01-01T00:01:00Z",
		});

		const results = await store.query({ runId: "run-1" });
		expect(results[0].id).toBe("new");
		expect(results[1].id).toBe("old");
	});

	it("should limit query results", async () => {
		const store = new InMemoryEvidenceStore();
		for (let i = 0; i < 10; i++) {
			await store.save({
				id: `ev-${i}`, runId: "run-1", type: "result",
				content: {}, timestamp: `2025-01-01T00:00:0${i}Z`,
			});
		}

		const results = await store.query({ runId: "run-1", limit: 3 });
		expect(results).toHaveLength(3);
	});

	it("should delete records by runId", async () => {
		const store = new InMemoryEvidenceStore();
		await store.save({
			id: "ev-1", runId: "run-1", type: "result",
			content: {}, timestamp: "2025-01-01T00:00:00Z",
		});
		await store.save({
			id: "ev-2", runId: "run-1", type: "result",
			content: {}, timestamp: "2025-01-01T00:00:01Z",
		});
		await store.save({
			id: "ev-3", runId: "run-2", type: "result",
			content: {}, timestamp: "2025-01-01T00:00:02Z",
		});

		await store.deleteByRun("run-1");
		const remaining = await store.query({});
		expect(remaining).toHaveLength(1);
		expect(remaining[0].id).toBe("ev-3");
	});

	it("should deep-clone content on save and getById", async () => {
		const store = new InMemoryEvidenceStore();
		const content = { nested: { value: 42 } };

		await store.save({
			id: "ev-1", runId: "run-1", type: "test",
			content, timestamp: "2025-01-01T00:00:00Z",
		});

		// Mutate original
		content.nested.value = 99;

		const record = await store.getById("ev-1");
		expect(record?.content).toEqual({ nested: { value: 42 } }); // not mutated
	});

	it("should prune oldest records when over maxRecords limit", async () => {
		const store = new InMemoryEvidenceStore({ maxRecords: 3 });
		await store.save({
			id: "ev-1", runId: "run-1", type: "result",
			content: {}, timestamp: "2025-01-01T00:00:01Z",
		});
		await store.save({
			id: "ev-2", runId: "run-1", type: "result",
			content: {}, timestamp: "2025-01-01T00:00:02Z",
		});
		await store.save({
			id: "ev-3", runId: "run-1", type: "result",
			content: {}, timestamp: "2025-01-01T00:00:03Z",
		});
		await store.save({
			id: "ev-4", runId: "run-1", type: "result",
			content: {}, timestamp: "2025-01-01T00:00:04Z",
		});

		expect(store.count).toBe(3);
		// ev-1 was pruned
		expect(await store.getById("ev-1")).toBeNull();
	});
});
