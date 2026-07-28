import { createHash } from "node:crypto";
import { db } from "@drenyra/persistence/client";
import { and, desc, eq } from "@drenyra/persistence/query";
import { sireEvidenceEdges, sireEvidenceNodes } from "@drenyra/persistence/schema";

/**
 * Node type variants for evidence_nodes.type.
 */
export type EvidenceNodeType = "DerivedArtifact";

/**
 * Edge type variants for evidence_edges.edge_type.
 */
export type EvidenceEdgeType = "derived_from" | "supersedes";

/**
 * Deterministic JSON serializer — sorted keys, no whitespace.
 * Ensures the same logical object always produces the same JSON string
 * regardless of property insertion order.
 */
function stableStringify(obj: unknown): string {
	if (obj === null || typeof obj !== "object") {
		return JSON.stringify(obj);
	}
	if (Array.isArray(obj)) {
		return `[${obj.map(stableStringify).join(",")}]`;
	}
	const sorted = Object.keys(obj as Record<string, unknown>)
		.sort()
		.reduce(
			(acc, key) => {
				acc[key] = (obj as Record<string, unknown>)[key];
				return acc;
			},
			{} as Record<string, unknown>,
		);
	return `{${Object.entries(sorted)
		.map(([k, v]) => `${JSON.stringify(k)}:${stableStringify(v)}`)
		.join(",")}}`;
}

export interface ComputeHashInput {
	previousHash: string;
	canonicalPayload: unknown;
}

export interface CreateDerivedArtifactInput {
	artifactId: string;
	period: string;
	companyId: string;
	canonicalPayload: unknown;
	sourceNodeIds: string[];
}

export interface GetPreviousHashInput {
	companyId: string;
	period: string;
	type: EvidenceNodeType;
}

export class SireEvidenceService {
	/**
	 * Computes SHA-256 hash chain link for a new evidence node.
	 *
	 * hash = SHA-256(previousHash + artifactHash)
	 * where artifactHash = SHA-256(stableJSON(canonicalPayload))
	 *
	 * Uses deterministic JSON serialization (sorted keys, no whitespace)
	 * so the same logical payload always produces the same hash.
	 */
	static computeHash(input: ComputeHashInput): string {
		const artifactHash = createHash("sha256")
			.update(stableStringify(input.canonicalPayload))
			.digest("hex");
		return createHash("sha256")
			.update(input.previousHash + artifactHash)
			.digest("hex");
	}

	/**
	 * Retrieves the hash of the most recent evidence node for the given scope.
	 * Returns empty string when no previous node exists (genesis).
	 */
	static async getPreviousHash(input: GetPreviousHashInput): Promise<string> {
		const rows = await db
			.select({ hash: sireEvidenceNodes.hash })
			.from(sireEvidenceNodes)
			.where(
				and(
					eq(sireEvidenceNodes.companyId, input.companyId),
					eq(sireEvidenceNodes.period, input.period),
					eq(sireEvidenceNodes.type, input.type),
				),
			)
			.orderBy(desc(sireEvidenceNodes.createdAt))
			.limit(1);

		return rows[0]?.hash ?? "";
	}

	/**
	 * Creates a DerivedArtifact evidence node with `derived_from` edges
	 * linking to source document nodes. All operations run in a single transaction.
	 *
	 * Returns the new node's id and hash.
	 */
	static async createDerivedArtifactNode(
		input: CreateDerivedArtifactInput,
	): Promise<{ nodeId: string; hash: string }> {
		return db.transaction(async (tx) => {
			const previousHash = await (async () => {
				const rows = await tx
					.select({ hash: sireEvidenceNodes.hash })
					.from(sireEvidenceNodes)
					.where(
						and(
							eq(sireEvidenceNodes.companyId, input.companyId),
							eq(sireEvidenceNodes.period, input.period),
							eq(sireEvidenceNodes.type, "DerivedArtifact"),
						),
					)
					.orderBy(desc(sireEvidenceNodes.createdAt))
					.limit(1);
				return rows[0]?.hash ?? "";
			})();

			const hash = SireEvidenceService.computeHash({
				previousHash,
				canonicalPayload: input.canonicalPayload,
			});

			const [node] = await tx
				.insert(sireEvidenceNodes)
				.values({
					type: "DerivedArtifact",
					artifactId: input.artifactId,
					period: input.period,
					companyId: input.companyId,
					hash,
					previousHash: previousHash || null,
				})
				.returning({ id: sireEvidenceNodes.id });

			for (const sourceId of input.sourceNodeIds) {
				await tx.insert(sireEvidenceEdges).values({
					fromNodeId: node.id,
					toNodeId: sourceId,
					edgeType: "derived_from",
				});
			}

			return { nodeId: node.id, hash };
		});
	}

	/**
	 * Creates a superseding evidence node for a correction.
	 * The new node links to the previous node with a `supersedes` edge.
	 * The previous node remains unchanged (append-only).
	 */
	static async createSupersedingNode(input: {
		previousNodeId: string;
		artifactId: string;
		period: string;
		companyId: string;
		canonicalPayload: unknown;
	}): Promise<{ nodeId: string; hash: string }> {
		return db.transaction(async (tx) => {
			// Fetch the previous node's hash to continue the chain
			const [prevNode] = await tx
				.select({ hash: sireEvidenceNodes.hash })
				.from(sireEvidenceNodes)
				.where(eq(sireEvidenceNodes.id, input.previousNodeId))
				.limit(1);

			if (!prevNode) {
				throw new Error(
					`Previous evidence node ${input.previousNodeId} not found`,
				);
			}

			const hash = SireEvidenceService.computeHash({
				previousHash: prevNode.hash,
				canonicalPayload: input.canonicalPayload,
			});

			const [node] = await tx
				.insert(sireEvidenceNodes)
				.values({
					type: "DerivedArtifact",
					artifactId: input.artifactId,
					period: input.period,
					companyId: input.companyId,
					hash,
					previousHash: prevNode.hash,
				})
				.returning({ id: sireEvidenceNodes.id });

			await tx.insert(sireEvidenceEdges).values({
				fromNodeId: node.id,
				toNodeId: input.previousNodeId,
				edgeType: "supersedes",
			});

			return { nodeId: node.id, hash };
		});
	}

	/**
	 * Retrieves a single evidence node by ID.
	 */
	static async getNode(nodeId: string) {
		const rows = await db
			.select()
			.from(sireEvidenceNodes)
			.where(eq(sireEvidenceNodes.id, nodeId))
			.limit(1);

		return rows[0] ?? null;
	}

	/**
	 * Retrieves the full hash chain for a given scope.
	 * Returns nodes ordered chronologically (oldest first).
	 */
	static async getChain(input: {
		companyId: string;
		period: string;
		type: EvidenceNodeType;
	}) {
		return db
			.select()
			.from(sireEvidenceNodes)
			.where(
				and(
					eq(sireEvidenceNodes.companyId, input.companyId),
					eq(sireEvidenceNodes.period, input.period),
					eq(sireEvidenceNodes.type, input.type),
				),
			)
			.orderBy(sireEvidenceNodes.createdAt);
	}
}
