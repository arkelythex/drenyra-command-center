import { Transaction } from "@drenyra/domain/entities/Transaction";
import { Money } from "@drenyra/domain/value-objects/Money";
import { BaseBuilder } from "./base.builder";
const DEFAULT_TRANSACTION_ID = "tx_test_001";
const DEFAULT_TYPE = "SALE";
const DEFAULT_CURRENCY = "PEN";
export class TransactionBuilder extends BaseBuilder {
    entries = [];
    constructor() {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        super({
            id: DEFAULT_TRANSACTION_ID,
            type: DEFAULT_TYPE,
            date: yesterday,
            description: "Transacción contable de prueba",
            status: "DRAFT",
            entries: [],
            createdAt: yesterday,
            updatedAt: yesterday,
        });
    }
    withId(id) {
        return this.set({ id });
    }
    withType(type) {
        return this.set({ type });
    }
    withDate(date) {
        return this.set({ date });
    }
    withDescription(description) {
        return this.set({ description });
    }
    withReferenceNumber(ref) {
        return this.set({ referenceNumber: ref });
    }
    withStatus(status) {
        return this.set({ status });
    }
    withEntry(accountCode, accountName, amount, side, currency = DEFAULT_CURRENCY) {
        const moneyAmount = Money.fromAmount(amount, currency);
        const entry = {
            id: `entry_test_${this.entries.length + 1}`,
            accountCode,
            accountName,
            debit: side === "debit" ? moneyAmount : Money.zero(currency),
            credit: side === "credit" ? moneyAmount : Money.zero(currency),
            description: `Asiento ${this.entries.length + 1}`,
        };
        this.entries.push(entry);
        return this.set({ entries: this.entries });
    }
    withEntries(entries) {
        this.entries = entries;
        return this.set({ entries });
    }
    withPostedAt(date, postedBy) {
        return this.set({ postedAt: date, postedBy });
    }
    build() {
        if (this.entries.length === 0) {
            this.withEntry("1041", "Caja Soles", 1000, "debit");
            this.withEntry("7011", "Ventas", 1000, "credit");
        }
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const props = {
            id: this.data.id ?? DEFAULT_TRANSACTION_ID,
            type: this.data.type ?? DEFAULT_TYPE,
            date: this.data.date ?? yesterday,
            description: this.data.description ?? "Transacción contable de prueba",
            status: this.data.status ?? "DRAFT",
            entries: this.entries,
            createdAt: this.data.createdAt ?? yesterday,
            updatedAt: this.data.updatedAt ?? yesterday,
            referenceNumber: this.data.referenceNumber,
            postedAt: this.data.postedAt,
            postedBy: this.data.postedBy,
        };
        return Transaction.create(props);
    }
}
//# sourceMappingURL=transaction.builder.js.map