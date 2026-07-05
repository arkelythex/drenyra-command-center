import {
	FISCAL_MEMORY_CATEGORIES,
	FISCAL_MEMORY_ERROR_CODES,
	FISCAL_MEMORY_EVIDENCE_REQUIRED_CATEGORIES,
	FISCAL_MEMORY_SEVERITIES,
	FISCAL_MEMORY_STATUSES,
	type FiscalMemoryCategory,
	type FiscalMemoryProps,
	type FiscalMemorySeverity,
	type FiscalMemoryStatus,
} from "./fiscal-memory.types";

/**
 * Error thrown when fiscal-memory input violates deterministic domain rules.
 *
 * @throws InvalidFiscalMemoryError when callers try to persist invalid fiscal memory.
 * @example
 * throw new InvalidFiscalMemoryError("FISCAL_MEMORY_INVALID_RUC", "Invalid RUC");
 */
export class InvalidFiscalMemoryError extends Error {
	constructor(
		public readonly code: string,
		message: string,
	) {
		super(message);
		this.name = "InvalidFiscalMemoryError";
		Object.setPrototypeOf(this, InvalidFiscalMemoryError.prototype);
	}
}

const PERIOD_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/;
const RUC_PATTERN = /^\d{11}$/;

const assertNonEmpty = (value: string, code: string, field: string): void => {
	if (value.trim().length === 0) {
		throw new InvalidFiscalMemoryError(code, `${field} is required`);
	}
};

const normalizeList = (
	values: readonly string[] | undefined,
): readonly string[] => {
	return Object.freeze(
		[...(values ?? [])].map((value) => value.trim()).filter(Boolean),
	);
};

/**
 * Immutable company-scoped fiscal-memory aggregate.
 *
 * @remarks The aggregate stores criteria, decisions, findings, and evidence references;
 * it never replaces the underlying evidence source.
 * @example
 * const memory = FiscalMemory.create(input);
 */
export class FiscalMemory {
	private constructor(private readonly props: FiscalMemoryProps) {
		Object.freeze(this.props.evidenceRefs);
		Object.freeze(this.props.tags);
		Object.freeze(this.props.relatedMemoryIds ?? []);
		Object.freeze(this.props);
		Object.freeze(this);
	}

	/**
	 * Creates and validates a new fiscal memory.
	 *
	 * @param input - Fiscal-memory data with optional lifecycle defaults.
	 * @returns A validated immutable fiscal-memory aggregate.
	 * @throws InvalidFiscalMemoryError when scope, period, RUC, metadata, or evidence is invalid.
	 */
	static create(
		input: Omit<FiscalMemoryProps, "status" | "createdAt" | "updatedAt"> &
			Partial<Pick<FiscalMemoryProps, "status" | "createdAt" | "updatedAt">>,
	): FiscalMemory {
		const now = new Date();
		const props: FiscalMemoryProps = {
			...input,
			status: input.status ?? "active",
			evidenceRefs: normalizeList(input.evidenceRefs),
			tags: normalizeList(input.tags),
			relatedMemoryIds: normalizeList(input.relatedMemoryIds),
			createdAt: input.createdAt ?? now,
			updatedAt: input.updatedAt ?? now,
		};

		FiscalMemory.validate(props);
		return new FiscalMemory(props);
	}

	/**
	 * Rehydrates a persisted fiscal memory while re-running domain validation.
	 *
	 * @param props - Serialized fiscal-memory properties from persistence.
	 * @returns An immutable fiscal-memory aggregate.
	 * @throws InvalidFiscalMemoryError when persisted data no longer satisfies the domain contract.
	 */
	static rehydrate(props: FiscalMemoryProps): FiscalMemory {
		FiscalMemory.validate(props);
		return new FiscalMemory({
			...props,
			evidenceRefs: normalizeList(props.evidenceRefs),
			tags: normalizeList(props.tags),
			relatedMemoryIds: normalizeList(props.relatedMemoryIds),
		});
	}

	private static validate(props: FiscalMemoryProps): void {
		assertNonEmpty(props.id, FISCAL_MEMORY_ERROR_CODES.INVALID_SCOPE, "id");
		assertNonEmpty(
			props.tenantId,
			FISCAL_MEMORY_ERROR_CODES.INVALID_SCOPE,
			"tenantId",
		);
		assertNonEmpty(
			props.companyId,
			FISCAL_MEMORY_ERROR_CODES.INVALID_SCOPE,
			"companyId",
		);
		assertNonEmpty(
			props.createdBy,
			FISCAL_MEMORY_ERROR_CODES.INVALID_SCOPE,
			"createdBy",
		);

		if (!RUC_PATTERN.test(props.ruc)) {
			throw new InvalidFiscalMemoryError(
				FISCAL_MEMORY_ERROR_CODES.INVALID_RUC,
				"ruc must be an 11-digit SUNAT RUC",
			);
		}

		if (!PERIOD_PATTERN.test(props.period)) {
			throw new InvalidFiscalMemoryError(
				FISCAL_MEMORY_ERROR_CODES.INVALID_PERIOD,
				"period must use YYYY-MM format",
			);
		}

		if (!FISCAL_MEMORY_CATEGORIES.includes(props.category)) {
			throw new InvalidFiscalMemoryError(
				FISCAL_MEMORY_ERROR_CODES.INVALID_CATEGORY,
				`Unsupported fiscal memory category: ${props.category}`,
			);
		}

		if (!FISCAL_MEMORY_SEVERITIES.includes(props.severity)) {
			throw new InvalidFiscalMemoryError(
				FISCAL_MEMORY_ERROR_CODES.INVALID_SEVERITY,
				`Unsupported fiscal memory severity: ${props.severity}`,
			);
		}

		if (!FISCAL_MEMORY_STATUSES.includes(props.status)) {
			throw new InvalidFiscalMemoryError(
				FISCAL_MEMORY_ERROR_CODES.INVALID_STATUS,
				`Unsupported fiscal memory status: ${props.status}`,
			);
		}

		assertNonEmpty(props.title, FISCAL_MEMORY_ERROR_CODES.EMPTY_TITLE, "title");
		assertNonEmpty(
			props.summary,
			FISCAL_MEMORY_ERROR_CODES.EMPTY_SUMMARY,
			"summary",
		);

		if (
			FISCAL_MEMORY_EVIDENCE_REQUIRED_CATEGORIES.has(props.category) &&
			props.evidenceRefs.length === 0
		) {
			throw new InvalidFiscalMemoryError(
				FISCAL_MEMORY_ERROR_CODES.EVIDENCE_REQUIRED,
				`${props.category} requires evidenceRefs`,
			);
		}
	}

	/**
	 * Returns a copy with a new lifecycle status.
	 *
	 * @param status - Next fiscal-memory status.
	 * @param updatedAt - Deterministic timestamp supplied by the caller when needed.
	 * @returns A validated fiscal-memory copy preserving immutable history externally.
	 */
	withStatus(status: FiscalMemoryStatus, updatedAt = new Date()): FiscalMemory {
		return FiscalMemory.rehydrate({ ...this.props, status, updatedAt });
	}

	/**
	 * Returns a copy with updated notes or summary.
	 *
	 * @param summary - New fiscal-memory summary.
	 * @param updatedAt - Deterministic timestamp supplied by the caller when needed.
	 * @returns A validated fiscal-memory copy.
	 */
	withSummary(summary: string, updatedAt = new Date()): FiscalMemory {
		return FiscalMemory.rehydrate({ ...this.props, summary, updatedAt });
	}

	get id(): string {
		return this.props.id;
	}
	get tenantId(): string {
		return this.props.tenantId;
	}
	get companyId(): string {
		return this.props.companyId;
	}
	get ruc(): string {
		return this.props.ruc;
	}
	get period(): string {
		return this.props.period;
	}
	get category(): FiscalMemoryCategory {
		return this.props.category;
	}
	get severity(): FiscalMemorySeverity {
		return this.props.severity;
	}
	get status(): FiscalMemoryStatus {
		return this.props.status;
	}
	get title(): string {
		return this.props.title;
	}
	get summary(): string {
		return this.props.summary;
	}
	get evidenceRefs(): readonly string[] {
		return this.props.evidenceRefs;
	}
	get tags(): readonly string[] {
		return this.props.tags;
	}
	get createdBy(): string {
		return this.props.createdBy;
	}
	get approvedBy(): string | undefined {
		return this.props.approvedBy;
	}
	get sourceAgentId(): string | undefined {
		return this.props.sourceAgentId;
	}
	get relatedMemoryIds(): readonly string[] {
		return this.props.relatedMemoryIds ?? [];
	}
	get createdAt(): Date {
		return this.props.createdAt;
	}
	get updatedAt(): Date {
		return this.props.updatedAt;
	}

	/**
	 * Serializes the aggregate for repositories and audit revisions.
	 *
	 * @returns A defensive-copy representation of the fiscal memory.
	 * @example
	 * const snapshot = memory.toJSON();
	 */
	toJSON(): FiscalMemoryProps {
		return {
			...this.props,
			evidenceRefs: [...this.props.evidenceRefs],
			tags: [...this.props.tags],
			relatedMemoryIds: [...(this.props.relatedMemoryIds ?? [])],
		};
	}
}
