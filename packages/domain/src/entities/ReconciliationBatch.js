import { Money } from "../value-objects/Money";
const CLOSED_STATUSES = new Set([
    "CLOSED",
    "CLOSED_WITH_DISCREPANCY",
]);
const OPEN_STATUSES = new Set(["OPEN"]);
export class ReconciliationBatch {
    props;
    constructor(props) {
        this.props = props;
        this.validateInvariants();
    }
    static createNew(params) {
        const now = new Date();
        return new ReconciliationBatch({
            id: crypto.randomUUID(),
            companyId: params.companyId,
            bankAccountId: params.bankAccountId,
            periodStart: params.periodStart,
            periodEnd: params.periodEnd,
            status: "OPEN",
            openingBalance: params.openingBalance,
            closingBalance: null,
            matchedCount: 0,
            unmatchedCount: 0,
            discrepancyAmount: null,
            mode: params.mode ?? "MANUAL",
            createdAt: now,
            closedAt: null,
        });
    }
    static create(props) {
        return new ReconciliationBatch(props);
    }
    validateInvariants() {
        if (!this.props.companyId || this.props.companyId.trim() === "") {
            throw new Error("El ID de compañía es requerido");
        }
        if (!this.props.bankAccountId || this.props.bankAccountId.trim() === "") {
            throw new Error("El ID de cuenta bancaria es requerido");
        }
        if (this.props.periodEnd < this.props.periodStart) {
            throw new Error("La fecha de fin del período debe ser posterior a la fecha de inicio");
        }
        if (this.props.matchedCount < 0) {
            throw new Error("El contador de coincidencias no puede ser negativo");
        }
        if (this.props.unmatchedCount < 0) {
            throw new Error("El contador de no coincidencias no puede ser negativo");
        }
    }
    assertOpen(message) {
        if (CLOSED_STATUSES.has(this.props.status)) {
            throw new Error(message ?? "No se puede modificar un lote de conciliación cerrado");
        }
    }
    assertNotOpen(message) {
        if (this.props.status === "OPEN") {
            throw new Error(message ?? "El lote debe estar en procesamiento para esta operación");
        }
    }
    computeStatus(totalMatched, totalUnmatched) {
        if (totalMatched === 0 && totalUnmatched === 0)
            return "IN_PROGRESS";
        if (totalUnmatched > 0)
            return "PARTIALLY_MATCHED";
        return "MATCHED";
    }
    startProcessing() {
        if (!OPEN_STATUSES.has(this.props.status)) {
            throw new Error(`No se puede iniciar procesamiento desde estado "${this.props.status}"`);
        }
        return new ReconciliationBatch({
            ...this.props,
            status: "IN_PROGRESS",
        });
    }
    addMatch(count) {
        this.assertOpen("No se puede agregar coincidencias a un lote cerrado");
        this.assertNotOpen("El lote debe iniciar procesamiento antes de agregar coincidencias");
        if (count <= 0) {
            throw new Error("El conteo de coincidencias debe ser positivo");
        }
        const newMatched = this.props.matchedCount + count;
        return new ReconciliationBatch({
            ...this.props,
            matchedCount: newMatched,
            status: this.computeStatus(newMatched, this.props.unmatchedCount),
        });
    }
    addUnmatched(count) {
        this.assertOpen("No se puede agregar no-coincidencias a un lote cerrado");
        this.assertNotOpen("El lote debe iniciar procesamiento antes de agregar no-coincidencias");
        if (count <= 0) {
            throw new Error("El conteo de no-coincidencias debe ser positivo");
        }
        const newUnmatched = this.props.unmatchedCount + count;
        return new ReconciliationBatch({
            ...this.props,
            unmatchedCount: newUnmatched,
            status: this.computeStatus(this.props.matchedCount, newUnmatched),
        });
    }
    close(closingBalance) {
        if (CLOSED_STATUSES.has(this.props.status)) {
            throw new Error("El lote ya está cerrado");
        }
        if (this.props.status === "OPEN" || this.props.status === "IN_PROGRESS") {
        }
        const discrepancy = this.calculateDiscrepancyInternal(closingBalance);
        const finalStatus = this.props.unmatchedCount > 0 ||
            (discrepancy !== null && !discrepancy.isZero())
            ? "CLOSED_WITH_DISCREPANCY"
            : "CLOSED";
        return new ReconciliationBatch({
            ...this.props,
            status: finalStatus,
            closingBalance,
            discrepancyAmount: discrepancy,
            closedAt: new Date(),
        });
    }
    calculateDiscrepancy(closingBalance, totalCredits, totalDebits) {
        const currency = this.props.openingBalance.getCurrency();
        if (closingBalance.getCurrency() !== currency) {
            throw new Error(`El balance de cierre debe estar en ${currency}`);
        }
        if (totalCredits.getCurrency() !== currency) {
            throw new Error(`Los créditos totales deben estar en ${currency}`);
        }
        if (totalDebits.getCurrency() !== currency) {
            throw new Error(`Los débitos totales deben estar en ${currency}`);
        }
        const netMovement = totalCredits.subtract(totalDebits);
        const expectedClosing = this.props.openingBalance.add(netMovement);
        const closingCents = closingBalance.getCents();
        const expectedCents = expectedClosing.getCents();
        const discrepancyCents = closingCents - expectedCents;
        return Money.fromCents(discrepancyCents, currency);
    }
    calculateDiscrepancyInternal(closingBalance) {
        if (closingBalance.getCurrency() !== this.props.openingBalance.getCurrency()) {
            throw new Error(`El balance de cierre debe estar en ${this.props.openingBalance.getCurrency()}`);
        }
        try {
            return closingBalance.subtract(this.props.openingBalance);
        }
        catch {
            const openingCents = this.props.openingBalance.getCents();
            const closingCents = closingBalance.getCents();
            return Money.fromCents(closingCents - openingCents, this.props.openingBalance.getCurrency());
        }
    }
    get id() {
        return this.props.id;
    }
    get companyId() {
        return this.props.companyId;
    }
    get bankAccountId() {
        return this.props.bankAccountId;
    }
    get periodStart() {
        return this.props.periodStart;
    }
    get periodEnd() {
        return this.props.periodEnd;
    }
    get status() {
        return this.props.status;
    }
    get openingBalance() {
        return this.props.openingBalance;
    }
    get closingBalance() {
        return this.props.closingBalance;
    }
    get matchedCount() {
        return this.props.matchedCount;
    }
    get unmatchedCount() {
        return this.props.unmatchedCount;
    }
    get discrepancyAmount() {
        return this.props.discrepancyAmount;
    }
    get mode() {
        return this.props.mode;
    }
    get createdAt() {
        return this.props.createdAt;
    }
    get closedAt() {
        return this.props.closedAt;
    }
    toJSON() {
        return {
            id: this.props.id,
            companyId: this.props.companyId,
            bankAccountId: this.props.bankAccountId,
            periodStart: this.props.periodStart.toISOString(),
            periodEnd: this.props.periodEnd.toISOString(),
            status: this.props.status,
            openingBalance: this.props.openingBalance.toJSON(),
            closingBalance: this.props.closingBalance?.toJSON() ?? null,
            matchedCount: this.props.matchedCount,
            unmatchedCount: this.props.unmatchedCount,
            discrepancyAmount: this.props.discrepancyAmount?.toJSON() ?? null,
            mode: this.props.mode,
            createdAt: this.props.createdAt.toISOString(),
            closedAt: this.props.closedAt?.toISOString() ?? null,
        };
    }
}
//# sourceMappingURL=ReconciliationBatch.js.map