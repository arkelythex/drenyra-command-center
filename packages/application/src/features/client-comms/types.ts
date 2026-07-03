/**
 * Client Communications — DTO types for frontend consumption.
 *
 * @module application/features/client-comms
 */

// ─── Enums ───────────────────────────────────────────────────────

export type CommsChannel = "email" | "whatsapp" | "in_app";
export type AutomationTrigger = string;

// ─── DTOs ───────────────────────────────────────────────────────

export interface TemplateDTO {
	id: string;
	companyId: string;
	name: string;
	channel: CommsChannel;
	subject: string | null;
	body: string;
	variables: string[] | null;
	category: string | null;
	createdAt: string;
	updatedAt: string;
}

export interface CreateTemplateRequest {
	companyId: string;
	name: string;
	channel: CommsChannel;
	subject?: string;
	body: string;
	variables?: string[];
	category?: string;
}

export interface UpdateTemplateRequest {
	name?: string;
	channel?: CommsChannel;
	subject?: string;
	body?: string;
	variables?: string[];
	category?: string;
}

export interface SendMessageRequest {
	companyId: string;
	templateId: string;
	clientId?: string;
	recipient: string;
	channel: CommsChannel;
	variables?: Record<string, string>;
}

export interface SendMessageResponse {
	id: string;
	status: string;
	sentAt: string;
}

export interface BatchSendRequest {
	companyId: string;
	templateId: string;
	clientIds: string[];
	channel: CommsChannel;
	variables?: Record<string, string>;
}

export interface AutomationDTO {
	id: string;
	companyId: string;
	name: string;
	trigger: AutomationTrigger;
	config: Record<string, unknown> | null;
	enabled: boolean;
	createdAt: string;
	updatedAt: string;
}

export interface CreateAutomationRequest {
	companyId: string;
	name: string;
	trigger: string;
	config?: Record<string, unknown>;
}

export interface UpdateAutomationRequest {
	name?: string;
	trigger?: string;
	config?: Record<string, unknown>;
	enabled?: boolean;
}
