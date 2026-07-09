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

/**
 * Standardized RUC information from SUNAT.
 * This type unifies the two different RucInfo shapes found across
 * the codebase (API service with nombreComercial vs API client with ubigeo).
 * All fields beyond ruc/razonSocial are optional for flexibility.
 */
export interface RucInfo {
	/** RUC number (11 digits) */
	ruc: string;
	/** Legal business name (razon social) */
	razonSocial: string;
	/** Commercial name */
	nombreComercial?: string;
	/** SUNAT registration status */
	estado?: string;
	/** SUNAT compliance condition */
	condicion?: string;
	/** Fiscal address */
	direccion?: string;
	/** UBIGEO code */
	ubigeo?: string;
	/** Entity type (persona natural o juridica) */
	tipo?: string;
	/** SUNAT registration date */
	fechaInscripcion?: string;
	/** Business start date */
	fechaInicioActividades?: string;
	/** Primary economic activity */
	actividadEconomica?: string;
	/** Taxpayer type */
	tipoContribuyente?: string;
}
