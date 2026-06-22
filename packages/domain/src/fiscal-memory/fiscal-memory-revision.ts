import type { FiscalMemoryProps, FiscalMemoryRevisionProps } from "./fiscal-memory.types";
import { InvalidFiscalMemoryError } from "./fiscal-memory";
import { FISCAL_MEMORY_ERROR_CODES } from "./fiscal-memory.types";

const assertText = (value: string, field: string): void => {
	if (value.trim().length === 0) {
		throw new InvalidFiscalMemoryError(
			FISCAL_MEMORY_ERROR_CODES.INVALID_SCOPE,
			`${field} is required`,
		);
	}
};

/**
 * Immutable audit revision for a fiscal-memory state transition.
 *
 * @remarks Revisions preserve previous and next values so fiscal audit history is append-only.
 * @example
 * const revision = FiscalMemoryRevision.create(props);
 */
export class FiscalMemoryRevision {
	private constructor(private readonly props: FiscalMemoryRevisionProps) {
		Object.freeze(this.props);
		Object.freeze(this);
	}

	/**
	 * Creates a validated fiscal-memory revision.
	 *
	 * @param props - Revision state including previous and next memory snapshots.
	 * @returns A validated immutable revision.
	 * @throws InvalidFiscalMemoryError when revision identity or numbering is invalid.
	 */
	static create(props: FiscalMemoryRevisionProps): FiscalMemoryRevision {
		assertText(props.id, "id");
		assertText(props.memoryId, "memoryId");
		assertText(props.changedBy, "changedBy");
		assertText(props.changeReason, "changeReason");
		if (!Number.isInteger(props.revisionNumber) || props.revisionNumber <= 0) {
			throw new InvalidFiscalMemoryError(
				FISCAL_MEMORY_ERROR_CODES.INVALID_STATUS,
				"revisionNumber must be a positive integer",
			);
		}
		return new FiscalMemoryRevision(props);
	}

	get id(): string { return this.props.id; }
	get memoryId(): string { return this.props.memoryId; }
	get revisionNumber(): number { return this.props.revisionNumber; }
	get changedBy(): string { return this.props.changedBy; }
	get changeReason(): string { return this.props.changeReason; }
	get previousValue(): FiscalMemoryProps { return this.props.previousValue; }
	get nextValue(): FiscalMemoryProps { return this.props.nextValue; }
	get createdAt(): Date { return this.props.createdAt; }

	/**
	 * Serializes the revision for repository persistence.
	 *
	 * @returns A copy of the revision properties.
	 * @example
	 * const persisted = revision.toJSON();
	 */
	toJSON(): FiscalMemoryRevisionProps {
		return { ...this.props };
	}
}
