/*
 * SUNAT API Client
 *
 * HTTP client for SUNAT APIs with OAuth 2.0 authentication.
 *
 * ⚠️ WARNING: SUNAT does NOT have a beta/test environment.
 * All API requests go to PRODUCTION. Use with caution.
 *
 * Supported APIs:
 * - SIRE (Sistema Integrado de Registros Electrónicos)
 * - CPE (Comprobantes de Pago Electrónicos)
 * - Consultas RUC
 */

// ============================================
// TYPES
// ============================================

/**
 * SunatCredentials interface.
 *
 * @example
 * ```ts
 * const value: SunatCredentials = {} as SunatCredentials;
 * console.log(value);
 * ```
 */
import type { SunatApiCredentials as SunatCredentials } from "../types";

/**
 * SunatToken interface.
 *
 * @example
 * ```ts
 * const value: SunatToken = {} as SunatToken;
 * console.log(value);
 * ```
 */
export interface SunatToken {
	accessToken: string;
	tokenType: string;
	expiresIn: number;
	expiresAt: Date;
}

/**
 * SunatApiResponse interface.
 *
 * @example
 * ```ts
 * const value: SunatApiResponse = {} as SunatApiResponse;
 * console.log(value);
 * ```
 * @typeParam T - Generic type parameter for SunatApiResponse.
 */

export interface SunatApiResponse<T> {
	success: boolean;
	data?: T;
	error?: {
		code: string;
		message: string;
	};
}

/**
 * RucInfo interface.
 *
 * @example
 * ```ts
 * const value: RucInfo = {} as RucInfo;
 * console.log(value);
 * ```
 */
import type { RucInfo } from "../types";

/**
 * SireTicketRequest interface.
 *
 * @example
 * ```ts
 * const value: SireTicketRequest = {} as SireTicketRequest;
 * console.log(value);
 * ```
 */
export interface SireTicketRequest {
	ruc: string;
	periodo: string; // Format: YYYYMM
	tipo: "COMPRAS" | "VENTAS";
}

/**
 * SireTicketResponse interface.
 *
 * @example
 * ```ts
 * const value: SireTicketResponse = {} as SireTicketResponse;
 * console.log(value);
 * ```
 */
export interface SireTicketResponse {
	numTicket: string;
	estado: "PENDIENTE" | "PROCESANDO" | "PROCESADO" | "ERROR";
	fechaSolicitud: Date;
}

/**
 * SireDownloadResponse interface.
 *
 * @example
 * ```ts
 * const value: SireDownloadResponse = {} as SireDownloadResponse;
 * console.log(value);
 * ```
 */
export interface SireDownloadResponse {
	nomArchivo: string;
	codDescarga: string;
	desEstado: string;
	archivo?: Buffer; // ZIP file content
}

// ============================================
// CONFIGURATION
// ============================================

const SUNAT_BASE_URL = "https://api.sunat.gob.pe";
const SUNAT_OAUTH_URL = "https://api-seguridad.sunat.gob.pe/v1/clientessol";
const SUNAT_SIRE_URL = "https://api-sire.sunat.gob.pe/v1";

// Timeout and retry configuration
const REQUEST_TIMEOUT_MS = 45000; // SUNAT can be slow
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000;

// Token cache (in-memory, per organization)
const tokenCache = new Map<number, SunatToken>();

// ============================================
// SUNAT API CLIENT CLASS
// ============================================

/**
 * SunatApiClient class.
 *
 * @example
 * ```ts
 * const value = new SunatApiClient();
 * console.log(value);
 * ```
 */
export class SunatApiClient {
	private organizationId: number;
	private credentials?: SunatCredentials;

	constructor(organizationId: number) {
		this.organizationId = organizationId;
	}

	/**
	 * Initialize client with credentials.
	 *
	 * NOTE: For portability in this monorepo, we default to env-based credentials.
	 * In production, load per-organization credentials from an encrypted store.
	 */
	async initialize(): Promise<boolean> {
		try {
			const clientId = process.env.SUNAT_CLIENT_ID;
			const clientSecret = process.env.SUNAT_CLIENT_SECRET;

			if (!clientId || !clientSecret) {
				console.warn(
					`SUNAT credentials not configured (organizationId=${this.organizationId}). Set SUNAT_CLIENT_ID and SUNAT_CLIENT_SECRET.`,
				);
				return false;
			}

			this.credentials = { clientId, clientSecret };

			return true;
		} catch (error) {
			console.error("Error initializing SunatApiClient:", error);
			return false;
		}
	}

	/**
	 * Get or refresh OAuth token
	 */
	async getAccessToken(): Promise<string> {
		if (!this.credentials) {
			throw new Error("Client not initialized. Call initialize() first.");
		}

		// Check cache
		const cached = tokenCache.get(this.organizationId);
		if (cached && cached.expiresAt > new Date()) {
			return cached.accessToken;
		}

		// Request new token
		const token = await this.requestNewToken();
		tokenCache.set(this.organizationId, token);

		return token.accessToken;
	}

	/**
	 * Request new OAuth token from SUNAT
	 */
	private async requestNewToken(): Promise<SunatToken> {
		if (!this.credentials) {
			throw new Error("No credentials available");
		}

		const params = new URLSearchParams({
			grant_type: "client_credentials",
			scope: "https://api.sunat.gob.pe",
			client_id: this.credentials.clientId,
			client_secret: this.credentials.clientSecret,
		});

		const response = await this.fetchWithRetry(
			`${SUNAT_OAUTH_URL}/oauth2/token`,
			{
				method: "POST",
				headers: {
					"Content-Type": "application/x-www-form-urlencoded",
				},
				body: params.toString(),
			},
		);

		if (!response.ok) {
			const error = await response.text();
			throw new Error(`SUNAT OAuth failed: ${response.status} - ${error}`);
		}

		const data = await response.json();

		return {
			accessToken: data.access_token,
			tokenType: data.token_type || "Bearer",
			expiresIn: data.expires_in || 3600,
			expiresAt: new Date(
				Date.now() + (data.expires_in || 3600) * 1000 - 60000,
			), // 1 min buffer
		};
	}

	/**
	 * Make authenticated API request
	 */
	async request<T>(
		endpoint: string,
		options: RequestInit = {},
	): Promise<SunatApiResponse<T>> {
		try {
			const token = await this.getAccessToken();

			const response = await this.fetchWithRetry(endpoint, {
				...options,
				headers: {
					Authorization: `Bearer ${token}`,
					"Content-Type": "application/json",
					...options.headers,
				},
			});

			if (!response.ok) {
				const errorText = await response.text();
				return {
					success: false,
					error: {
						code: response.status.toString(),
						message: errorText || response.statusText,
					},
				};
			}

			const data = await response.json();
			return {
				success: true,
				data: data as T,
			};
		} catch (error) {
			console.error("SUNAT API request error:", error);
			return {
				success: false,
				error: {
					code: "REQUEST_FAILED",
					message:
						error instanceof Error
							? error.message
							: "Error de conexión con SUNAT",
				},
			};
		}
	}

	/**
	 * Fetch with retry and timeout
	 */
	private async fetchWithRetry(
		url: string,
		options: RequestInit,
		retries = MAX_RETRIES,
	): Promise<Response> {
		const controller = new AbortController();
		const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

		try {
			const response = await fetch(url, {
				...options,
				signal: controller.signal,
			});

			clearTimeout(timeoutId);

			// Retry on 503 (Service Unavailable) or 429 (Rate Limit)
			if ((response.status === 503 || response.status === 429) && retries > 0) {
				await this.delay(RETRY_DELAY_MS * (MAX_RETRIES - retries + 1));
				return this.fetchWithRetry(url, options, retries - 1);
			}

			// Retry on 401 (Unauthorized) - token might have expired
			if (response.status === 401 && retries > 0) {
				tokenCache.delete(this.organizationId);
				return this.fetchWithRetry(url, options, retries - 1);
			}

			return response;
		} catch (error) {
			clearTimeout(timeoutId);

			if (retries > 0 && error instanceof Error) {
				if (error.name === "AbortError" || error.message.includes("timeout")) {
					console.warn(`SUNAT request timeout, retrying... (${retries} left)`);
					await this.delay(RETRY_DELAY_MS);
					return this.fetchWithRetry(url, options, retries - 1);
				}
			}

			throw error;
		}
	}

	/**
	 * Delay helper
	 */
	private delay(ms: number): Promise<void> {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}

	// ============================================
	// API METHODS
	// ============================================

	/**
	 * Consulta RUC
	 */
	async consultarRuc(ruc: string): Promise<SunatApiResponse<RucInfo>> {
		return this.request<RucInfo>(
			`${SUNAT_BASE_URL}/v1/contribuyente/ruc/${ruc}`,
		);
	}

	/**
	 * Solicitar ticket de descarga SIRE
	 */
	async solicitarTicketSire(
		request: SireTicketRequest,
	): Promise<SunatApiResponse<SireTicketResponse>> {
		const endpoint = `${SUNAT_SIRE_URL}/contribuyente/${request.ruc}/periodos/${request.periodo}/${request.tipo.toLowerCase()}/solicitar`;

		return this.request<SireTicketResponse>(endpoint, {
			method: "POST",
		});
	}

	/**
	 * Consultar estado de ticket SIRE
	 */
	async consultarEstadoTicket(
		ruc: string,
		numTicket: string,
	): Promise<SunatApiResponse<SireTicketResponse>> {
		const endpoint = `${SUNAT_SIRE_URL}/contribuyente/${ruc}/tickets/${numTicket}/estado`;
		return this.request<SireTicketResponse>(endpoint);
	}

	/**
	 * Descargar archivo SIRE
	 * Returns the ZIP file as a Buffer
	 */
	async descargarArchivoSire(
		ruc: string,
		codDescarga: string,
	): Promise<SunatApiResponse<SireDownloadResponse>> {
		const endpoint = `${SUNAT_SIRE_URL}/contribuyente/${ruc}/archivos/${codDescarga}/descargar`;

		try {
			const token = await this.getAccessToken();

			const response = await this.fetchWithRetry(endpoint, {
				headers: {
					Authorization: `Bearer ${token}`,
				},
			});

			if (!response.ok) {
				return {
					success: false,
					error: {
						code: response.status.toString(),
						message: "Error al descargar archivo SIRE",
					},
				};
			}

			const buffer = Buffer.from(await response.arrayBuffer());

			return {
				success: true,
				data: {
					nomArchivo: `SIRE_${ruc}_${codDescarga}.zip`,
					codDescarga,
					desEstado: "DESCARGADO",
					archivo: buffer,
				},
			};
		} catch (error) {
			return {
				success: false,
				error: {
					code: "DOWNLOAD_FAILED",
					message: error instanceof Error ? error.message : "Error de descarga",
				},
			};
		}
	}
}

// ============================================
// FACTORY FUNCTION
// ============================================

/**
 * Create and initialize a SUNAT API client
 * @param organizationId - Input for organizationId.
 * @returns Result of createSunatClient.
 * @example
 * ```ts
 * const result = await createSunatClient(0);
 * console.log(result);
 * ```
 */

export async function createSunatClient(
	organizationId: number,
): Promise<SunatApiClient | null> {
	const client = new SunatApiClient(organizationId);
	const initialized = await client.initialize();

	if (!initialized) {
		return null;
	}

	return client;
}
