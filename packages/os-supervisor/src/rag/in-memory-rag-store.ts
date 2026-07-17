import type {
	OSKnowledgeNamespace,
	OSRagDocument,
	OSRagQuery,
	OSRagSearchResult,
} from "./types.js";

let _nextId = 1;
function nextId(): string {
	return `rag_${String(_nextId++).padStart(4, "0")}`;
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

export interface IRagStore {
	index(doc: OSRagDocument): Promise<string>;
	query(q: OSRagQuery): Promise<OSRagSearchResult[]>;
	remove(namespace: OSKnowledgeNamespace, id: string): Promise<boolean>;
	list(namespace?: OSKnowledgeNamespace): Promise<OSRagSearchResult[]>;
	clear(): Promise<void>;
}

export class InMemoryRagStore implements IRagStore {
	private docs: Map<string, OSRagDocument> = new Map();

	async index(doc: OSRagDocument): Promise<string> {
		const id = doc.id ?? nextId();
		this.docs.set(id, { ...doc, id });
		return id;
	}

	async query(q: OSRagQuery): Promise<OSRagSearchResult[]> {
		const results: OSRagSearchResult[] = [];
		for (const [id, doc] of this.docs) {
			if (q.namespace && doc.namespace !== q.namespace) continue;
			const score = scoreDocument(doc.content, q.query);
			if (score >= (q.minScore ?? 0.01)) {
				results.push({
					id,
					namespace: doc.namespace,
					source: doc.source,
					title: doc.title,
					content: doc.content,
					category: doc.category ?? null,
					score,
				});
			}
		}
		results.sort((a, b) => b.score - a.score);
		const limit = q.limit ?? 5;
		return results.slice(0, limit);
	}

	async remove(namespace: OSKnowledgeNamespace, id: string): Promise<boolean> {
		const doc = this.docs.get(id);
		if (!doc || doc.namespace !== namespace) return false;
		return this.docs.delete(id);
	}

	async list(namespace?: OSKnowledgeNamespace): Promise<OSRagSearchResult[]> {
		const results: OSRagSearchResult[] = [];
		for (const [id, doc] of this.docs) {
			if (namespace && doc.namespace !== namespace) continue;
			results.push({
				id,
				namespace: doc.namespace,
				source: doc.source,
				title: doc.title,
				category: doc.category ?? null,
				content: doc.content,
				score: 1,
			});
		}
		return results;
	}

	async clear(): Promise<void> {
		this.docs.clear();
	}
}
