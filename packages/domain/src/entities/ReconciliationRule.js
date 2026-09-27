const VALID_RULE_TYPES = new Set(["MATCH", "EXCLUSION"]);
export class ReconciliationRule {
    props;
    constructor(props) {
        this.props = props;
        this.validateInvariants();
    }
    static createNew(params) {
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
    static create(props) {
        return new ReconciliationRule(props);
    }
    validateInvariants() {
        if (!this.props.companyId || this.props.companyId.trim() === "") {
            throw new Error("El ID de compañía es requerido");
        }
        if (!this.props.name || this.props.name.trim() === "") {
            throw new Error("El nombre de la regla es requerido");
        }
        if (!VALID_RULE_TYPES.has(this.props.ruleType)) {
            throw new Error(`Tipo de regla inválido: "${this.props.ruleType}". Debe ser MATCH o EXCLUSION`);
        }
        if (!this.isValidConditions(this.props.conditions)) {
            throw new Error("Las condiciones deben ser un objeto JSON no nulo");
        }
        if (!Number.isInteger(this.props.priority) || this.props.priority <= 0) {
            throw new Error("La prioridad debe ser un entero positivo");
        }
    }
    isValidConditions(value) {
        return typeof value === "object" && value !== null && !Array.isArray(value);
    }
    deactivate() {
        if (!this.props.isActive)
            return this;
        return new ReconciliationRule({
            ...this.props,
            isActive: false,
        });
    }
    activate() {
        if (this.props.isActive)
            return this;
        return new ReconciliationRule({
            ...this.props,
            isActive: true,
        });
    }
    updatePriority(newPriority) {
        if (!Number.isInteger(newPriority) || newPriority <= 0) {
            throw new Error("La prioridad debe ser un entero positivo");
        }
        return new ReconciliationRule({
            ...this.props,
            priority: newPriority,
        });
    }
    updateConditions(newConditions) {
        if (!this.isValidConditions(newConditions)) {
            throw new Error("Las condiciones deben ser un objeto JSON no nulo");
        }
        return new ReconciliationRule({
            ...this.props,
            conditions: newConditions,
        });
    }
    get id() {
        return this.props.id;
    }
    get companyId() {
        return this.props.companyId;
    }
    get name() {
        return this.props.name;
    }
    get ruleType() {
        return this.props.ruleType;
    }
    get conditions() {
        return { ...this.props.conditions };
    }
    get priority() {
        return this.props.priority;
    }
    get isActive() {
        return this.props.isActive;
    }
    get createdAt() {
        return this.props.createdAt;
    }
    toJSON() {
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
//# sourceMappingURL=ReconciliationRule.js.map