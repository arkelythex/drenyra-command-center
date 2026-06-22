/**
 * ValidateDocumentDTO interface.
 *
 * @example
 * ```ts
 * const value: ValidateDocumentDTO = {} as ValidateDocumentDTO;
 * console.log(value);
 * ```
 */
export interface ValidateDocumentDTO {
	companyId: string;
	documentId: string;
	validatedBy: string;

	// Corrected data (if accountant made changes)
	correctedData?: {
		providerRUC?: string;
		providerName?: string;
		issueDate?: Date;
		totalAmount?: number;
		igvAmount?: number;
	};

	notes?: string;
}

/**
 * RejectDocumentDTO interface.
 *
 * @example
 * ```ts
 * const value: RejectDocumentDTO = {} as RejectDocumentDTO;
 * console.log(value);
 * ```
 */
export interface RejectDocumentDTO {
	companyId: string;
	documentId: string;
	rejectedBy: string;
	reason: string;
}
