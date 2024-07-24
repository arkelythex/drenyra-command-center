/**
 * Storage service port for uploading, deleting, and signing file URLs.
 *
 * @example
 * ```ts
 * const storage: IStorageService = getStorageService();
 * const url = await storage.upload(Buffer.from("hello"), { folder: "tmp", fileName: "hello.txt" });
 * const signed = await storage.getSignedUrl(url, 60, { organizationId: "org-1", companyId: "cmp-a" });
 * await storage.delete(url);
 * ```
 */
export interface IStorageService {
	upload(file: File | Buffer, options: UploadOptions): Promise<string>;
	delete(fileUrl: string): Promise<void>;
	/**
	 * Generate a signed URL bound to a specific tenant scope.
	 * When `scope` is provided, the URL path includes organizationId + companyId
	 * so the signed URL for tenant A cannot access tenant B data.
	 */
	getSignedUrl(
		fileUrl: string,
		expiresIn?: number,
		scope?: TenantScope,
	): Promise<string>;
}

/**
 * Tenant scope for signed URL operations.
 */
export interface TenantScope {
	organizationId: string;
	companyId: string;
}

/**
 * Upload options for {@link IStorageService.upload}.
 *
 * @example
 * ```ts
 * const options: UploadOptions = {
 *   folder: "documents",
 *   fileName: "invoice.pdf",
 *   contentType: "application/pdf",
 * };
 * ```
 */
export interface UploadOptions {
	folder: string;
	fileName: string;
	contentType?: string;
	maxSizeBytes?: number;
}
