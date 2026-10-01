/**
 * EngramArtifactStore — persiste artefactos de fase en Engram (memoria persistente).
 *
 * Usa el protocolo de Engram para guardar artefactos como observaciones
 * con topic keys. Esto permite:
 * - Reanudar pipelines entre sesiones del agente
 * - Auditoría hash-chain de artefactos
 * - Cross-session recovery
 *
 * @example
 * ```ts
 * const store = new EngramArtifactStore("drenyra");
 * await store.save("cambio-001", artifact);
 * const loaded = await store.load("cambio-001", "solicitud");
 * ```
 */

import type { ArtifactStore, FaseArtifact, FaseName } from "./types";

// ============================================================================
// Engram client helper
// ============================================================================

interface EngramObservation {
	id: number;
	title: string;
	type: string;
	content: string;
	topic_key?: string;
	project?: string;
}

/**
 * Cliente Engram mínimo — usa fetch contra el servidor HTTP de Engram.
 * En producción, usar el MCP tool o SDK oficial.
 */
class EngramClient {
	private baseUrl: string;

	constructor(private project: string) {
		this.baseUrl = "http://127.0.0.1:7437";
	}

	/**
	 * Busca observaciones por topic key.
	 */
	async search(topicKey: string): Promise<EngramObservation[]> {
		try {
			const response = await fetch(
				`${this.baseUrl}/api/observations/search?project=${encodeURIComponent(this.project)}&query=${encodeURIComponent(topicKey)}`,
			);
			if (!response.ok) return [];
			const data = await response.json();
			return Array.isArray(data) ? data : (data?.observations ?? []);
		} catch {
			return [];
		}
	}

	/**
	 * Guarda una observación.
	 */
	async save(
		title: string,
		content: string,
		topicKey: string,
	): Promise<{ id?: number; status: string }> {
		try {
			const response = await fetch(`${this.baseUrl}/api/observations`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					title,
					content,
					type: "architecture",
					project: this.project,
					topic_key: topicKey,
					scope: "project",
				}),
			});
			if (!response.ok) return { status: "error" };
			const data = await response.json();
			return { id: data.id, status: "saved" };
		} catch {
			return { status: "error" };
		}
	}

	/**
	 * Health check.
	 */
	async healthCheck(): Promise<boolean> {
		try {
			const response = await fetch(`${this.baseUrl}/api/health`);
			return response.ok;
		} catch {
			return false;
		}
	}
}

// ============================================================================
// EngramArtifactStore
// ============================================================================

const TOPIC_PREFIX = "sdd";

/**
 * ArtifactStore que persiste en Engram.
 *
 * Los artefactos se guardan como observaciones con topic key:
 *   sdd/{changeId}/{fase}
 *
 * La lista de cambios se guarda en:
 *   sdd/{changeId}/state
 */
export class EngramArtifactStore implements ArtifactStore {
	private client: EngramClient;

	constructor(project: string = "drenyra") {
		this.client = new EngramClient(project);
	}

	async save(changeId: string, artifact: FaseArtifact): Promise<void> {
		const topicKey = `${TOPIC_PREFIX}/${changeId}/${artifact.fase}`;
		const title = `${changeId}/${artifact.fase}: ${artifact.status}`;

		await this.client.save(title, JSON.stringify(artifact, null, 2), topicKey);
	}

	async load(changeId: string, fase: FaseName): Promise<FaseArtifact | null> {
		const topicKey = `${TOPIC_PREFIX}/${changeId}/${fase}`;
		const observations = await this.client.search(topicKey);

		if (observations.length === 0) return null;

		try {
			return JSON.parse(observations[0].content) as FaseArtifact;
		} catch {
			return null;
		}
	}

	async loadAll(changeId: string): Promise<Map<FaseName, FaseArtifact>> {
		const map = new Map<FaseName, FaseArtifact>();
		const fases: FaseName[] = [
			"solicitud",
			"analisis",
			"diseno",
			"plan",
			"migracion",
			"auditoria",
		];

		for (const fase of fases) {
			const artifact = await this.load(changeId, fase);
			if (artifact) map.set(fase, artifact);
		}

		return map;
	}

	async listChanges(): Promise<string[]> {
		const observations = await this.client.search(TOPIC_PREFIX);
		const changes = new Set<string>();

		for (const obs of observations) {
			if (obs.topic_key?.startsWith(TOPIC_PREFIX)) {
				const parts = obs.topic_key.split("/");
				if (parts.length >= 2) {
					changes.add(parts[1]);
				}
			}
		}

		return Array.from(changes);
	}

	async healthCheck(): Promise<boolean> {
		return this.client.healthCheck();
	}
}
