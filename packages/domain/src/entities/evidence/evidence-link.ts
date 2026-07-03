import type {
	EvidenceLinkEntityType,
	EvidenceLinkRelationship,
} from "./evidence-link-type";

export interface EvidenceLinkProps {
	id: string;
	evidenceId: string;
	entityType: EvidenceLinkEntityType;
	entityId: string;
	relationship: EvidenceLinkRelationship;
	linkedBy: string;
	linkedAt: Date;
	metadata?: Record<string, unknown>;
}

export class EvidenceLink {
	private constructor(
		public readonly id: string,
		public readonly evidenceId: string,
		public readonly entityType: EvidenceLinkEntityType,
		public readonly entityId: string,
		public readonly relationship: EvidenceLinkRelationship,
		public readonly linkedBy: string,
		public readonly linkedAt: Date,
		public readonly metadata: Readonly<Record<string, unknown>>,
	) {}

	static create(props: EvidenceLinkProps): EvidenceLink {
		return new EvidenceLink(
			props.id,
			props.evidenceId,
			props.entityType,
			props.entityId,
			props.relationship,
			props.linkedBy,
			props.linkedAt,
			props.metadata ?? {},
		);
	}

	static reconstitute(data: EvidenceLinkProps): EvidenceLink {
		return new EvidenceLink(
			data.id,
			data.evidenceId,
			data.entityType,
			data.entityId,
			data.relationship,
			data.linkedBy,
			data.linkedAt,
			data.metadata ?? {},
		);
	}
}
