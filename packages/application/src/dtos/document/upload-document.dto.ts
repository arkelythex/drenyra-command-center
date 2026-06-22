/**
 * UploadDocumentDTO interface.
 *
 * @example
 * ```ts
 * const value: UploadDocumentDTO = {} as UploadDocumentDTO;
 * console.log(value);
 * ```
 */
export interface UploadDocumentDTO {
	companyId: string;
	clientId: string;
	clientName: string;
	file: File | Buffer;
	fileName: string;
	fileType: "IMAGE" | "XML" | "PDF";
}

/**
 * UploadDocumentResponseDTO interface.
 *
 * @example
 * ```ts
 * const value: UploadDocumentResponseDTO = {} as UploadDocumentResponseDTO;
 * console.log(value);
 * ```
 */
export interface UploadDocumentResponseDTO {
	documentId: string;
	fileUrl: string;
	status: string;
}
