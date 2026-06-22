/**
 * Storage service port for uploading, deleting, and signing file URLs.
 *
 * @example
 * ```ts
 * const storage: IStorageService = getStorageService();
 * const url = await storage.upload(Buffer.from("hello"), { folder: "tmp", fileName: "hello.txt" });
 * const signed = await storage.getSignedUrl(url, 60);
 * await storage.delete(url);
 * ```
 */
export interface IStorageService {
	upload(file: File | Buffer, options: UploadOptions): Promise<string>;
	delete(fileUrl: string): Promise<void>;
	getSignedUrl(fileUrl: string, expiresIn?: number): Promise<string>;
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
