import type { AlertSeverity, FalsePositiveStats } from "./types";
export declare const anomalyAlertRepository: {
	create(data: {
		organizationId: number;
		entityType: string;
		entityId: string;
		alertType: string;
		severity: AlertSeverity;
		detectorAgentId: string;
		detectorConfidence: string;
		lectorConfidence?: string;
		lectorReasoning?: string;
		validadorConfidence?: string;
		validadorReasoning?: string;
		swarmConsensusThreshold: string;
		swarmConsensusScore?: string;
		alertReasoning: string;
		alertContext?: Record<string, unknown>;
	}): Promise<{
		organizationId: number;
		status: "pending" | "confirmed" | "false_positive" | "resolved";
		id: string;
		createdAt: Date;
		updatedAt: Date;
		entityType: string;
		entityId: string;
		alertType: string;
		severity: "low" | "medium" | "high" | "critical";
		detectorAgentId: string;
		detectorConfidence: string;
		lectorConfidence: string | null;
		lectorReasoning: string | null;
		validadorConfidence: string | null;
		validadorReasoning: string | null;
		swarmConsensusThreshold: string;
		swarmConsensusScore: string | null;
		isFalsePositive: boolean | null;
		falsePositiveReason: string | null;
		resolvedBy: string | null;
		resolvedAt: Date | null;
		alertReasoning: string;
		alertContext: unknown;
	}>;
	findById(id: string): Promise<
		{
			id: string;
			organizationId: number;
			entityType: string;
			entityId: string;
			alertType: string;
			severity: "low" | "medium" | "high" | "critical";
			status: "pending" | "confirmed" | "false_positive" | "resolved";
			detectorAgentId: string;
			detectorConfidence: string;
			lectorConfidence: string | null;
			lectorReasoning: string | null;
			validadorConfidence: string | null;
			validadorReasoning: string | null;
			swarmConsensusThreshold: string;
			swarmConsensusScore: string | null;
			isFalsePositive: boolean | null;
			falsePositiveReason: string | null;
			resolvedBy: string | null;
			resolvedAt: Date | null;
			alertReasoning: string;
			alertContext: unknown;
			createdAt: Date;
			updatedAt: Date;
		}[]
	>;
	findByOrganization(
		organizationId: number,
		options?: {
			limit?: number;
			status?: string;
		},
	): Promise<
		{
			id: string;
			organizationId: number;
			entityType: string;
			entityId: string;
			alertType: string;
			severity: "low" | "medium" | "high" | "critical";
			status: "pending" | "confirmed" | "false_positive" | "resolved";
			detectorAgentId: string;
			detectorConfidence: string;
			lectorConfidence: string | null;
			lectorReasoning: string | null;
			validadorConfidence: string | null;
			validadorReasoning: string | null;
			swarmConsensusThreshold: string;
			swarmConsensusScore: string | null;
			isFalsePositive: boolean | null;
			falsePositiveReason: string | null;
			resolvedBy: string | null;
			resolvedAt: Date | null;
			alertReasoning: string;
			alertContext: unknown;
			createdAt: Date;
			updatedAt: Date;
		}[]
	>;
	getRecentBySeverity(
		organizationId: number,
		severity: AlertSeverity,
		days?: number,
	): Promise<
		{
			status: "pending" | "confirmed" | "false_positive" | "resolved";
			severity: "low" | "medium" | "high" | "critical";
			threshold: string;
		}[]
	>;
	markAsFalsePositive(
		id: string,
		reason: string,
		resolvedBy: string,
	): Promise<void>;
	markAsConfirmed(id: string, resolvedBy: string): Promise<void>;
	markAsResolved(id: string, resolvedBy: string): Promise<void>;
	getFalsePositiveRate(
		organizationId: number,
		severity: AlertSeverity,
		days?: number,
	): Promise<FalsePositiveStats>;
};
//# sourceMappingURL=anomaly-alert.repository.d.ts.map
