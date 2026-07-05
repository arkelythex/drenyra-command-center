import {
	DeleteObjectCommand,
	GetObjectCommand,
	PutObjectCommand,
	S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import type {
	IStorageService,
	UploadOptions,
} from "@drenyra/application/ports/storage.port";
import { StorageError } from "@drenyra/shared/errors";

/**
 * R2StorageService class.
 *
 * @example
 * ```ts
 * const value = new R2StorageService();
 * console.log(value);
 * ```
 */
export class R2StorageService implements IStorageService {
	private client: S3Client;
	private bucketName: string;
	private publicUrl: string;

	constructor() {
		const endpoint = process.env.R2_ENDPOINT;
		const accessKeyId = process.env.R2_ACCESS_KEY_ID;
		const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
		this.bucketName = process.env.R2_BUCKET_NAME || "";
		this.publicUrl = process.env.R2_PUBLIC_URL || "";

		if (!endpoint || !accessKeyId || !secretAccessKey || !this.bucketName) {
			throw new StorageError(
				"R2 configuration is incomplete. Check environment variables.",
			);
		}

		this.client = new S3Client({
			region: "auto",
			endpoint,
			credentials: {
				accessKeyId,
				secretAccessKey,
			},
		});
	}

	async upload(file: File | Buffer, options: UploadOptions): Promise<string> {
		try {
			const buffer =
				file instanceof File ? Buffer.from(await file.arrayBuffer()) : file;
			const key = `${options.folder}/${options.fileName}`;

			if (options.maxSizeBytes && buffer.length > options.maxSizeBytes) {
				throw new StorageError(
					`File size ${buffer.length} exceeds maximum ${options.maxSizeBytes} bytes`,
				);
			}

			await this.client.send(
				new PutObjectCommand({
					Bucket: this.bucketName,
					Key: key,
					Body: buffer,
					ContentType:
						options.contentType || this.getContentType(options.fileName),
				}),
			);

			return `${this.publicUrl}/${key}`;
		} catch (error) {
			if (error instanceof StorageError) throw error;
			throw new StorageError(
				`Failed to upload file: ${error instanceof Error ? error.message : "Unknown error"}`,
			);
		}
	}

	async delete(fileUrl: string): Promise<void> {
		try {
			const key = this.extractKeyFromUrl(fileUrl);

			await this.client.send(
				new DeleteObjectCommand({
					Bucket: this.bucketName,
					Key: key,
				}),
			);
		} catch (error) {
			throw new StorageError(
				`Failed to delete file: ${error instanceof Error ? error.message : "Unknown error"}`,
			);
		}
	}

	async getSignedUrl(fileUrl: string, expiresIn = 3600): Promise<string> {
		try {
			const key = this.extractKeyFromUrl(fileUrl);

			const command = new GetObjectCommand({
				Bucket: this.bucketName,
				Key: key,
			});

			return await getSignedUrl(this.client, command, { expiresIn });
		} catch (error) {
			throw new StorageError(
				`Failed to generate signed URL: ${error instanceof Error ? error.message : "Unknown error"}`,
			);
		}
	}

	private extractKeyFromUrl(fileUrl: string): string {
		return fileUrl.replace(`${this.publicUrl}/`, "");
	}

	private getContentType(fileName: string): string {
		const ext = fileName.split(".").pop()?.toLowerCase();
		const mimeTypes: Record<string, string> = {
			jpg: "image/jpeg",
			jpeg: "image/jpeg",
			png: "image/png",
			pdf: "application/pdf",
			xml: "application/xml",
		};
		return mimeTypes[ext || ""] || "application/octet-stream";
	}
}
