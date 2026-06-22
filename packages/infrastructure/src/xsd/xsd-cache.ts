/**
 * XSD Cache
 *
 * Singleton in-memory cache for parsed UBL 2.1 XSD schemas.
 * Loads all XSD files at initialization, parses them, and resolves
 * cross-file references. Makes schemas available by namespace or
 * document type (Invoice / CreditNote).
 *
 * Design:
 * - Lazy loading: schemas are loaded on first access
 * - All schemas share a single namespace map for resolution
 * - Thread-safe for read operations (immutable after loading)
 */

import { existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { XsdSchemaLoader } from "./xsd-schema-loader";
import type { XsdSchema, DocumentType } from "./types";
import { XSD_FILE_NAMESPACE_MAP } from "./types";

export class XsdCache {
	private loader: XsdSchemaLoader;
	private schemas: Map<string, XsdSchema> | null = null;
	private loadError: Error | null = null;
	private loaded = false;

	constructor(xsdDir: string) {
		this.loader = new XsdSchemaLoader(xsdDir);
	}

	/**
	 * Initialize the cache by loading all XSD files.
	 * Returns true if schemas were loaded successfully.
	 */
	initialize(): boolean {
		if (this.loaded) return true;

		try {
			this.schemas = this.loader.loadAllSchemas();
			this.loaded = true;
			return true;
		} catch (error) {
			this.loadError = error instanceof Error ? error : new Error(String(error));
			this.loaded = false;
			return false;
		}
	}

	/**
	 * Get schema by namespace URI.
	 */
	getSchemaByNamespace(namespace: string): XsdSchema | undefined {
		if (!this.ensureLoaded()) return undefined;
		return this.schemas?.get(namespace);
	}

	/**
	 * Get the main document schema for a document type (Invoice/CreditNote).
	 */
	getSchemaForDocument(docType: DocumentType): XsdSchema | undefined {
		if (!this.ensureLoaded()) return undefined;
		return this.loader.getSchemaForDocumentType(docType, this.schemas ?? new Map());
	}

	/**
	 * Get all loaded schemas.
	 */
	getAllSchemas(): Map<string, XsdSchema> {
		if (!this.ensureLoaded()) return new Map();
		return this.schemas ?? new Map();
	}

	/**
	 * Get the load error if initialization failed.
	 */
	getLoadError(): Error | null {
		return this.loadError;
	}

	/**
	 * Check if cache was loaded successfully.
	 */
	isLoaded(): boolean {
		return this.loaded;
	}

	/**
	 * Reset cache and force re-load on next access.
	 */
	reset(): void {
		this.schemas = null;
		this.loadError = null;
		this.loaded = false;
		this.loader.clearCache();
	}

	/**
	 * Get the list of available XSD file names.
	 */
	static getAvailableXsdFiles(xsdDir: string): string[] {
		return Object.keys(XSD_FILE_NAMESPACE_MAP).filter((fileName) => {
			return existsSync(resolve(xsdDir, fileName));
		});
	}

	private ensureLoaded(): boolean {
		if (!this.loaded) {
			return this.initialize();
		}
		return true;
	}
}

/**
 * Resolve the default XSD directory path relative to this source file.
 * Uses import.meta.dirname (Bun/Node 21+) with fallback for ESM compatibility.
 */
function resolveDefaultXsdDir(): string {
	try {
		// Bun supports import.meta.dirname natively
		if (typeof import.meta.dirname === "string") {
			return resolve(import.meta.dirname, "ubl21");
		}
	} catch {
		// Fallback
	}
	try {
		// Node ESM fallback
		const filename = fileURLToPath(import.meta.url);
		return resolve(dirname(filename), "ubl21");
	} catch {
		// Last resort: relative from cwd
		return resolve(process.cwd(), "packages/infrastructure/src/xsd/ubl21");
	}
}

/**
 * Default XSD directory path (relative to infrastructure package).
 */
export const DEFAULT_XSD_DIR = resolveDefaultXsdDir();

/**
 * Global singleton cache instance.
 * Initialized lazily on first access.
 */
let globalCache: XsdCache | null = null;

/**
 * Get or create the global XSD cache instance.
 * @param xsdDir Optional custom XSD directory path
 */
export function getXsdCache(xsdDir?: string): XsdCache {
	if (!globalCache) {
		globalCache = new XsdCache(xsdDir ?? DEFAULT_XSD_DIR);
	}
	return globalCache;
}

/**
 * Reset the global cache (useful for testing).
 */
export function resetXsdCache(): void {
	if (globalCache) {
		globalCache.reset();
	}
	globalCache = null;
}
