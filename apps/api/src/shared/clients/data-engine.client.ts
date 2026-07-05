/**
 * Data Engine Client - Communication with Python/Polars microservice.
 *
 * The Data Engine is a separate Python service (port 8000) that handles
 * heavy data processing tasks using Polars (Rust-accelerated dataframes).
 *
 * **Architecture:**
 * - Hexagonal Architecture: This client is an adapter (port)
 * - Backend: Python + FastAPI + Polars + Rust
 * - Protocol: HTTP REST API
 * - Format: Multipart form-data for file uploads
 *
 * **Use Cases:**
 * - SIRE massive file processing (100k+ records)
 * - Tax report generation
 * - Analytics queries on large datasets
 *
 * **Environment Variables:**
 * - `DATA_ENGINE_URL` - Base URL (default: http://localhost:8000)
 *
 * @example
 * ```ts
 * import { DataEngineClient } from './data-engine.client';
 *
 * // Check if service is online
 * const health = await DataEngineClient.healthCheck();
 * console.log(health.status); // 'online' | 'offline'
 * ```
 */

import { createLogger } from "../../lib/logger";
import {
	DATA_ENGINE_CONTRACT_VERSION,
	DATA_ENGINE_CONTRACT_VERSION_HEADER,
} from "./contracts/data-engine-contract-version";

const DATA_ENGINE_URL = process.env.DATA_ENGINE_URL || "http://localhost:8000";
const logger = createLogger({ module: "shared/data-engine-client" });

export interface DataEngineHealthCheckResult {
	status: string;
	error?: string;
	[key: string]: unknown;
}

export class DataEngineClient {
	/**
	 * Check Data Engine health status.
	 *
	 * Used for monitoring and readiness checks. Returns service status and
	 * version information.
	 *
	 * **Response:**
	 * - `status: 'online'` - Service is ready
	 * - `status: 'offline'` - Service unreachable
	 * - `version` - Data Engine version (e.g., '1.0.0')
	 * - `uptime` - Seconds since service started
	 *
	 * **Use Cases:**
	 * - Kubernetes readiness probe
	 * - Pre-flight check before file upload
	 * - Monitoring dashboard
	 *
	 * @returns Health status object
	 *
	 * @example
	 * ```ts
	 * // Check health before processing
	 * const health = await DataEngineClient.healthCheck();
	 *
	 * if (health.status === 'offline') {
	 *   throw new Error('Data Engine is offline');
	 * }
	 *
	 * // Proceed with file upload
	 * await DataEngineClient.analyzeSire(file);
	 * ```
	 *
	 * @example
	 * ```ts
	 * // Kubernetes probe
	 * app.get('/health', async () => {
	 *   const engine = await DataEngineClient.healthCheck();
	 *   return {
	 *     api: 'online',
	 *     dataEngine: engine.status
	 *   };
	 * });
	 * ```
	 */
	static async healthCheck(): Promise<DataEngineHealthCheckResult> {
		try {
			const response = await fetch(`${DATA_ENGINE_URL}/health`, {
				headers: {
					[DATA_ENGINE_CONTRACT_VERSION_HEADER]: DATA_ENGINE_CONTRACT_VERSION,
				},
			});
			return await response.json();
		} catch (_error) {
			return { status: "offline", error: "Data Engine unreachable" };
		}
	}

	/**
	 * Delegate SIRE analysis to the Data Engine microservice.
	 * Uploads a CSV/Excel file for Polars (Rust-accelerated) processing.
	 */
	static async analyzeSire(file: File): Promise<Record<string, unknown>> {
		try {
			const formData = new FormData();
			formData.append("file", file);

			const response = await fetch(`${DATA_ENGINE_URL}/api/v1/sire/compras`, {
				method: "POST",
				body: formData,
				headers: {
					[DATA_ENGINE_CONTRACT_VERSION_HEADER]: DATA_ENGINE_CONTRACT_VERSION,
				},
			});

			if (!response.ok) {
				throw new Error(
					`Data Engine returned status ${response.status}: ${await response.text()}`,
				);
			}

			return await response.json();
		} catch (error) {
			logger.error({ error }, "Data Engine SIRE analysis failed");
			throw error;
		}
	}
}
