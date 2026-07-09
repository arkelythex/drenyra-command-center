import { requestNewToken, tokenCache } from "./auth";
import type { SunatCredentials } from "./types";
import {
	MAX_RETRIES,
	REQUEST_TIMEOUT_MS,
	RETRY_DELAY_MS,
	type RucInfo,
	type SireDownloadResponse,
	type SireTicketRequest,
	type SireTicketResponse,
	SUNAT_BASE_URL,
	SUNAT_SIRE_URL,
	type SunatApiResponse,
} from "./types";

export class SunatApiClient {
	private organizationId: number;
	private credentials?: SunatCredentials;

	constructor(organizationId: number) {
		this.organizationId = organizationId;
	}

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

	async getAccessToken(): Promise<string> {
		if (!this.credentials) {
			throw new Error("Client not initialized. Call initialize() first.");
		}

		const cached = tokenCache.get(this.organizationId);
		if (cached && cached.expiresAt > new Date()) {
			return cached.accessToken;
		}

		const token = await requestNewToken(
			this.credentials,
			this.fetchWithRetry.bind(this),
		);
		tokenCache.set(this.organizationId, token);

		return token.accessToken;
	}

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

			if ((response.status === 503 || response.status === 429) && retries > 0) {
				await this.delay(RETRY_DELAY_MS * (MAX_RETRIES - retries + 1));
				return this.fetchWithRetry(url, options, retries - 1);
			}

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

	private delay(ms: number): Promise<void> {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}

	async consultarRuc(ruc: string): Promise<SunatApiResponse<RucInfo>> {
		return this.request<RucInfo>(
			`${SUNAT_BASE_URL}/v1/contribuyente/ruc/${ruc}`,
		);
	}

	async solicitarTicketSire(
		request: SireTicketRequest,
	): Promise<SunatApiResponse<SireTicketResponse>> {
		const endpoint = `${SUNAT_SIRE_URL}/contribuyente/${request.ruc}/periodos/${request.periodo}/${request.tipo.toLowerCase()}/solicitar`;

		return this.request<SireTicketResponse>(endpoint, {
			method: "POST",
		});
	}

	async consultarEstadoTicket(
		ruc: string,
		numTicket: string,
	): Promise<SunatApiResponse<SireTicketResponse>> {
		const endpoint = `${SUNAT_SIRE_URL}/contribuyente/${ruc}/tickets/${numTicket}/estado`;
		return this.request<SireTicketResponse>(endpoint);
	}

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
