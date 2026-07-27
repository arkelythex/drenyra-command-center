/**
 * CompensatingEntry Entity
 *
 * Links a compensating journal entry to its original entry.
 * In accounting, corrections are never made by editing/deleting the original
 * entry. Instead, a compensating entry (reversal/correction/adjustment) is
 * created that references the original. This preserves the audit trail.
 *
 * **Types:**
 * - `reversal`: Anula completamente el asiento original (reverse original + re-post corrected)
 * - `correction`: Corrige un error parcial (ej: monto incorrecto en una línea)
 * - `adjustment`: Ajuste contable que no corrige un error (ej: reclasificación, devengo)
 *
 * Immutable — once created, it cannot be modified.
 *
 * @module domain/entities/journal-entry
 */
export type CompensatingEntryType = "reversal" | "correction" | "adjustment";

export interface CompensatingEntryProps {
	/** Unique identifier */
	id: string;
	/** Organization/company scope */
	organizationId: number;
	/** The original journal entry being corrected/reversed */
	originalEntryId: string;
	/** The new journal entry that contains the corrected/adjusted lines */
	compensatingEntryId: string;
	/** Type of compensating action */
	type: CompensatingEntryType;
	/** Free-text justification required for audit trail */
	reason: string;
	/** Who authorized the correction */
	authorizedBy: string;
	/** When the compensating entry was created */
	createdAt: Date;
}

export class CompensatingEntry {
	private constructor(private readonly props: CompensatingEntryProps) {
		CompensatingEntry.validate(props);
		Object.freeze(this);
	}

	static create(
		props: Omit<CompensatingEntryProps, "createdAt"> & {
			createdAt?: Date;
		},
	): CompensatingEntry {
		return new CompensatingEntry({
			...props,
			createdAt: props.createdAt ?? new Date(),
		});
	}

	// --- Validation ---

	private static validate(props: CompensatingEntryProps): void {
		CompensatingEntry.validateRequiredIds(props);
		CompensatingEntry.validateNotSelfReferential(props);
		CompensatingEntry.validateType(props);
		CompensatingEntry.validateReason(props);
		CompensatingEntry.validateAuthorization(props);
		CompensatingEntry.validateCreatedAt(props);
	}

	private static validateRequiredIds(props: CompensatingEntryProps): void {
		if (!props.id || props.id.trim().length === 0) {
			throw new Error("El ID del asiento compensatorio es requerido");
		}
		if (!props.organizationId || props.organizationId <= 0) {
			throw new Error("La organización es requerida");
		}
		if (!props.originalEntryId || props.originalEntryId.trim().length === 0) {
			throw new Error("El ID del asiento original es requerido");
		}
		if (
			!props.compensatingEntryId ||
			props.compensatingEntryId.trim().length === 0
		) {
			throw new Error("El ID del asiento compensatorio es requerido");
		}
	}

	private static validateNotSelfReferential(
		props: CompensatingEntryProps,
	): void {
		if (props.originalEntryId === props.compensatingEntryId) {
			throw new Error(
				"El asiento compensatorio no puede ser el mismo que el original",
			);
		}
	}

	private static validateType(props: CompensatingEntryProps): void {
		const validTypes: CompensatingEntryType[] = [
			"reversal",
			"correction",
			"adjustment",
		];
		if (!validTypes.includes(props.type)) {
			throw new Error(
				`Tipo de compensación inválido: ${props.type}. Debe ser: reversal, correction, o adjustment`,
			);
		}
	}

	private static validateReason(props: CompensatingEntryProps): void {
		if (!props.reason || props.reason.trim().length < 10) {
			throw new Error(
				"La justificación debe tener al menos 10 caracteres (audit trail)",
			);
		}
	}

	private static validateAuthorization(props: CompensatingEntryProps): void {
		if (!props.authorizedBy || props.authorizedBy.trim().length === 0) {
			throw new Error("El autorizador es requerido (audit trail)");
		}
	}

	private static validateCreatedAt(props: CompensatingEntryProps): void {
		if (props.createdAt && props.createdAt.getTime() > Date.now()) {
			throw new Error("La fecha de creación no puede ser futura");
		}
	}

	// --- Getters ---

	get id(): string {
		return this.props.id;
	}
	get organizationId(): number {
		return this.props.organizationId;
	}
	get originalEntryId(): string {
		return this.props.originalEntryId;
	}
	get compensatingEntryId(): string {
		return this.props.compensatingEntryId;
	}
	get type(): CompensatingEntryType {
		return this.props.type;
	}
	get reason(): string {
		return this.props.reason;
	}
	get authorizedBy(): string {
		return this.props.authorizedBy;
	}
	get createdAt(): Date {
		return this.props.createdAt;
	}

	// --- Equality ---

	equals(other: CompensatingEntry | null | undefined): boolean {
		if (!other) return false;
		return this.props.id === other.props.id;
	}

	// --- Serialization ---

	toJSON(): Record<string, unknown> {
		return {
			id: this.props.id,
			organizationId: this.props.organizationId,
			originalEntryId: this.props.originalEntryId,
			compensatingEntryId: this.props.compensatingEntryId,
			type: this.props.type,
			reason: this.props.reason,
			authorizedBy: this.props.authorizedBy,
			createdAt: this.props.createdAt.toISOString(),
		};
	}
}
