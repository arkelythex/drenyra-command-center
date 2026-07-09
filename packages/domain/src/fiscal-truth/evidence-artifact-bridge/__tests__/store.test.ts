/**
 * Tests for DrenyraEvidenceArtifactStore
 */

import { beforeEach, describe, expect, it } from "vitest";
import { DrenyraEvidenceArtifactStore } from "../store";
import type { NewEvidenceArtifact } from "../types";

/** Helper to create a test artifact. */
function makeArtifact(
	overrides: Partial<NewEvidenceArtifact> = {},
): NewEvidenceArtifact {
	return {
		artifactId: overrides.artifactId ?? `art-${Date.now()}`,
		phase: overrides.phase ?? "reader",
		pipelineRunId: overrides.pipelineRunId ?? "test-run-001",
		evidenceKind: overrides.evidenceKind ?? "PHASE_OUTPUT",
		content: overrides.content ?? { invoiceNumber: "F001-123" },
		hash: overrides.hash ?? "",
		parentHash: overrides.parentHash ?? null,
		createdAt: overrides.createdAt ?? new Date().toISOString(),
		...(overrides.scope ? { scope: overrides.scope } : {}),
	};
}

describe("DrenyraEvidenceArtifactStore", () => {
	let store: DrenyraEvidenceArtifactStore;
	const storedNodes: Array<{
		nodeId: string;
		nodeKind: string;
		hash: string;
		metadata: Record<string, unknown>;
	}> = [];

	const mockRepo = {
		createNode: async (node: {
			nodeId: string;
			nodeKind: string;
			hash: string;
			metadata: Record<string, unknown>;
		}) => {
			storedNodes.push(node);
			return { nodeId: node.nodeId };
		},
		getChain: async (pipelineRunId: string) => {
			return storedNodes
				.filter((n) => (n.metadata.pipelineRunId as string) === pipelineRunId)
				.map((n) => ({
					nodeId: n.nodeId,
					nodeKind: n.nodeKind,
					hash: n.hash,
					metadata: n.metadata,
				}));
		},
	};

	beforeEach(() => {
		storedNodes.length = 0;
		store = new DrenyraEvidenceArtifactStore(mockRepo);
		store.clearCache();
	});

	describe("store", () => {
		it("stores a new artifact and returns it with hash chain data", async () => {
			const input = makeArtifact({ hash: "abc123def456" });
			const result = await store.store(input);

			expect(result.artifactId).toBe(input.artifactId);
			expect(result.hash).toBe("abc123def456");
			expect(result.storedAt).toBeDefined();
			expect(result.hashChainVerified).toBe(true);
			expect(storedNodes).toHaveLength(1);
			expect(storedNodes[0].nodeKind).toBe("EVIDENCE_OUTPUT");
		});

		it("chains artifacts within the same pipeline run", async () => {
			const first = makeArtifact({
				artifactId: "art-001",
				pipelineRunId: "chain-run",
				hash: "aaaa",
				parentHash: null,
			});
			const second = makeArtifact({
				artifactId: "art-002",
				pipelineRunId: "chain-run",
				hash: "bbbb",
				parentHash: "aaaa",
			});

			await store.store(first);
			const result = await store.store(second);

			expect(result.hashChainVerified).toBe(true);
			expect(storedNodes).toHaveLength(2);
		});

		it("detects broken hash chain", async () => {
			const first = makeArtifact({
				artifactId: "art-001",
				pipelineRunId: "broken-chain",
				hash: "aaaa",
				parentHash: null,
			});
			const second = makeArtifact({
				artifactId: "art-002",
				pipelineRunId: "broken-chain",
				hash: "bbbb",
				parentHash: "cccc",
			});

			await store.store(first);
			const result = await store.store(second);

			expect(result.hashChainVerified).toBe(false);
		});

		it("maps evidence kinds to node kinds correctly", async () => {
			const input = makeArtifact({
				artifactId: "gate-artifact",
				evidenceKind: "GATE_RESULT",
			});
			await store.store(input);
			expect(storedNodes[0].nodeKind).toBe("GATE_VERDICT");
		});
	});

	describe("getChain", () => {
		it("returns artifacts in insertion order", async () => {
			await store.store(
				makeArtifact({
					artifactId: "a",
					pipelineRunId: "get-chain-run",
					hash: "a1",
				}),
			);
			await store.store(
				makeArtifact({
					artifactId: "b",
					pipelineRunId: "get-chain-run",
					hash: "b1",
					parentHash: "a1",
				}),
			);

			const chain = await store.getChain("get-chain-run");
			expect(chain).toHaveLength(2);
			expect(chain[0].artifactId).toBe("a");
			expect(chain[1].artifactId).toBe("b");
		});

		it("returns empty array for unknown runs", async () => {
			const chain = await store.getChain("non-existent");
			expect(chain).toHaveLength(0);
		});
	});

	describe("verifyChain", () => {
		it("returns true for a valid chain", async () => {
			await store.store(
				makeArtifact({
					artifactId: "v1",
					pipelineRunId: "verify-run",
					hash: "hash1",
					parentHash: null,
				}),
			);
			await store.store(
				makeArtifact({
					artifactId: "v2",
					pipelineRunId: "verify-run",
					hash: "hash2",
					parentHash: "hash1",
				}),
			);
			await store.store(
				makeArtifact({
					artifactId: "v3",
					pipelineRunId: "verify-run",
					hash: "hash3",
					parentHash: "hash2",
				}),
			);

			expect(await store.verifyChain("verify-run")).toBe(true);
		});

		it("returns false for a broken chain", async () => {
			await store.store(
				makeArtifact({
					artifactId: "v1",
					pipelineRunId: "bad-verify",
					hash: "hash1",
					parentHash: null,
				}),
			);
			await store.store(
				makeArtifact({
					artifactId: "v2",
					pipelineRunId: "bad-verify",
					hash: "hash2",
					parentHash: "WRONG",
				}),
			);

			expect(await store.verifyChain("bad-verify")).toBe(false);
		});

		it("returns false for an empty chain", async () => {
			expect(await store.verifyChain("empty-run")).toBe(false);
		});
	});
});
