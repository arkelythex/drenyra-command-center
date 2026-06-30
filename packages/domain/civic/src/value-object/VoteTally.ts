/**
 * VoteTally — Immutable value object representing a candidate's vote tally
 *
 * Business rules:
 * - Immutable (Object.freeze)
 * - Tracks anomalies for fraud detection
 */

export interface VoteTallyProps {
	readonly candidateId: string;
	readonly candidateName: string;
	readonly party: string;
	readonly voteCount: number;
	readonly isValid: boolean;
	readonly anomalies?: readonly string[];
}

export class VoteTally {
	private constructor(private readonly props: VoteTallyProps) {
		Object.freeze(this);
	}

	static create(props: VoteTallyProps): VoteTally {
		return new VoteTally({
			...props,
			anomalies: props.anomalies ?? [],
		});
	}

	get candidateId(): string {
		return this.props.candidateId;
	}

	get candidateName(): string {
		return this.props.candidateName;
	}

	get party(): string {
		return this.props.party;
	}

	get voteCount(): number {
		return this.props.voteCount;
	}

	get isValid(): boolean {
		return this.props.isValid;
	}

	get anomalies(): readonly string[] {
		return this.props.anomalies ?? [];
	}

	equals(other: VoteTally | null | undefined): boolean {
		if (!other) return false;
		return this.props.candidateId === other.props.candidateId;
	}

	toJSON(): VoteTallyProps {
		return { ...this.props };
	}
}
