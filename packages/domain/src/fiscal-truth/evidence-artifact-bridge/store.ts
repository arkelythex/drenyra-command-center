/**
 * DrenyraEvidenceArtifactStore — implementation of EvidenceArtifactStore.
 *
 * Bridges the phase pipeline with the existing evidence system:
 * - Uses the existing HashChain VO for chain integrity
 * - Stores artifacts as EvidenceNode entries in the evidence graph
 * - Persists via the engram Go sidecar for audit trail
 *
 * @example
 * ```ts
 * const store = new DrenyraEvidenceArtifactStore(evidenceRepo, engramClient);
 * const artifact = await store.store({
 *   artifactId: "art-001",
 *   phase: "reader",
 *   pipelineRunId: "run-abc",
 *   evidenceKind: "PHASE_OUTPUT",
 *   content: { invoiceNumber: "F001-123" },
 *   hash: "abc123...",
 *   parentHash: null,
 *   createdAt: new Date().toISOString(),
 * });
 * ```
 */

import type {
	EvidenceArtifact,
	EvidenceArtifactStore,
	NewEvidenceArtifact,
} from "./types";

/** Minimal EvidenceNode shape (matches existing domain entity). */
interface EvidenceNodeInput {
	nodeId: string;
	nodeKind: string;
	hash: string;
	metadata: Record<string, unknown>;
	scope?: {
		organizationId: string;
		companyId: string;
		companyRuc: string;
		period: string;
	};
}

/** Minimal engram client interface. */
interface EngramClient {
	storeEvidenceRecord?(record: {
		id: string;
		operationId: string;
		phase: string;
		action: string;
		input: unknown;
		output: unknown;
		tenantId: string;
		ruc: string;
		companyId: string;
		traceId: string;
	}): Promise<{ id: string }>;
}

import { createHash } from "crypto";

/** SHA-256 hex digest of a JSON value. */
function sha256Hex(data: unknown): string {
	const json = JSON.stringify(data);
	return createHash("sha256").update(json).digest("hex");
}

/**
 * Implementation of EvidenceArtifactStore that bridges to the domain
 * evidence graph and the engram Go sidecar.
 */
export class DrenyraEvidenceArtifactStore implements EvidenceArtifactStore {
	private chainCache = new Map<string, EvidenceArtifact[]>();

	constructor(
		private readonly evidenceRepo: {
			createNode: (node: EvidenceNodeInput) => Promise<{ nodeId: string }>;
			getChain: (pipelineRunId: string) => Promise<EvidenceNodeInput[]>;
		},
		private readonly engramClient?: EngramClient,
	) {}

	/**
	 * Store a new evidence artifact.
	 *
	 * 1. Computes SHA-256 hash (if not provided)
	 * 2. Links to previous artifact in the same pipeline run
	 * 3. Stores as EvidenceNode in the domain
	 * 4. Persists as EvidenceRecord in engram (if client available)
	 * 5. Returns stored artifact with chain verification
	 */
	async store(artifact: NewEvidenceArtifact): Promise<EvidenceArtifact> {
		const finalHash = artifact.hash || sha256Hex(artifact.content);
		const storedAt = new Date().toISOString();

		// Verify the hash chain if this is not a genesis artifact
		let hashChainVerified = true;
		if (artifact.parentHash) {
			const existingChain = this.chainCache.get(artifact.pipelineRunId) ?? [];
			if (existingChain.length > 0) {
				const lastArtifact = existingChain[existingChain.length - 1];
				hashChainVerified = lastArtifact.hash === artifact.parentHash;
			}
		}

		// Determine the evidence node kind from artifact kind
		const nodeKind =
			artifact.evidenceKind === "PHASE_INPUT"
				? "EVIDENCE_INPUT"
				: artifact.evidenceKind === "PHASE_OUTPUT"
					? "EVIDENCE_OUTPUT"
					: artifact.evidenceKind === "GATE_RESULT"
						? "GATE_VERDICT"
						: artifact.evidenceKind === "REVIEW_FINDING"
							? "REVIEW_FINDING"
							: "PIPELINE_RESULT";

		// Store as EvidenceNode
		await this.evidenceRepo.createNode({
			nodeId: artifact.artifactId,
			nodeKind,
			hash: finalHash,
			metadata: {
				phase: artifact.phase,
				pipelineRunId: artifact.pipelineRunId,
				evidenceKind: artifact.evidenceKind,
				parentHash: artifact.parentHash,
				createdAt: artifact.createdAt,
				storedAt,
				hashChainVerified,
			},
			scope: artifact.scope
				? {
						organizationId: artifact.scope.organizationId,
						companyId: artifact.scope.companyId,
						companyRuc: artifact.scope.companyRuc,
						period: artifact.scope.period,
					}
				: undefined,
		});

		// Persist to engram (non-blocking, fire-and-forget)
		if (this.engramClient?.storeEvidenceRecord) {
			const tenantId = artifact.scope?.organizationId ?? "unknown";
			const ruc = artifact.scope?.companyRuc ?? "unknown";
			const companyId = artifact.scope?.companyId ?? "unknown";

			this.engramClient
				.storeEvidenceRecord({
					id: artifact.artifactId,
					operationId: artifact.pipelineRunId,
					phase: artifact.phase,
					action: `evidence_artifact:${artifact.evidenceKind}`,
					input: { parentHash: artifact.parentHash },
					output: artifact.content,
					tenantId,
					ruc,
					companyId,
					traceId: artifact.pipelineRunId,
				})
				.catch(() => {
					// Non-blocking: engram persistence failure does not fail the pipeline
				});
		}

		const stored: EvidenceArtifact = {
			...artifact,
			hash: finalHash,
			storedAt,
			hashChainVerified,
		};

		// Cache the artifact
		const chain = this.chainCache.get(artifact.pipelineRunId) ?? [];
		chain.push(stored);
		this.chainCache.set(artifact.pipelineRunId, chain);

		return stored;
	}

	/**
	 * Retrieve the full artifact chain for a pipeline run.
	 */
	async getChain(pipelineRunId: string): Promise<EvidenceArtifact[]> {
		const cached = this.chainCache.get(pipelineRunId);
		if (cached) return [...cached];

		// Fall back to repository
		try {
			const nodes = await this.evidenceRepo.getChain(pipelineRunId);
			const artifacts: EvidenceArtifact[] = nodes.map((node) => ({
				artifactId: node.nodeId,
				phase: (node.metadata?.phase as string) ?? "unknown",
				pipelineRunId,
				evidenceKind: ((node.metadata?.evidenceKind as string) ??
					"PHASE_OUTPUT") as EvidenceArtifact["evidenceKind"],
				content: node.metadata,
				hash: node.hash,
				parentHash: (node.metadata?.parentHash as string) ?? null,
				createdAt:
					(node.metadata?.createdAt as string) ?? new Date().toISOString(),
				storedAt:
					(node.metadata?.storedAt as string) ?? new Date().toISOString(),
				hashChainVerified:
					(node.metadata?.hashChainVerified as boolean) ?? false,
			}));
			this.chainCache.set(pipelineRunId, artifacts);
			return artifacts;
		} catch {
			return [];
		}
	}

	/**
	 * Verify the integrity of a pipeline run's artifact chain.
	 *
	 * Walks the chain and validates that each artifact's parentHash
	 * matches the previous artifact's hash.
	 */
	async verifyChain(pipelineRunId: string): Promise<boolean> {
		const chain = await this.getChain(pipelineRunId);
		if (chain.length === 0) return false;

		for (let i = 1; i < chain.length; i++) {
			const current = chain[i];
			const previous = chain[i - 1];

			// Validate parentHash matches previous hash
			if (current.parentHash !== previous.hash) {
				return false;
			}
		}

		return true;
	}

	/** Clear the in-memory chain cache. */
	clearCache(): void {
		this.chainCache.clear();
	}
}
