import type { EvidenceType, FiscalScope } from "../../drenyra/types";
import type { EvidenceItemPrimitiveData, EvidenceItemProps } from "./types";
import { validateEvidenceItemProps } from "./validators";

export class EvidenceItem {
	private constructor(private props: EvidenceItemProps) {
		validateEvidenceItemProps(this.props);
		Object.freeze(this);
	}

	static create(props: EvidenceItemProps): EvidenceItem {
		return new EvidenceItem(props);
	}

	static fromPrimitives(data: EvidenceItemPrimitiveData): EvidenceItem {
		const props: EvidenceItemProps = {
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
			type: data.type as EvidenceType,
			title: data.title,
			summary: data.summary,
			source: data.source,
			...(data.sourceRef !== undefined ? { sourceRef: data.sourceRef } : {}),
			contentHash: data.contentHash,
			addedBy: data.addedBy,
			createdAt:
				data.createdAt instanceof Date
					? data.createdAt
					: new Date(data.createdAt),
			metadata: data.metadata ?? {},
		};
		return new EvidenceItem(props);
	}

	updateSummary(summary: string): EvidenceItem {
		return new EvidenceItem({ ...this.props, summary });
	}

	equals(other: EvidenceItem | null | undefined): boolean {
		if (!other) return false;
		return this.props.id === other.props.id;
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
	get type(): EvidenceType {
		return this.props.type;
	}
	get title(): string {
		return this.props.title;
	}
	get summary(): string {
		return this.props.summary;
	}
	get source(): string {
		return this.props.source;
	}
	get sourceRef(): string | undefined {
		return this.props.sourceRef;
	}
	get contentHash(): string {
		return this.props.contentHash;
	}
	get addedBy(): string {
		return this.props.addedBy;
	}
	get createdAt(): Date {
		return this.props.createdAt;
	}
	get metadata(): Record<string, unknown> {
		return { ...this.props.metadata };
	}

	toJSON(): Record<string, unknown> {
		return {
			id: this.props.id,
			caseId: this.props.caseId,
			scope: this.props.scope,
			type: this.props.type,
			title: this.props.title,
			summary: this.props.summary,
			source: this.props.source,
			sourceRef: this.props.sourceRef,
			contentHash: this.props.contentHash,
			addedBy: this.props.addedBy,
			createdAt: this.props.createdAt.toISOString(),
			metadata: this.props.metadata,
		};
	}
}
