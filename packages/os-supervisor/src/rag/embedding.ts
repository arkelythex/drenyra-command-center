/**
 * Embedding service — generates vector embeddings using Ollama.
 * Falls back to dummy vectors when Ollama is unavailable.
 */

const OLLAMA_URL = process.env.OLLAMA_URL ?? "http://localhost:11434";
const EMBEDDING_MODEL = process.env.EMBEDDING_MODEL ?? "nomic-embed-text";

let _modelAvailable = false;
let _checked = false;

export interface EmbeddingConfig {
	url?: string;
	model?: string;
}

/**
 * Generate an embedding vector for the given text.
 * Returns null if the embedding service is unavailable.
 */
export async function generateEmbedding(
	text: string,
	config?: EmbeddingConfig,
): Promise<number[] | null> {
	const url = config?.url ?? OLLAMA_URL;
	const model = config?.model ?? EMBEDDING_MODEL;

	try {
		const response = await fetch(`${url}/api/embeddings`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ model, prompt: text }),
			signal: AbortSignal.timeout(5000),
		});

		if (!response.ok) return null;

		const data = (await response.json()) as { embedding?: number[] };
		return data.embedding ?? null;
	} catch {
		return null;
	}
}

/**
 * Check if the embedding model is available.
 * Caches the result after first check.
 */
export async function isEmbeddingAvailable(
	config?: EmbeddingConfig,
): Promise<boolean> {
	if (_checked) return _modelAvailable;
	_checked = true;

	const url = config?.url ?? OLLAMA_URL;
	try {
		const response = await fetch(`${url}/api/tags`, {
			signal: AbortSignal.timeout(3000),
		});
		if (!response.ok) {
			_modelAvailable = false;
			return false;
		}

		const data = (await response.json()) as {
			models?: Array<{ name: string }>;
		};
		const model = config?.model ?? EMBEDDING_MODEL;
		_modelAvailable = data.models?.some((m) => m.name.includes(model)) ?? false;
		return _modelAvailable;
	} catch {
		_modelAvailable = false;
		return false;
	}
}

/** Reset cached availability (for testing) */
export function resetEmbeddingCache(): void {
	_checked = false;
	_modelAvailable = false;
}
