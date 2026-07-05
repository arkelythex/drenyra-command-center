import type { FirmMetrics } from "@drenyra/domain";

export interface DashboardResponse {
	organizationId: string;
	organizationName: string;
	organizationRuc: string;
	metrics: FirmMetrics;
	recentActivity: string[];
	alerts: AlertResponse[];
}

export interface ClientSummaryResponse {
	id: string;
	name: string;
	ruc: string;
	status: string;
	healthScore: number | null;
	lastActivity: string | null;
	pendingItems: number;
}

export interface ClientDetailResponse {
	id: string;
	name: string;
	ruc: string;
	slug: string;
	status: string;
	healthScore: number | null;
	settings: Record<string, unknown> | null;
	createdAt: string;
	updatedAt: string;
}

export interface AlertResponse {
	severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
	message: string;
	companyId?: string;
	createdAt: string;
}

export interface ClientFilterParams {
	search?: string;
	status?: "ACTIVE" | "SUSPENDED" | "INACTIVE";
	limit?: number;
	offset?: number;
}

export interface UpdateClientSettingsBody {
	settings?: Record<string, unknown>;
}
