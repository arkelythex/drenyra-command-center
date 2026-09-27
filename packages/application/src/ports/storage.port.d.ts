export interface IStorageService {
    upload(file: File | Buffer, options: UploadOptions): Promise<string>;
    delete(fileUrl: string): Promise<void>;
    getSignedUrl(fileUrl: string, expiresIn?: number, scope?: TenantScope): Promise<string>;
}
export interface TenantScope {
    organizationId: string;
    companyId: string;
}
export interface UploadOptions {
    folder: string;
    fileName: string;
    contentType?: string;
    maxSizeBytes?: number;
}
//# sourceMappingURL=storage.port.d.ts.map