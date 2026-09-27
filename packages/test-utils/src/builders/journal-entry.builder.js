import { JournalEntry, JournalLine, } from "@drenyra/domain/entities/JournalEntry";
import { Money } from "@drenyra/domain/value-objects/Money";
import { BaseBuilder } from "./base.builder";
const DEFAULT_ENTRY_ID = "je_test_001";
const DEFAULT_ORGANIZATION_ID = 1;
const DEFAULT_ENTRY_NUMBER = "001-2026";
const DEFAULT_GLOSS = "Asiento contable de prueba";
const DEFAULT_STATUS = "borrador";
const DEFAULT_CURRENCY = "PEN";
export class JournalEntryBuilder extends BaseBuilder {
    linesData = [];
    lineCounter = 0;
    constructor() {
        const today = new Date();
        today.setHours(today.getHours() - 1);
        super({
            id: DEFAULT_ENTRY_ID,
            organizationId: DEFAULT_ORGANIZATION_ID,
            entryNumber: DEFAULT_ENTRY_NUMBER,
            date: today,
            gloss: DEFAULT_GLOSS,
            status: DEFAULT_STATUS,
            lines: [],
            createdAt: today,
            updatedAt: today,
        });
    }
    withDebit(accountCode, amount, currency = DEFAULT_CURRENCY) {
        this.lineCounter++;
        this.linesData.push({
            accountCode,
            accountName: `Cuenta ${accountCode}`,
            description: `Cargo ${this.lineCounter}`,
            amount,
            currency,
            type: "debit",
        });
        return this;
    }
    withCredit(accountCode, amount, currency = DEFAULT_CURRENCY) {
        this.lineCounter++;
        this.linesData.push({
            accountCode,
            accountName: `Cuenta ${accountCode}`,
            description: `Abono ${this.lineCounter}`,
            amount,
            currency,
            type: "credit",
        });
        return this;
    }
    withDate(date) {
        return this.set({ date });
    }
    withDescription(description) {
        return this.set({ gloss: description });
    }
    withReference(reference) {
        return this.set({ entryNumber: reference });
    }
    withOrganizationId(orgId) {
        return this.set({ organizationId: orgId });
    }
    withStatus(status) {
        return this.set({ status });
    }
    withAccountName(accountCode, name) {
        const line = this.linesData.find((l) => l.accountCode === accountCode);
        if (line) {
            line.accountName = name;
        }
        return this;
    }
    build() {
        if (this.linesData.length === 0) {
            this.withDebit("1041", 1000);
            this.withCredit("7011", 1000);
        }
        const totalDebits = this.linesData
            .filter((l) => l.type === "debit")
            .reduce((sum, l) => sum + l.amount, 0);
        const totalCredits = this.linesData
            .filter((l) => l.type === "credit")
            .reduce((sum, l) => sum + l.amount, 0);
        if (Math.abs(totalDebits - totalCredits) > 0.001) {
            throw new Error(`El asiento debe estar balanceado. Debe: ${totalDebits}, Haber: ${totalCredits}`);
        }
        const currencies = [...new Set(this.linesData.map((l) => l.currency))];
        if (currencies.length > 1) {
            throw new Error(`Todos los asientos deben usar la misma moneda. Encontradas: ${currencies.join(", ")}`);
        }
        const today = new Date();
        const lines = this.linesData.map((ld, index) => JournalLine.create({
            id: `je_line_${index + 1}`,
            accountId: ld.accountCode,
            accountCode: ld.accountCode,
            accountName: ld.accountName ?? `Cuenta ${ld.accountCode}`,
            description: ld.description ?? `Línea ${index + 1}`,
            debit: ld.type === "debit"
                ? Money.fromAmount(ld.amount, ld.currency)
                : Money.zero(ld.currency),
            credit: ld.type === "credit"
                ? Money.fromAmount(ld.amount, ld.currency)
                : Money.zero(ld.currency),
        }));
        const entryDate = this.data.date ?? today;
        if (entryDate > new Date()) {
            const adjustedDate = new Date();
            adjustedDate.setHours(adjustedDate.getHours() - 1);
            return this.set({ date: adjustedDate }).build();
        }
        const props = {
            id: this.data.id ?? DEFAULT_ENTRY_ID,
            organizationId: this.data.organizationId ?? DEFAULT_ORGANIZATION_ID,
            entryNumber: this.data.entryNumber ?? DEFAULT_ENTRY_NUMBER,
            date: entryDate,
            gloss: this.data.gloss ?? DEFAULT_GLOSS,
            status: this.data.status ?? DEFAULT_STATUS,
            lines,
            postedBy: this.data.postedBy,
            postedAt: this.data.postedAt,
            createdAt: this.data.createdAt ?? today,
            updatedAt: this.data.updatedAt ?? today,
        };
        return JournalEntry.create(props);
    }
}
//# sourceMappingURL=journal-entry.builder.js.map