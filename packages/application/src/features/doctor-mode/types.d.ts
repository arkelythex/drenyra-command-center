export type CheckCategory = "database" | "ai_api" | "sunat" | "redis" | "storage" | "external";
export type CheckStatus = "healthy" | "degraded" | "down" | "unknown";
export interface CheckRunResult {
    status: CheckStatus;
    duration: number;
    error?: string;
}
export interface SystemCheckDTO {
    id: string;
    companyId: string;
    category: CheckCategory;
    name: string;
    status: CheckStatus;
    lastRunAt: string | null;
    lastDuration: number | null;
    lastError: string | null;
    enabled: boolean;
    interval: number;
    createdAt: string;
    updatedAt: string;
}
export interface CheckHistoryEntryDTO {
    id: string;
    checkId: string;
    status: CheckStatus;
    duration: number;
    error: string | null;
    ranAt: string;
}
export interface CheckDetailDTO extends SystemCheckDTO {
    history: CheckHistoryEntryDTO[];
}
export interface DashboardAggregate {
    total: number;
    healthy: number;
    degraded: number;
    down: number;
    unknown: number;
    uptime: number;
    lastFullRun: string | null;
}
//# sourceMappingURL=types.d.ts.map