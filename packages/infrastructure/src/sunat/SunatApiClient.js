const SUNAT_BASE_URL = "https://api.sunat.gob.pe";
const SUNAT_OAUTH_URL = "https://api-seguridad.sunat.gob.pe/v1/clientessol";
const SUNAT_SIRE_URL = "https://api-sire.sunat.gob.pe/v1";
const REQUEST_TIMEOUT_MS = 45000;
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000;
const tokenCache = new Map();
export class SunatApiClient {
    organizationId;
    credentials;
    constructor(organizationId) {
        this.organizationId = organizationId;
    }
    async initialize() {
        try {
            const clientId = process.env.SUNAT_CLIENT_ID;
            const clientSecret = process.env.SUNAT_CLIENT_SECRET;
            if (!clientId || !clientSecret) {
                console.warn(`SUNAT credentials not configured (organizationId=${this.organizationId}). Set SUNAT_CLIENT_ID and SUNAT_CLIENT_SECRET.`);
                return false;
            }
            this.credentials = { clientId, clientSecret };
            return true;
        }
        catch (error) {
            console.error("Error initializing SunatApiClient:", error);
            return false;
        }
    }
    async getAccessToken() {
        if (!this.credentials) {
            throw new Error("Client not initialized. Call initialize() first.");
        }
        const cached = tokenCache.get(this.organizationId);
        if (cached && cached.expiresAt > new Date()) {
            return cached.accessToken;
        }
        const token = await this.requestNewToken();
        tokenCache.set(this.organizationId, token);
        return token.accessToken;
    }
    async requestNewToken() {
        if (!this.credentials) {
            throw new Error("No credentials available");
        }
        const params = new URLSearchParams({
            grant_type: "client_credentials",
            scope: "https://api.sunat.gob.pe",
            client_id: this.credentials.clientId,
            client_secret: this.credentials.clientSecret,
        });
        const response = await this.fetchWithRetry(`${SUNAT_OAUTH_URL}/oauth2/token`, {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: params.toString(),
        });
        if (!response.ok) {
            const error = await response.text();
            throw new Error(`SUNAT OAuth failed: ${response.status} - ${error}`);
        }
        const data = await response.json();
        return {
            accessToken: data.access_token,
            tokenType: data.token_type || "Bearer",
            expiresIn: data.expires_in || 3600,
            expiresAt: new Date(Date.now() + (data.expires_in || 3600) * 1000 - 60000),
        };
    }
    async request(endpoint, options = {}) {
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
                data: data,
            };
        }
        catch (error) {
            console.error("SUNAT API request error:", error);
            return {
                success: false,
                error: {
                    code: "REQUEST_FAILED",
                    message: error instanceof Error
                        ? error.message
                        : "Error de conexión con SUNAT",
                },
            };
        }
    }
    async fetchWithRetry(url, options, retries = MAX_RETRIES) {
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
        }
        catch (error) {
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
    delay(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
    async consultarRuc(ruc) {
        return this.request(`${SUNAT_BASE_URL}/v1/contribuyente/ruc/${ruc}`);
    }
    async solicitarTicketSire(request) {
        const endpoint = `${SUNAT_SIRE_URL}/contribuyente/${request.ruc}/periodos/${request.periodo}/${request.tipo.toLowerCase()}/solicitar`;
        return this.request(endpoint, {
            method: "POST",
        });
    }
    async consultarEstadoTicket(ruc, numTicket) {
        const endpoint = `${SUNAT_SIRE_URL}/contribuyente/${ruc}/tickets/${numTicket}/estado`;
        return this.request(endpoint);
    }
    async descargarArchivoSire(ruc, codDescarga) {
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
        }
        catch (error) {
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
export async function createSunatClient(organizationId) {
    const client = new SunatApiClient(organizationId);
    const initialized = await client.initialize();
    if (!initialized) {
        return null;
    }
    return client;
}
//# sourceMappingURL=SunatApiClient.js.map