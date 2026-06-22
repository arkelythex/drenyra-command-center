import type { TenantScopeInput } from "../handlers/tenant-scope";
import type { InferSelectModel } from "drizzle-orm";
import { documents } from "@arkelythex/persistence/schema";

/**
 * DocumentFilters interface.
 *
 * @example
 * ```ts
 * const value: DocumentFilters = {} as DocumentFilters;
 * console.log(value);
 * ```
 */
export interface DocumentFilters {
	companyId?: string;
	organizationId?: number;
	status?: string;
	search?: string;
	limit?: number;
	offset?: number;
}

/**
 * SaveDocumentInput interface.
 *
 * @example
 * ```ts
 * const value: SaveDocumentInput = {} as SaveDocumentInput;
 * console.log(value);
 * ```
 */
export interface SaveDocumentInput {
	id: string;
	organization_id?: number | null;
	company_id?: string | null;
	client_id?: string | null;
	client_name?: string;
	file_name: string;
	file_url: string;
	file_type: string;
	file_size: number;
	status?: string;
	created_at?: Date;
	updated_at?: Date;
}

/**
 * DocumentRow type.
 *
 * @example
 * ```ts
 * const value: DocumentRow = {} as DocumentRow;
 * console.log(value);
 * ```
 */
export type DocumentRow = InferSelectModel<typeof documents>;

/**
 * DocumentResponseDTO interface.
 *
 * @example
 * ```ts
 * const value: DocumentResponseDTO = {} as DocumentResponseDTO;
 * console.log(value);
 * ```
 */
export interface DocumentResponseDTO {
	id: string;
	companyId?: string | null;
	clientId: string;
	clientName: string;
	fileName: string;
	fileUrl: string;
	fileType: string;
	fileSize: number;
	status: string;
	confidenceLevel?: string | null;
	extractedData?: unknown;
	validatedBy?: string | null;
	validatedAt?: string;
	validationNotes?: string | null;
	rejectionReason?: string | null;
	rejectedBy?: string | null;
	rejectedAt?: string;
	uploadedAt?: string;
	processedAt?: string;
}

/**
 * DocumentStorePort interface.
 *
 * @example
 * ```ts
 * const value: DocumentStorePort = {} as DocumentStorePort;
 * console.log(value);
 * ```
 */
export interface DocumentStorePort {
	save(doc: SaveDocumentInput): Promise<void>;
	update(
		id: string,
		updates: Record<string, unknown>,
		scope?: TenantScopeInput,
	): Promise<void>;
	getById(id: string, scope?: TenantScopeInput): Promise<DocumentRow | undefined>;
	list(filters: DocumentFilters): Promise<DocumentRow[]>;
	toResponseDTO(row: DocumentRow): DocumentResponseDTO;
}
