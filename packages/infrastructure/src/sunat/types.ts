/**
 * SUNAT authentication credentials for web portal scraping.
 * Used for accessing the SUNAT web interface (clave SOL).
 */
export interface SunatWebCredentials {
	ruc: string;
	usuario: string;
	clave: string;
}

/**
 * SUNAT API credentials for programmatic access (API REST).
 * Used for OAuth2-based API interactions.
 */
export interface SunatApiCredentials {
	clientId: string;
	clientSecret: string;
}
