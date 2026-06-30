/**
 * FraudIndicator — Value object representing a detected fraud indicator
 *
 * Business rules:
 * - type MUST be one of the FraudIndicatorType enum values
 * - severity MUST be one of the FraudSeverity enum values
 * - Immutable (Object.freeze)
 */

export enum FraudIndicatorType {
	VOTE_PATTERN_ANOMALY = "VOTE_PATTERN_ANOMALY",
	TURNOUT_SPIKE = "TURNOUT_SPIKE",
	ACT_TAMPERING = "ACT_TAMPERING",
	TIMESTAMP_IRREGULARITY = "TIMESTAMP_IRREGULARITY",
	DUPLICATE_VOTER = "DUPLICATE_VOTER",
}

export enum FraudSeverity {
	LOW = "LOW",
	MEDIUM = "MEDIUM",
	HIGH = "HIGH",
	CRITICAL = "CRITICAL",
}

export interface FraudIndicatorProps {
	readonly type: FraudIndicatorType;
	readonly severity: FraudSeverity;
	readonly description: string;
	readonly evidence: readonly string[];
	readonly detectedAt: Date;
}

export class FraudIndicator {
	private constructor(private readonly props: FraudIndicatorProps) {
		Object.freeze(this);
	}

	static create(props: FraudIndicatorProps): FraudIndicator {
		return new FraudIndicator({ ...props });
	}

	get type(): FraudIndicatorType {
		return this.props.type;
	}

	get severity(): FraudSeverity {
		return this.props.severity;
	}

	get description(): string {
		return this.props.description;
	}

	get evidence(): readonly string[] {
		return this.props.evidence;
	}

	get detectedAt(): Date {
		return this.props.detectedAt;
	}

	equals(other: FraudIndicator | null | undefined): boolean {
		if (!other) return false;
		return (
			this.props.type === other.props.type &&
			this.props.severity === other.props.severity &&
			this.props.description === other.props.description &&
			this.props.detectedAt.getTime() === other.props.detectedAt.getTime()
		);
	}

	toJSON(): Record<string, unknown> {
		return {
			type: this.props.type,
			severity: this.props.severity,
			description: this.props.description,
			evidence: [...this.props.evidence],
			detectedAt: this.props.detectedAt.toISOString(),
		};
	}
}
