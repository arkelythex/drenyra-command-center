export interface ActiveChange {
    changeId: string;
    title: string;
    regulationRef?: string;
    companyRuc: string;
    period: string;
    currentFase: string;
    status: "COMPLETED" | "PREFLIGHT_BLOCKED" | "AWAITING_APPROVAL" | "FAILED" | "BLOCKED" | "REVIEW_NEEDED" | "RUNNING";
    startedAt: string;
    updatedAt: string;
    needsApproval: boolean;
    approvalFase?: string;
    artifactCount: number;
}
export interface ActiveChangeDetail extends ActiveChange {
    artifacts: Array<{
        fase: string;
        status: string;
        confidence: number;
        ejecutadoEn: string;
        errors: string[];
    }>;
    blockReasons?: string[];
}
export interface PipelineDashboardData {
    active: ActiveChange[];
    recent: ActiveChange[];
    metrics: {
        totalActive: number;
        totalCompleted: number;
        pendingApproval: number;
        blockedCount: number;
        averageConfidence: number;
    };
}
//# sourceMappingURL=pipeline-dashboard.types.d.ts.map