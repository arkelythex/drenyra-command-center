export interface IStorageService {
	upload(file: File | Buffer, options: UploadOptions): Promise<string>;
	delete(fileUrl: string): Promise<void>;
	getSignedUrl(fileUrl: string, expiresIn?: number): Promise<string>;
}
export interface UploadOptions {
	folder: string;
	fileName: string;
	contentType?: string;
	maxSizeBytes?: number;
}
//# sourceMappingURL=storage.port.d.ts.map
