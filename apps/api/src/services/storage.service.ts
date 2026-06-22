/**
 * Storage Service - Multi-Provider File Storage
 *
 * Supports:
 * - Cloudflare R2 (S3-compatible, recommended for production)
 * - Supabase Storage (alternative for existing Supabase users)
 * - Local filesystem (development only)
 *
 * @since Phase 1 - Documents Feature Implementation
 */

import type { S3Client } from "@aws-sdk/client-s3";
import { createLogger } from "../lib/logger";

// ============================================
// CONFIGURATION
// ============================================

type StorageProvider = "r2" | "supabase" | "local";

interface SupabaseStorageClient {
	storage: {
		from(bucket: string): {
			upload(
				key: string,
				body: Buffer,
				options: { contentType: string; upsert: boolean },
			): Promise<{ error: { message: string } | null }>;
			getPublicUrl(key: string): { data: { publicUrl: string } };
			createSignedUrl(
				key: string,
				expiresIn: number,
			): Promise<{
				data: { signedUrl: string };
				error: { message: string } | null;
			}>;
			remove(keys: string[]): Promise<{ error: { message: string } | null }>;
		};
	};
}

const STORAGE_PROVIDER = (process.env.STORAGE_PROVIDER ||
	"r2") as StorageProvider;

// Cloudflare R2 Configuration
const R2_ENDPOINT = process.env.R2_ENDPOINT || "";
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID || "";
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY || "";
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || "arkelythex-documents";
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL || ""; // Optional CDN URL

// Supabase Storage Configuration
const SUPABASE_URL = process.env.SUPABASE_URL || "";
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || "";
const SUPABASE_BUCKET_NAME = process.env.SUPABASE_BUCKET_NAME || "documents";
const logger = createLogger({ module: "services/storage" });

// ============================================
// R2 CLIENT (S3-Compatible)
// ============================================

let r2Client: S3Client | null = null;

async function getR2Client(): Promise<S3Client> {
	if (STORAGE_PROVIDER !== "r2") {
		throw new Error("R2 client requested while STORAGE_PROVIDER is not 'r2'");
	}

	if (!r2Client) {
		if (!R2_ENDPOINT || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) {
			throw new Error(
				"Missing R2 configuration. Set R2_ENDPOINT, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY",
			);
		}

		const { S3Client } = await import("@aws-sdk/client-s3");

		r2Client = new S3Client({
			region: "auto",
			endpoint: R2_ENDPOINT,
			credentials: {
				accessKeyId: R2_ACCESS_KEY_ID,
				secretAccessKey: R2_SECRET_ACCESS_KEY,
			},
		});

		logger.info({ provider: "r2" }, "Initialized Cloudflare R2 client");
	}

	if (!r2Client) {
		throw new Error("Failed to initialize R2 client");
	}

	return r2Client;
}

// ============================================
// SUPABASE CLIENT
// ============================================

let supabaseClient: SupabaseStorageClient | null = null;

async function getSupabaseClient(): Promise<SupabaseStorageClient> {
	if (STORAGE_PROVIDER !== "supabase") {
		throw new Error(
			"Supabase client requested while STORAGE_PROVIDER is not 'supabase'",
		);
	}

	if (!supabaseClient) {
		if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
			throw new Error(
				"Missing Supabase configuration. Set SUPABASE_URL, SUPABASE_SERVICE_KEY",
			);
		}

		// Dynamic import to avoid bundling if not used.
		const { createClient } = await import("@supabase/supabase-js");
		supabaseClient = createClient(
			SUPABASE_URL,
			SUPABASE_SERVICE_KEY,
		) as SupabaseStorageClient;

		logger.info(
			{ provider: "supabase" },
			"Initialized Supabase Storage client",
		);
	}

	if (!supabaseClient) {
		throw new Error("Failed to initialize Supabase Storage client");
	}

	return supabaseClient;
}

// ============================================
// STORAGE INTERFACE
// ============================================

export interface UploadOptions {
	organizationId?: number;
	companyId?: string;
	folder?: string;
	contentType?: string;
	isPublic?: boolean;
}

export interface UploadResult {
	url: string;
	key: string;
	bucket: string;
	size: number;
}

// ============================================
// STORAGE SERVICE
// ============================================

export class StorageService {
	/**
	 * Upload file to storage
	 */
	async upload(file: File, options: UploadOptions): Promise<UploadResult> {
		const {
			organizationId,
			companyId,
			folder = "documents",
			contentType,
			isPublic = false,
		} = options;
		const tenantKey =
			companyId?.trim() ||
			(typeof organizationId === "number" ? String(organizationId) : "");

		if (!tenantKey) {
			throw new Error("Storage upload requires companyId or organizationId");
		}

		// Generate storage key
		const timestamp = Date.now();
		const randomSuffix = Math.random().toString(36).substring(2, 9);
		const sanitizedFilename = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
		const key = `${folder}/${tenantKey}/${timestamp}-${randomSuffix}-${sanitizedFilename}`;

		logger.info(
			{
				key,
				provider: STORAGE_PROVIDER,
				isPublic,
				size: file.size,
			},
			"Uploading file to storage provider",
		);

		switch (STORAGE_PROVIDER) {
			case "r2":
				return await this.uploadToR2(file, key, contentType, isPublic);
			case "supabase":
				return await this.uploadToSupabase(file, key, contentType, isPublic);
			case "local":
				return await this.uploadToLocal(file, key);
			default:
				throw new Error(`Unsupported storage provider: ${STORAGE_PROVIDER}`);
		}
	}

	/**
	 * Get signed URL for private file access
	 */
	async getSignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
		logger.info(
			{
				expiresIn,
				key,
				provider: STORAGE_PROVIDER,
			},
			"Generating signed URL for storage object",
		);

		switch (STORAGE_PROVIDER) {
			case "r2":
				return await this.getR2SignedUrl(key, expiresIn);
			case "supabase":
				return await this.getSupabaseSignedUrl(key, expiresIn);
			case "local":
				return `http://localhost:3001/storage/${key}`;
			default:
				throw new Error(`Unsupported storage provider: ${STORAGE_PROVIDER}`);
		}
	}

	/**
	 * Delete file from storage
	 */
	async delete(key: string): Promise<void> {
		logger.info(
			{
				key,
				provider: STORAGE_PROVIDER,
			},
			"Deleting file from storage provider",
		);

		switch (STORAGE_PROVIDER) {
			case "r2":
				return await this.deleteFromR2(key);
			case "supabase":
				return await this.deleteFromSupabase(key);
			case "local":
				return await this.deleteFromLocal(key);
			default:
				throw new Error(`Unsupported storage provider: ${STORAGE_PROVIDER}`);
		}
	}

	// ============================================
	// R2 IMPLEMENTATION
	// ============================================

	private async uploadToR2(
		file: File,
		key: string,
		contentType?: string,
		isPublic?: boolean,
	): Promise<UploadResult> {
		const client = await getR2Client();
		const buffer = Buffer.from(await file.arrayBuffer());
		const { PutObjectCommand } = await import("@aws-sdk/client-s3");

		const command = new PutObjectCommand({
			Bucket: R2_BUCKET_NAME,
			Key: key,
			Body: buffer,
			ContentType: contentType || file.type || "application/octet-stream",
			ContentLength: file.size,
			...(isPublic && { ACL: "public-read" }),
		});

		await client.send(command);

		// Construct public URL
		const url = R2_PUBLIC_URL
			? `${R2_PUBLIC_URL}/${key}`
			: `${R2_ENDPOINT}/${R2_BUCKET_NAME}/${key}`;

		return {
			url,
			key,
			bucket: R2_BUCKET_NAME,
			size: file.size,
		};
	}

	private async getR2SignedUrl(
		key: string,
		expiresIn: number,
	): Promise<string> {
		const client = await getR2Client();
		const { GetObjectCommand } = await import("@aws-sdk/client-s3");
		const { getSignedUrl } = await import("@aws-sdk/s3-request-presigner");

		const command = new GetObjectCommand({
			Bucket: R2_BUCKET_NAME,
			Key: key,
		});

		return await getSignedUrl(client, command, { expiresIn });
	}

	private async deleteFromR2(key: string): Promise<void> {
		const client = await getR2Client();
		const { DeleteObjectCommand } = await import("@aws-sdk/client-s3");

		const command = new DeleteObjectCommand({
			Bucket: R2_BUCKET_NAME,
			Key: key,
		});

		await client.send(command);
	}

	// ============================================
	// SUPABASE IMPLEMENTATION
	// ============================================

	private async uploadToSupabase(
		file: File,
		key: string,
		contentType?: string,
		isPublic: boolean = false,
	): Promise<UploadResult> {
		const client = await getSupabaseClient();
		const buffer = Buffer.from(await file.arrayBuffer());

		const { error } = await client.storage
			.from(SUPABASE_BUCKET_NAME)
			.upload(key, buffer, {
				contentType: contentType || file.type || "application/octet-stream",
				upsert: false,
			});

		if (error) {
			throw new Error(`Supabase upload failed: ${error.message}`);
		}

		const url = isPublic
			? client.storage.from(SUPABASE_BUCKET_NAME).getPublicUrl(key).data
					.publicUrl
			: await this.getSupabaseSignedUrl(key, 3600);

		return {
			url,
			key,
			bucket: SUPABASE_BUCKET_NAME,
			size: file.size,
		};
	}

	private async getSupabaseSignedUrl(
		key: string,
		expiresIn: number,
	): Promise<string> {
		const client = await getSupabaseClient();

		const { data, error } = await client.storage
			.from(SUPABASE_BUCKET_NAME)
			.createSignedUrl(key, expiresIn);

		if (error) {
			throw new Error(`Failed to generate signed URL: ${error.message}`);
		}

		return data.signedUrl;
	}

	private async deleteFromSupabase(key: string): Promise<void> {
		const client = await getSupabaseClient();

		const { error } = await client.storage
			.from(SUPABASE_BUCKET_NAME)
			.remove([key]);

		if (error) {
			throw new Error(`Supabase delete failed: ${error.message}`);
		}
	}

	// ============================================
	// LOCAL FILESYSTEM IMPLEMENTATION (Dev Only)
	// ============================================

	private async uploadToLocal(file: File, key: string): Promise<UploadResult> {
		logger.warn(
			{
				key,
				size: file.size,
			},
			"Using local filesystem storage; not for production",
		);

		// TODO: Implement local file write using Bun.write()
		// For now, return mock URL
		return {
			url: `http://localhost:3001/storage/${key}`,
			key,
			bucket: "local",
			size: file.size,
		};
	}

	private async deleteFromLocal(_key: string): Promise<void> {
		logger.warn("Delete from local filesystem is not implemented");
		// TODO: Implement Bun.fs delete
	}
}

// ============================================
// SINGLETON INSTANCE
// ============================================

export const storageService = new StorageService();

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Validate storage configuration on startup
 */
export function validateStorageConfig(): boolean {
	logger.info(
		{ provider: STORAGE_PROVIDER },
		"Validating storage configuration",
	);

	switch (STORAGE_PROVIDER) {
		case "r2":
			if (!R2_ENDPOINT || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) {
				logger.error({ provider: "r2" }, "Missing R2 configuration");
				return false;
			}
			logger.info(
				{
					bucket: R2_BUCKET_NAME,
					provider: "r2",
				},
				"R2 storage configured",
			);
			return true;

		case "supabase":
			if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
				logger.error(
					{ provider: "supabase" },
					"Missing Supabase configuration",
				);
				return false;
			}
			logger.info(
				{
					bucket: SUPABASE_BUCKET_NAME,
					provider: "supabase",
				},
				"Supabase storage configured",
			);
			return true;

		case "local":
			logger.warn(
				{ provider: "local" },
				"Using local filesystem storage; not for production",
			);
			return true;

		default:
			logger.error({ provider: STORAGE_PROVIDER }, "Invalid storage provider");
			return false;
	}
}

/**
 * Get file extension from filename
 */
export function getFileExtension(filename: string): string {
	return filename.split(".").pop()?.toLowerCase() || "";
}

/**
 * Detect MIME type from extension
 */
export function getMimeType(filename: string): string {
	const ext = getFileExtension(filename);

	const mimeTypes: Record<string, string> = {
		pdf: "application/pdf",
		xml: "text/xml",
		jpg: "image/jpeg",
		jpeg: "image/jpeg",
		png: "image/png",
		txt: "text/plain",
	};

	return mimeTypes[ext] || "application/octet-stream";
}
