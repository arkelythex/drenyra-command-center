import { drizzleDocumentStore } from "./infrastructure/drizzle-document-store.adapter";
import type {
	DocumentFilters,
	DocumentResponseDTO,
	DocumentRow,
	DocumentStorePort,
	SaveDocumentInput,
} from "./ports/document-store.port";

export type {
	DocumentFilters,
	DocumentResponseDTO,
	DocumentRow,
	DocumentStorePort,
	SaveDocumentInput,
} from "./ports/document-store.port";

/**
 * documentStore const.
 *
 * @example
 * ```ts
 * console.log(documentStore);
 * ```
 */
export const documentStore: DocumentStorePort = drizzleDocumentStore;

// Backward-compatible facade while handlers/tests migrate to explicit ports/adapters.
/**
 * saveDocumentToDB operation.
 *
 * @param doc - Input for doc.
 * @returns Result of saveDocumentToDB.
 * @example
 * ```ts
 * const result = await saveDocumentToDB({} as SaveDocumentInput);
 * console.log(result);
 * ```
 */
export async function saveDocumentToDB(doc: SaveDocumentInput): Promise<void> {
	return documentStore.save(doc);
}

/**
 * updateDocumentInDB operation.
 *
 * @param id - Input for id.
 * @param updates - Input for updates.
 * @returns Result of updateDocumentInDB.
 * @example
 * ```ts
 * const result = await updateDocumentInDB("", {} as Record);
 * console.log(result);
 * ```
 */
export async function updateDocumentInDB(
	id: string,
	updates: Record<string, unknown>,
): Promise<void> {
	return documentStore.update(id, updates);
}

/**
 * getDocumentFromDB operation.
 *
 * @param id - Input for id.
 * @returns Result of getDocumentFromDB.
 * @example
 * ```ts
 * const result = await getDocumentFromDB("");
 * console.log(result);
 * ```
 */
export async function getDocumentFromDB(
	id: string,
): Promise<DocumentRow | undefined> {
	return documentStore.getById(id);
}

/**
 * listDocumentsFromDB operation.
 *
 * @param filters - Input for filters.
 * @returns Result of listDocumentsFromDB.
 * @example
 * ```ts
 * const result = await listDocumentsFromDB({} as DocumentFilters);
 * console.log(result);
 * ```
 */
export async function listDocumentsFromDB(
	filters: DocumentFilters,
): Promise<DocumentRow[]> {
	return documentStore.list(filters);
}

/**
 * mapToResponseDTO operation.
 *
 * @param dbDoc - Input for dbDoc.
 * @returns Result of mapToResponseDTO.
 * @example
 * ```ts
 * const result = mapToResponseDTO({} as DocumentRow);
 * console.log(result);
 * ```
 */
export function mapToResponseDTO(dbDoc: DocumentRow): DocumentResponseDTO {
	return documentStore.toResponseDTO(dbDoc);
}
