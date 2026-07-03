/**
 * API Marketplace — DTO types for frontend consumption.
 *
 * @module application/features/api-marketplace
 */

// ─── Enums ───────────────────────────────────────────────────────

export type IntegrationProvider = "stripe" | "sunat" | "banco" | "tributar";
export type IntegrationCategory =
	| "payments"
	| "tax"
	| "banking"
	| "accounting"
	| "other";
export type ConnectionStatus = "active" | "error" | "expired";

// ─── DTOs ───────────────────────────────────────────────────────

export interface IntegrationDTO {
	id: string;
	name: string;
	provider: IntegrationProvider;
	category: IntegrationCategory;
	description: string;
	icon?: string;
	isInstalled: boolean;
	createdAt: string;
}

export interface ConnectionDTO {
	id: string;
	integrationId: string;
	companyId: string;
	status: ConnectionStatus;
	config: Record<string, unknown> | null;
	lastTestedAt: string | null;
	errorMessage: string | null;
	createdAt: string;
	updatedAt: string;
}

export interface WebhookDTO {
	id: string;
	connectionId: string;
	eventType: string;
	endpointUrl: string;
	isActive: boolean;
	createdAt: string;
}

export interface InstallIntegrationRequest {
	companyId: string;
}

export interface CreateConnectionRequest {
	companyId: string;
	integrationId: string;
	config?: Record<string, unknown>;
}

export interface UpdateConnectionRequest {
	config?: Record<string, unknown>;
}

export interface CreateWebhookRequest {
	connectionId: string;
	eventType: string;
	endpointUrl: string;
	secret?: string;
}
