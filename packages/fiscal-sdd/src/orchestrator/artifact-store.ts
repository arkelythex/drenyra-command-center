/**
 * ArtifactStore — persistencia de artefactos de fase.
 *
 * Backends soportados:
 * - openspec: archivos JSON en disco (default)
 * - engram: memoria persistente (futuro)
 * - hybrid: ambos (futuro)
 * - none: en memoria (solo para tests)
 *
 * Los artefactos se organizan como:
 *   {basePath}/cambios/{changeId}/{fase}.json
 */

import { EngramArtifactStore } from "./artifact-store-engram";
import type {
	ArtifactStore,
	ArtifactStoreMode,
	FaseArtifact,
	FaseName,
} from "./types";

// ============================================================================
// In-Memory Store (para tests y modo none)
// ============================================================================

/**
 * ArtifactStore en memoria. Útil para tests y modo "none".
 * Los datos NO persisten entre reinicios.
 */
export class InMemoryArtifactStore implements ArtifactStore {
	private store = new Map<string, Map<FaseName, FaseArtifact>>();

	async save(changeId: string, artifact: FaseArtifact): Promise<void> {
		let change = this.store.get(changeId);
		if (!change) {
			change = new Map();
			this.store.set(changeId, change);
		}
		change.set(artifact.fase, artifact);
	}

	async load(changeId: string, fase: FaseName): Promise<FaseArtifact | null> {
		const change = this.store.get(changeId);
		if (!change) return null;
		return change.get(fase) ?? null;
	}

	async loadAll(changeId: string): Promise<Map<FaseName, FaseArtifact>> {
		return this.store.get(changeId) ?? new Map();
	}

	async listChanges(): Promise<string[]> {
		return Array.from(this.store.keys());
	}

	async healthCheck(): Promise<boolean> {
		return true;
	}
}

// ============================================================================
// OpenSpec File Store
// ============================================================================

/**
 * ArtifactStore que persiste artefactos como archivos JSON.
 *
 * Estructura en disco:
 *   {basePath}/
 *     cambios/
 *       {changeId}/
 *         solicitud.json
 *         analisis.json
 *         diseno.json
 *         plan.json
 *         migracion.json
 *         auditoria.json
 */
export class OpenSpecArtifactStore implements ArtifactStore {
	private fs: typeof import("fs/promises");
	private path: typeof import("path");

	constructor(private basePath: string) {
		// Lazy import para evitar errores en entornos browser
		try {
			this.fs = require("fs/promises");
			this.path = require("path");
		} catch {
			// Fallback: no filesystem available
			this.fs = null as unknown as typeof import("fs/promises");
			this.path = null as unknown as typeof import("path");
		}
	}

	async save(changeId: string, artifact: FaseArtifact): Promise<void> {
		if (!this.fs)
			throw new Error("Filesystem not available in this environment");

		const dir = this.path.join(this.basePath, "cambios", changeId);
		await this.fs.mkdir(dir, { recursive: true });
		await this.fs.writeFile(
			this.path.join(dir, `${artifact.fase}.json`),
			JSON.stringify(artifact, null, 2),
			"utf-8",
		);
	}

	async load(changeId: string, fase: FaseName): Promise<FaseArtifact | null> {
		if (!this.fs)
			throw new Error("Filesystem not available in this environment");

		try {
			const content = await this.fs.readFile(
				this.path.join(this.basePath, "cambios", changeId, `${fase}.json`),
				"utf-8",
			);
			return JSON.parse(content) as FaseArtifact;
		} catch {
			return null;
		}
	}

	async loadAll(changeId: string): Promise<Map<FaseName, FaseArtifact>> {
		if (!this.fs)
			throw new Error("Filesystem not available in this environment");

		const map = new Map<FaseName, FaseArtifact>();
		const dir = this.path.join(this.basePath, "cambios", changeId);

		try {
			const files = await this.fs.readdir(dir);
			for (const file of files) {
				if (!file.endsWith(".json")) continue;
				const fase = file.replace(".json", "") as FaseName;
				const artifact = await this.load(changeId, fase);
				if (artifact) map.set(fase, artifact);
			}
		} catch {
			// Directorio no existe
		}

		return map;
	}

	async listChanges(): Promise<string[]> {
		if (!this.fs)
			throw new Error("Filesystem not available in this environment");

		try {
			const dir = this.path.join(this.basePath, "cambios");
			const entries = await this.fs.readdir(dir, { withFileTypes: true });
			return entries.filter((e) => e.isDirectory()).map((e) => e.name);
		} catch {
			return [];
		}
	}

	async healthCheck(): Promise<boolean> {
		if (!this.fs) return false;

		try {
			const dir = this.path.join(this.basePath, "cambios");
			await this.fs.mkdir(dir, { recursive: true });
			return true;
		} catch {
			return false;
		}
	}
}

// ============================================================================
// Factory
// ============================================================================

/**
 * Crea un ArtifactStore según el modo especificado.
 */
export function createArtifactStore(
	mode: ArtifactStoreMode,
	basePath?: string,
): ArtifactStore {
	switch (mode) {
		case "openspec":
			return new OpenSpecArtifactStore(basePath ?? process.cwd());
		case "none":
			return new InMemoryArtifactStore();
		case "engram":
			return new EngramArtifactStore(basePath ?? "drenyra");
		case "hybrid":
			// Futura implementación: openspec + engram
			return new EngramArtifactStore(basePath ?? "drenyra");
		default:
			return new InMemoryArtifactStore();
	}
}
