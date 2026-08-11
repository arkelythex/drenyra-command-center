import type {
	ApprovalDiffPayload,
	ApprovalStatus,
	AutonomyLevel,
	FiscalScope,
} from "../../drenyra/types";
import type {
	ApprovalRequestPrimitiveData,
	ApprovalRequestProps,
} from "./types";
import {
	validateApprovalDecision,
	validateApprovalRequestProps,
} from "./validators";

export class ApprovalRequest {
	private constructor(private props: ApprovalRequestProps) {
		validateApprovalRequestProps(this.props);
		Object.freeze(this);
	}

	static create(props: ApprovalRequestProps): ApprovalRequest {
		return new ApprovalRequest(props);
	}

	static fromPrimitives(data: ApprovalRequestPrimitiveData): ApprovalRequest {
		const props: ApprovalRequestProps = {
			id: data.id,
			caseId: data.caseId,
			scope: {
				companyId: data.scope.companyId,
				companyRuc: data.scope.companyRuc,
				...(data.scope.organizationId !== undefined
					? { organizationId: data.scope.organizationId }
					: {}),
				period: data.scope.period,
				countryCode: data.scope.countryCode as "PE",
			},
			status: data.status as ApprovalStatus,
			title: data.title,
			description: data.description,
			autonomyLevel: data.autonomyLevel as AutonomyLevel,
			requestedBy: data.requestedBy,
			requestedAt:
				data.requestedAt instanceof Date
					? data.requestedAt
					: new Date(data.requestedAt),
			...(data.decidedBy !== undefined ? { decidedBy: data.decidedBy } : {}),
			...(data.decidedAt
				? data.decidedAt instanceof Date
					? { decidedAt: data.decidedAt }
					: { decidedAt: new Date(data.decidedAt) }
				: {}),
			...(data.decisionReason !== undefined ? { decisionReason: data.decisionReason } : {}),
			diff: data.diff,
			metadata: data.metadata ?? {},
		};
		return new ApprovalRequest(props);
	}

	approve(decidedBy: string, reason?: string): ApprovalRequest {
		validateApprovalDecision(this.props.status, "APPROVED");
		return new ApprovalRequest({
			...this.props,
			status: "APPROVED",
			decidedBy,
			decidedAt: new Date(),
			...(reason !== undefined ? { decisionReason: reason } : {}),
		});
	}

	reject(decidedBy: string, reason: string): ApprovalRequest {
		validateApprovalDecision(this.props.status, "REJECTED");
		return new ApprovalRequest({
			...this.props,
			status: "REJECTED",
			decidedBy,
			decidedAt: new Date(),
			decisionReason: reason,
		});
	}

	equals(other: ApprovalRequest | null | undefined): boolean {
		if (!other) return false;
		return this.props.id === other.props.id;
	}

	isDecided(): boolean {
		return this.props.status !== "PENDING";
	}

	get id(): string {
		return this.props.id;
	}
	get caseId(): string {
		return this.props.caseId;
	}
	get scope(): FiscalScope {
		return this.props.scope;
	}
	get status(): ApprovalStatus {
		return this.props.status;
	}
	get title(): string {
		return this.props.title;
	}
	get description(): string {
		return this.props.description;
	}
	get autonomyLevel(): AutonomyLevel {
		return this.props.autonomyLevel;
	}
	get requestedBy(): string {
		return this.props.requestedBy;
	}
	get requestedAt(): Date {
		return this.props.requestedAt;
	}
	get decidedBy(): string | undefined {
		return this.props.decidedBy;
	}
	get decidedAt(): Date | undefined {
		return this.props.decidedAt;
	}
	get decisionReason(): string | undefined {
		return this.props.decisionReason;
	}
	get diff(): ApprovalDiffPayload {
		return this.props.diff;
	}
	get metadata(): Record<string, unknown> {
		return { ...this.props.metadata };
	}

	toJSON(): Record<string, unknown> {
		return {
			id: this.props.id,
			caseId: this.props.caseId,
			scope: this.props.scope,
			status: this.props.status,
			title: this.props.title,
			description: this.props.description,
			autonomyLevel: this.props.autonomyLevel,
			requestedBy: this.props.requestedBy,
			requestedAt: this.props.requestedAt.toISOString(),
			decidedBy: this.props.decidedBy,
			decidedAt: this.props.decidedAt?.toISOString(),
			decisionReason: this.props.decisionReason,
			diff: this.props.diff,
			metadata: this.props.metadata,
		};
	}
}
