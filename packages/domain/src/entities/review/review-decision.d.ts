export interface ReviewDecision {
    reviewerId: string;
    action: "approved" | "rejected" | "info_requested";
    comment?: string;
    timestamp: Date;
}
//# sourceMappingURL=review-decision.d.ts.map