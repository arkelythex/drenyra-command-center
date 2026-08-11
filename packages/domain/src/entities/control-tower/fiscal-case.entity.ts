import type {
	AutonomyLevel,
	FiscalCaseStatus,
	FiscalCaseType,
	FiscalRiskLevel,
	FiscalScope,
} from "../../drenyra/types";
import type { FiscalCasePrimitiveData, FiscalCaseProps } from "./types";
import {
	validateFiscalCaseProps,
	validateFiscalCaseTransition,
} from "./validators";

export class FiscalCase {
	private constructor(private props: FiscalCaseProps) {
		validateFiscalCaseProps(this.props);
		Object.freeze(this);
	}

	static create(props: FiscalCaseProps): FiscalCase {
		return new FiscalCase(props);
	}

	static fromPrimitives(data: FiscalCasePrimitiveData): FiscalCase {
		const props: FiscalCaseProps = {
			id: data.id,
			scope: {
				companyId: data.scope.companyId,
				companyRuc: data.scope.companyRuc,
				...(data.scope.organizationId !== undefined
					? { organizationId: data.scope.organizationId }
					: {}),
				period: data.scope.period,
				countryCode: data.scope.countryCode as "PE",
			},
			type: data.type as FiscalCaseType,
			status: data.status as FiscalCaseStatus,
			title: data.title,
			description: data.description,
			riskLevel: data.riskLevel as FiscalRiskLevel,
			riskScore: data.riskScore,
			autonomyLevel: data.autonomyLevel as AutonomyLevel,
			createdBy: data.createdBy,
			createdAt:
				data.createdAt instanceof Date
					? data.createdAt
					: new Date(data.createdAt),
			updatedAt:
				data.updatedAt instanceof Date
					? data.updatedAt
					: new Date(data.updatedAt),
			metadata: data.metadata ?? {},
		};
		return new FiscalCase(props);
	}

	private transition(newStatus: FiscalCaseStatus): FiscalCase {
		validateFiscalCaseTransition(this.props.status, newStatus);
		return new FiscalCase({
			...this.props,
			status: newStatus,
			updatedAt: new Date(),
		});
	}

	startReview(): FiscalCase {
		return this.transition("IN_REVIEW");
	}

	requestApproval(): FiscalCase {
		return this.transition("APPROVAL_PENDING");
	}

	resolve(): FiscalCase {
		return this.transition("RESOLVED");
	}

	archive(): FiscalCase {
		return this.transition("ARCHIVED");
	}

	updateRisk(riskLevel: FiscalRiskLevel, riskScore: number): FiscalCase {
		if (riskScore < 0 || riskScore > 100) {
			throw new Error("Risk score must be between 0 and 100");
		}
		return new FiscalCase({
			...this.props,
			riskLevel,
			riskScore,
			updatedAt: new Date(),
		});
	}

	updateMetadata(metadata: Record<string, unknown>): FiscalCase {
		return new FiscalCase({
			...this.props,
			metadata: { ...this.props.metadata, ...metadata },
			updatedAt: new Date(),
		});
	}

	equals(other: FiscalCase | null | undefined): boolean {
		if (!other) return false;
		return this.props.id === other.props.id;
	}

	get id(): string {
		return this.props.id;
	}
	get scope(): FiscalScope {
		return this.props.scope;
	}
	get type(): FiscalCaseType {
		return this.props.type;
	}
	get status(): FiscalCaseStatus {
		return this.props.status;
	}
	get title(): string {
		return this.props.title;
	}
	get description(): string {
		return this.props.description;
	}
	get riskLevel(): FiscalRiskLevel {
		return this.props.riskLevel;
	}
	get riskScore(): number {
		return this.props.riskScore;
	}
	get autonomyLevel(): AutonomyLevel {
		return this.props.autonomyLevel;
	}
	get createdBy(): string {
		return this.props.createdBy;
	}
	get createdAt(): Date {
		return this.props.createdAt;
	}
	get updatedAt(): Date {
		return this.props.updatedAt;
	}
	get metadata(): Record<string, unknown> {
		return { ...this.props.metadata };
	}

	toJSON(): Record<string, unknown> {
		return {
			id: this.props.id,
			scope: this.props.scope,
			type: this.props.type,
			status: this.props.status,
			title: this.props.title,
			description: this.props.description,
			riskLevel: this.props.riskLevel,
			riskScore: this.props.riskScore,
			autonomyLevel: this.props.autonomyLevel,
			createdBy: this.props.createdBy,
			createdAt: this.props.createdAt.toISOString(),
			updatedAt: this.props.updatedAt.toISOString(),
			metadata: this.props.metadata,
		};
	}
}
