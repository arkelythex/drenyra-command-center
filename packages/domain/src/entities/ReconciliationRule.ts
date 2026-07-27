/**
 * ReconciliationRule Entity
 *
 * Defines an automated matching rule for the reconciliation engine.
 * Rules are evaluated in priority order — the first matching rule above
 * its confidence threshold wins. Conditions are stored as a JSON object
 * that the matching engine interprets at runtime.
 *
 * @example
 * ```ts
 * const rule = ReconciliationRule.createNew({
 *   organizationId: 1,
 *   name: "Exact Amount + Same Date",
 *   ruleType: "MATCH",
 *   conditions: { amountTolerance: 0, dateTolerance: 0, matchFields: ["amount", "valueDate"] },
 *   priority: 10,
 * });
 * ```
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Valid reconciliation rule types. */
export type ReconciliationRuleType = "MATCH" | "EXCLUSION";

/** Conditions payload — validated as a non-null object. */
export type ReconciliationRuleConditions = Record<string, unknown>;

/** Valid rule types set (runtime check). */
const VALID_RULE_TYPES: ReadonlySet<string> = new Set(["MATCH", "EXCLUSION"]);

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface ReconciliationRuleProps {
	id: string;
	companyId: string;
	name: string;
	ruleType: ReconciliationRuleType;
	conditions: ReconciliationRuleConditions;
	priority: number;
	isActive: boolean;
	createdAt: Date;
}

// ---------------------------------------------------------------------------
// Entity
// ---------------------------------------------------------------------------

export class ReconciliationRule {
	private constructor(private readonly props: ReconciliationRuleProps) {
		this.validateInvariants();
	}

	// -----------------------------------------------------------------------
	// Factory methods
	// -----------------------------------------------------------------------

	/** Create a new reconciliation rule. */
	static createNew(params: {
		companyId: string;
		name: string;
		ruleType: ReconciliationRuleType;
		conditions: ReconciliationRuleConditions;
		priority: number;
		isActive?: boolean;
	}): ReconciliationRule {
		return new ReconciliationRule({
			id: crypto.randomUUID(),
			companyId: params.companyId,
			name: params.name,
			ruleType: params.ruleType,
			conditions: params.conditions,
			priority: params.priority,
			isActive: params.isActive ?? true,
			createdAt: new Date(),
		});
	}

	/** Reconstitute from persisted data. */
	static create(props: ReconciliationRuleProps): ReconciliationRule {
		return new ReconciliationRule(props);
	}

	// -----------------------------------------------------------------------
	// Invariants
	// -----------------------------------------------------------------------

	private validateInvariants(): void {
		if (!this.props.companyId || this.props.companyId.trim() === "") {
			throw new Error("El ID de compañía es requerido");
		}
		if (!this.props.name || this.props.name.trim() === "") {
			throw new Error("El nombre de la regla es requerido");
		}
		if (!VALID_RULE_TYPES.has(this.props.ruleType)) {
			throw new Error(
				`Tipo de regla inválido: "${this.props.ruleType}". Debe ser MATCH o EXCLUSION`,
			);
		}
		if (!this.isValidConditions(this.props.conditions)) {
			throw new Error("Las condiciones deben ser un objeto JSON no nulo");
		}
		if (!Number.isInteger(this.props.priority) || this.props.priority <= 0) {
			throw new Error("La prioridad debe ser un entero positivo");
		}
	}

	/** Runtime type guard for conditions. */
	private isValidConditions(
		value: unknown,
	): value is ReconciliationRuleConditions {
		return typeof value === "object" && value !== null && !Array.isArray(value);
	}

	// -----------------------------------------------------------------------
	// Commands
	// -----------------------------------------------------------------------

	/** Deactivate the rule. Idempotent — no-op if already inactive. */
	deactivate(): ReconciliationRule {
		if (!this.props.isActive) return this;
		return new ReconciliationRule({
			...this.props,
			isActive: false,
		});
	}

	/** Activate the rule. Idempotent — no-op if already active. */
	activate(): ReconciliationRule {
		if (this.props.isActive) return this;
		return new ReconciliationRule({
			...this.props,
			isActive: true,
		});
	}

	/** Update the rule priority. Enforces positive integer. */
	updatePriority(newPriority: number): ReconciliationRule {
		if (!Number.isInteger(newPriority) || newPriority <= 0) {
			throw new Error("La prioridad debe ser un entero positivo");
		}
		return new ReconciliationRule({
			...this.props,
			priority: newPriority,
		});
	}

	/** Update matching conditions. Validates the new conditions are a non-null object. */
	updateConditions(
		newConditions: ReconciliationRuleConditions,
	): ReconciliationRule {
		if (!this.isValidConditions(newConditions)) {
			throw new Error("Las condiciones deben ser un objeto JSON no nulo");
		}
		return new ReconciliationRule({
			...this.props,
			conditions: newConditions,
		});
	}

	// -----------------------------------------------------------------------
	// Getters
	// -----------------------------------------------------------------------

	get id(): string {
		return this.props.id;
	}
	get companyId(): string {
		return this.props.companyId;
	}
	get name(): string {
		return this.props.name;
	}
	get ruleType(): ReconciliationRuleType {
		return this.props.ruleType;
	}
	get conditions(): ReconciliationRuleConditions {
		return { ...this.props.conditions };
	}
	get priority(): number {
		return this.props.priority;
	}
	get isActive(): boolean {
		return this.props.isActive;
	}
	get createdAt(): Date {
		return this.props.createdAt;
	}

	// -----------------------------------------------------------------------
	// Serialization
	// -----------------------------------------------------------------------

	toJSON(): Record<string, unknown> {
		return {
			id: this.props.id,
			companyId: this.props.companyId,
			name: this.props.name,
			ruleType: this.props.ruleType,
			conditions: { ...this.props.conditions },
			priority: this.props.priority,
			isActive: this.props.isActive,
			createdAt: this.props.createdAt.toISOString(),
		};
	}
}
