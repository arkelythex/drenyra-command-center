/**
 * AuditEvidence — Value object representing audit evidence
 *
 * Business rules:
 * - type MUST be one of the AuditEvidenceType enum values
 * - Immutable (Object.freeze)
 */

export enum AuditEvidenceType {
	IMAGE = "IMAGE",
	DOCUMENT = "DOCUMENT",
	REPORT = "REPORT",
	DATA = "DATA",
}

export interface AuditEvidenceProps {
	readonly type: AuditEvidenceType;
	readonly content: string;
	readonly hash: string;
	readonly timestamp: Date;
}

export class AuditEvidence {
	private constructor(private readonly props: AuditEvidenceProps) {
		Object.freeze(this);
	}

	static create(props: AuditEvidenceProps): AuditEvidence {
		return new AuditEvidence({ ...props });
	}

	get type(): AuditEvidenceType {
		return this.props.type;
	}

	get content(): string {
		return this.props.content;
	}

	get hash(): string {
		return this.props.hash;
	}

	get timestamp(): Date {
		return this.props.timestamp;
	}

	equals(other: AuditEvidence | null | undefined): boolean {
		if (!other) return false;
		return this.props.hash === other.props.hash;
	}

	toJSON(): Record<string, unknown> {
		return {
			type: this.props.type,
			content: this.props.content,
			hash: this.props.hash,
			timestamp: this.props.timestamp.toISOString(),
		};
	}
}
