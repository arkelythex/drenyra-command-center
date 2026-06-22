import { and, asc, eq, gte, lt, lte, sql } from "drizzle-orm";
import { db } from "@arkelythex/persistence/client";
import { journalEntries, journalEntryLines, organizations, pcgeAccounts } from "@arkelythex/persistence/schema";
import { resolveCompanyIdFromOrganization } from "./repositories/support/organization-resolver";
const centsToAmount = (cents) => Math.round(cents) / 100;
export class PostgresReportDataSource {
    async getAccountBalances(organizationId, startDate, endDate) {
        const companyId = await resolveCompanyIdFromOrganization(organizationId);
        const [accountResults, totalsResult] = await Promise.all([
            db
                .select({
                accountCode: journalEntryLines.accountCode,
                accountName: pcgeAccounts.name,
                accountLevel: pcgeAccounts.level,
                totalDebitCents: sql `COALESCE(SUM(${journalEntryLines.debitCents}), 0)`,
                totalCreditCents: sql `COALESCE(SUM(${journalEntryLines.creditCents}), 0)`,
            })
                .from(journalEntryLines)
                .innerJoin(journalEntries, eq(journalEntryLines.journalEntryId, journalEntries.id))
                .leftJoin(pcgeAccounts, and(eq(journalEntryLines.accountCode, pcgeAccounts.code), eq(pcgeAccounts.companyId, companyId)))
                .where(and(eq(journalEntries.companyId, companyId), gte(journalEntries.date, startDate), lte(journalEntries.date, endDate), eq(journalEntries.status, "mayorizado")))
                .groupBy(journalEntryLines.accountCode, pcgeAccounts.name, pcgeAccounts.level)
                .orderBy(asc(journalEntryLines.accountCode)),
            db
                .select({
                totalDebitCents: sql `COALESCE(SUM(${journalEntryLines.debitCents}), 0)`,
                totalCreditCents: sql `COALESCE(SUM(${journalEntryLines.creditCents}), 0)`,
            })
                .from(journalEntryLines)
                .innerJoin(journalEntries, eq(journalEntryLines.journalEntryId, journalEntries.id))
                .where(and(eq(journalEntries.companyId, companyId), gte(journalEntries.date, startDate), lte(journalEntries.date, endDate), eq(journalEntries.status, "mayorizado"))),
        ]);
        const accounts = accountResults.map((row) => {
            const debit = centsToAmount(Number(row.totalDebitCents));
            const credit = centsToAmount(Number(row.totalCreditCents));
            const nature = this.getAccountNature(row.accountCode);
            return {
                accountCode: row.accountCode,
                accountName: row.accountName ?? row.accountCode,
                level: Number(row.accountLevel ?? "1"),
                debit,
                credit,
                balance: nature === "DEBIT" ? debit - credit : credit - debit,
                nature,
            };
        });
        return {
            accounts,
            totals: {
                totalDebit: centsToAmount(Number(totalsResult[0]?.totalDebitCents ?? 0)),
                totalCredit: centsToAmount(Number(totalsResult[0]?.totalCreditCents ?? 0)),
            },
        };
    }
    async getMaterializedAccountBalances(_organizationId, _year, _month) {
        return null;
    }
    async getLedgerEntries(organizationId, accountCode, startDate, endDate) {
        const companyId = await resolveCompanyIdFromOrganization(organizationId);
        const rows = await db
            .select({
            date: journalEntries.date,
            entryNumber: journalEntries.entryNumber,
            description: journalEntryLines.description,
            debitCents: journalEntryLines.debitCents,
            creditCents: journalEntryLines.creditCents,
        })
            .from(journalEntryLines)
            .innerJoin(journalEntries, eq(journalEntryLines.journalEntryId, journalEntries.id))
            .where(and(eq(journalEntries.companyId, companyId), eq(journalEntryLines.accountCode, accountCode), gte(journalEntries.date, startDate), lte(journalEntries.date, endDate), eq(journalEntries.status, "mayorizado")))
            .orderBy(asc(journalEntries.date), asc(journalEntries.entryNumber));
        let runningBalance = await this.getOpeningBalance(organizationId, accountCode, startDate);
        const nature = this.getAccountNature(accountCode);
        return rows.map((row) => {
            const debit = centsToAmount(row.debitCents);
            const credit = centsToAmount(row.creditCents);
            runningBalance += nature === "DEBIT" ? debit - credit : credit - debit;
            return { date: row.date, journalEntryNumber: row.entryNumber, description: row.description, debit, credit, runningBalance };
        });
    }
    async getOrganizationInfo(organizationId) {
        const row = await db.query.organizations.findFirst({ where: eq(organizations.id, organizationId) });
        return { name: row?.businessName ?? "Organización", ruc: row?.ruc ?? "" };
    }
    async getOpeningBalance(organizationId, accountCode, beforeDate) {
        const companyId = await resolveCompanyIdFromOrganization(organizationId);
        const [row] = await db
            .select({ debitCents: sql `COALESCE(SUM(${journalEntryLines.debitCents}), 0)`, creditCents: sql `COALESCE(SUM(${journalEntryLines.creditCents}), 0)` })
            .from(journalEntryLines)
            .innerJoin(journalEntries, eq(journalEntryLines.journalEntryId, journalEntries.id))
            .where(and(eq(journalEntries.companyId, companyId), eq(journalEntryLines.accountCode, accountCode), lt(journalEntries.date, beforeDate), eq(journalEntries.status, "mayorizado")));
        const debit = centsToAmount(Number(row?.debitCents ?? 0));
        const credit = centsToAmount(Number(row?.creditCents ?? 0));
        return this.getAccountNature(accountCode) === "DEBIT" ? debit - credit : credit - debit;
    }
    getAccountNature(accountCode) {
        return ["1", "2", "3", "6", "9"].includes(accountCode.charAt(0)) ? "DEBIT" : "CREDIT";
    }
}
//# sourceMappingURL=PostgresReportDataSource.js.map