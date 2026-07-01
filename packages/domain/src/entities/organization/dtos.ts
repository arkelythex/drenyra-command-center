import type { FirmMetrics, OrganizationStatus } from "./types";

export interface CompanySummaryDTO {
	id: string;
	name: string;
	ruc: string;
	status: OrganizationStatus;
	lastActivity: string | null;
	pendingItems: number;
}

export interface FirmDashboardDTO {
	organizationId: string;
	organizationName: string;
	organizationRuc: string;
	metrics: FirmMetrics;
	recentActivity: string[];
	alerts: FirmAlertDTO[];
}

export interface FirmAlertDTO {
	severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
	message: string;
	companyId?: string;
	createdAt: string;
}
