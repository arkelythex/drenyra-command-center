import { randomUUID } from "node:crypto";
import { QdrantClient } from "@qdrant/js-client-rest";
import { traceRagQuery } from "../telemetry/operations.js";
import { generateEmbedding, isEmbeddingAvailable } from "./embedding.js";
import type { IRagStore } from "./in-memory-rag-store.js";
import type {
	OSKnowledgeNamespace,
	OSRagDocument,
	OSRagQuery,
	OSRagSearchResult,
} from "./types.js";

const DUMMY_VECTOR_DIM = 1;
const DUMMY_VECTOR: number[] = [0];

function collectionName(namespace: OSKnowledgeNamespace): string {
	return `os_${namespace}`;
}

function scoreDocument(content: string, query: string): number {
	const lower = query.toLowerCase();
	const words = lower.split(/\s+/).filter(Boolean);
	if (words.length === 0) return 0;

	const contentLower = content.toLowerCase();
	let matches = 0;
	for (const word of words) {
		if (contentLower.includes(word)) matches++;
	}
	return matches / words.length;
}

export interface QdrantRagStoreConfig {
	/** Qdrant server URL. Defaults to http://localhost:6333 */
	url?: string;
	/** Optional API key for Qdrant Cloud */
	apiKey?: string;
	/** Default: 5 seconds */
	timeoutMs?: number;
	/** Ollama URL for embeddings. Defaults to http://localhost:11434 */
	ollamaUrl?: string;
	/** Embedding model. Defaults to nomic-embed-text */
	embeddingModel?: string;
}

export class QdrantRagStore implements IRagStore {
	private client: QdrantClient;
	private ready = false;
	private embeddingUrl?: string;
	private embeddingModel?: string;
	private usingRealVectors = false;

	constructor(config: QdrantRagStoreConfig = {}) {
		this.client = new QdrantClient({
			url: config.url ?? "http://localhost:6333",
			apiKey: config.apiKey,
			timeout: config.timeoutMs ?? 5000,
		});
		this.embeddingUrl = config.ollamaUrl;
		this.embeddingModel = config.embeddingModel;
	}

	/**
	 * Ensure collections exist for all namespaces.
	 */
	async ensureCollections(): Promise<void> {
		if (this.ready) return;

		const { OSKnowledgeNamespace: Namespace } = await import("./types.js");
		const namespaces = Object.values(Namespace) as OSKnowledgeNamespace[];

		for (const ns of namespaces) {
			const name = collectionName(ns);
			const exists = await this.client.collectionExists(name);
			if (!exists.exists) {
				await this.client.createCollection(name, {
					vectors: {
						size: DUMMY_VECTOR_DIM,
						distance: "Cosine",
					},
				});
				await this.client.createPayloadIndex(name, {
					field_name: "namespace",
					field_schema: "keyword",
				});
			}
		}

		// Check if real embeddings are available
		this.usingRealVectors = await isEmbeddingAvailable({
			url: this.embeddingUrl,
			model: this.embeddingModel,
		});

		this.ready = true;
	}

	/**
	 * Check if Qdrant is reachable.
	 */
	async isAvailable(): Promise<boolean> {
		try {
			await this.client.getCollections();
			return true;
		} catch {
			return false;
		}
	}

	/**
	 * Check if real embeddings are available.
	 */
	isUsingRealVectors(): boolean {
		return this.usingRealVectors;
	}

	async index(doc: OSRagDocument): Promise<string> {
		await this.ensureCollections();
		const id = doc.id ?? randomUUID();

		// Try to generate real embedding
		let vector = DUMMY_VECTOR;
		if (this.usingRealVectors) {
			const embedding = await generateEmbedding(doc.content, {
				url: this.embeddingUrl,
				model: this.embeddingModel,
			});
			if (embedding) {
				vector = embedding;
			}
		}

		// For dummy vectors, we need to recreate collection with correct dims
		// if switching from dummy to real vectors
		if (vector.length !== DUMMY_VECTOR_DIM && this.usingRealVectors) {
			// Recreate collection with correct vector size
			const name = collectionName(doc.namespace);
			try {
				await this.client.deleteCollection(name);
			} catch {
				// Ignore if doesn't exist
			}
			await this.client.createCollection(name, {
				vectors: {
					size: vector.length,
					distance: "Cosine",
				},
			});
			await this.client.createPayloadIndex(name, {
				field_name: "namespace",
				field_schema: "keyword",
			});
		}

		await this.client.upsert(collectionName(doc.namespace), {
			wait: true,
			points: [
				{
					id,
					vector,
					payload: {
						namespace: doc.namespace,
						source: doc.source,
						title: doc.title,
						content: doc.content,
						category: doc.category ?? null,
						vertical: doc.vertical ?? null,
						metadata: doc.metadata ?? {},
					},
				},
			],
		});

		return id;
	}

	async query(q: OSRagQuery): Promise<OSRagSearchResult[]> {
		return traceRagQuery(q.namespace ?? "all", async () => {
			await this.ensureCollections();

			const results: OSRagSearchResult[] = [];

			const { OSKnowledgeNamespace: Namespace } = await import("./types.js");
			const namespaces = q.namespace
				? [q.namespace]
				: (Object.values(Namespace) as OSKnowledgeNamespace[]);

			if (this.usingRealVectors) {
				// Use Qdrant search API with real embeddings
				const queryVector = await generateEmbedding(q.query, {
					url: this.embeddingUrl,
					model: this.embeddingModel,
				});

				if (queryVector) {
					for (const ns of namespaces) {
						const name = collectionName(ns);
						const exists = await this.client.collectionExists(name);
						if (!exists.exists) continue;

						try {
							const searchResult = await this.client.search(name, {
								vector: queryVector,
								limit: q.limit ?? 5,
								filter: {
									must: [{ key: "namespace", match: { value: ns } }],
								},
								with_payload: true,
							});

							for (const point of searchResult) {
								const payload = point.payload as
									| Record<string, unknown>
									| undefined;
								if (!payload?.content) continue;
								results.push({
									id: String(point.id),
									namespace: ns,
									source: String(payload.source ?? ""),
									title: String(payload.title ?? ""),
									content: String(payload.content),
									category: payload.category ? String(payload.category) : null,
									score: point.score ?? 0,
								});
							}
						} catch {
							// Fall through to keyword search
						}
					}

					results.sort((a, b) => b.score - a.score);
					return results.slice(0, q.limit ?? 5);
				}
			}

			// Fallback: keyword scoring via scroll (same as InMemoryRagStore)
			for (const ns of namespaces) {
				const name = collectionName(ns);
				const exists = await this.client.collectionExists(name);
				if (!exists.exists) continue;

				let offset: string | number | undefined;
				let hasMore = true;

				while (hasMore) {
					const scrollResult = await this.client.scroll(name, {
						filter: {
							must: [{ key: "namespace", match: { value: ns } }],
						},
						limit: 100,
						offset,
					});

					const points = scrollResult.points ?? [];
					for (const point of points) {
						const payload = point.payload as
							| Record<string, unknown>
							| undefined;
						if (!payload?.content) continue;
						const content = String(payload.content);
						const score = scoreDocument(content, q.query);
						if (score >= (q.minScore ?? 0.01)) {
							results.push({
								id: String(point.id),
								namespace: ns,
								source: String(payload.source ?? ""),
								title: String(payload.title ?? ""),
								content,
								category: payload.category ? String(payload.category) : null,
								score,
							});
						}
					}

					if (scrollResult.next_page_offset !== undefined) {
						offset = scrollResult.next_page_offset as
							| string
							| number
							| undefined;
					} else {
						hasMore = false;
					}
				}
			}

			results.sort((a, b) => b.score - a.score);
			const limit = q.limit ?? 5;
			return results.slice(0, limit);
		});
	}

	async remove(namespace: OSKnowledgeNamespace, id: string): Promise<boolean> {
		await this.ensureCollections();
		const name = collectionName(namespace);

		const exists = await this.client.collectionExists(name);
		if (!exists.exists) return false;

		try {
			await this.client.delete(name, {
				wait: true,
				points: [id],
			});
			return true;
		} catch {
			return false;
		}
	}

	async list(namespace?: OSKnowledgeNamespace): Promise<OSRagSearchResult[]> {
		await this.ensureCollections();

		const results: OSRagSearchResult[] = [];
		const { OSKnowledgeNamespace: Namespace } = await import("./types.js");
		const namespaces = namespace
			? [namespace]
			: (Object.values(Namespace) as OSKnowledgeNamespace[]);

		for (const ns of namespaces) {
			const name = collectionName(ns);
			const exists = await this.client.collectionExists(name);
			if (!exists.exists) continue;

			let offset: string | number | undefined;
			let hasMore = true;

			while (hasMore) {
				const scrollResult = await this.client.scroll(name, {
					filter: {
						must: [{ key: "namespace", match: { value: ns } }],
					},
					limit: 100,
					offset,
				});

				const points = scrollResult.points ?? [];
				for (const point of points) {
					const payload = point.payload as Record<string, unknown> | undefined;
					if (!payload?.content) continue;
					results.push({
						id: String(point.id),
						namespace: ns,
						source: String(payload.source ?? ""),
						title: String(payload.title ?? ""),
						content: String(payload.content),
						category: payload.category ? String(payload.category) : null,
						score: 1,
					});
				}

				if (scrollResult.next_page_offset !== undefined) {
					offset = scrollResult.next_page_offset as string | number | undefined;
				} else {
					hasMore = false;
				}
			}
		}

		return results;
	}

	async clear(): Promise<void> {
		await this.ensureCollections();

		const { OSKnowledgeNamespace: Namespace } = await import("./types.js");
		const namespaces = Object.values(Namespace) as OSKnowledgeNamespace[];

		for (const ns of namespaces) {
			const name = collectionName(ns);
			const exists = await this.client.collectionExists(name);
			if (!exists.exists) continue;

			await this.client.delete(name, {
				wait: true,
				filter: {},
			});
		}
	}

	async close(): Promise<void> {
		this.ready = false;
		this.usingRealVectors = false;
	}
}
