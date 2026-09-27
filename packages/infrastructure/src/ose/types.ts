/**
 * OSE (Operador de Servicios Electrónicos) Types
 *
 * Core type definitions for SUNAT electronic invoice submission
 * through authorized OSE providers (NubeFact, Bizlinks, etc.)
 */

export interface SendInvoiceData {
	xmlContent: string;
	invoiceNumber: string;
	invoiceType: string;
}

export interface OSEResponse {
	success: boolean;
	cdrContent?: string | undefined;
	cdrStatus?: "ACEPTADO" | "RECHAZADO" | "OBSERVADO" | undefined;
	cdrMessage?: string | undefined;
	sunatCode?: string | undefined;
	sunatDescription?: string | undefined;
	error?: string | undefined;
	attemptsCount?: number | undefined;
	attemptTrace?: AttemptTrace[] | undefined;
}

export interface AttemptTrace {
	attempt: number;
	status: "SUCCESS" | "ERROR";
	message: string;
	at: string;
}

export interface IOSEProvider {
	send(data: SendInvoiceData): Promise<OSEResponse>;
	checkStatus(): Promise<{ online: boolean; message: string }>;
}

export type OSEProviderType = "nubefact" | "bizlinks" | "custom" | "simulation";

export interface OSEConfig {
	provider: OSEProviderType;
	apiUrl: string;
	apiToken: string;
	ruc: string;
	username: string;
	environment?: "sandbox" | "production";
	simulationMode?: boolean;
	webhookSecret?: string;
}

export interface ValidationResult {
	valid: boolean;
	missing: string[];
	errors: string[];
}
