import type { AccountBalance, BalanceReportDataSource, LedgerEntry, LedgerReportDataSource, OpeningBalanceDataSource, OrganizationReportDataSource } from "@drenyra/application/services/FinancialReportsService";
export declare class PostgresReportDataSource implements BalanceReportDataSource, LedgerReportDataSource, OrganizationReportDataSource, OpeningBalanceDataSource {
    getAccountBalances(organizationId: number, startDate: Date, endDate: Date): Promise<{
        accounts: AccountBalance[];
        totals: {
            totalDebit: number;
            totalCredit: number;
        };
    }>;
    getMaterializedAccountBalances(_organizationId: number, _year: number, _month: number): Promise<{
        accounts: AccountBalance[];
        totals: {
            totalDebit: number;
            totalCredit: number;
        };
    } | null>;
    getLedgerEntries(organizationId: number, accountCode: string, startDate: Date, endDate: Date): Promise<LedgerEntry[]>;
    getOrganizationInfo(organizationId: number): Promise<{
        name: string;
        ruc: string;
    }>;
    getOpeningBalance(organizationId: number, accountCode: string, beforeDate: Date): Promise<number>;
    private getAccountNature;
}
//# sourceMappingURL=PostgresReportDataSource.d.ts.map