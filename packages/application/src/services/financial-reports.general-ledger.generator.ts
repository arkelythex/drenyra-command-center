/**
 * General Ledger Report Generator — generates Libro Mayor.
 */
import type {
	GeneralLedgerReport,
	LedgerEntry,
	ReportPeriod,
} from "./financial-reports.types";

interface LedgerEntryWithAccount extends LedgerEntry {
	accountCode: string;
	accountName: string;
}

export class GeneralLedgerGenerator {
	static generate(
		orgInfo: { name: string; ruc: string },
		entries: LedgerEntryWithAccount[],
		period: ReportPeriod,
	): GeneralLedgerReport {
		const byAccount = new Map<string, LedgerEntry[]>();
		const accountNames = new Map<string, string>();

		for (const entry of entries) {
			accountNames.set(entry.accountCode, entry.accountName);
			const { accountCode: _ac, accountName: _an, ...ledgerEntry } = entry;
			const existing = byAccount.get(entry.accountCode) || [];
			existing.push(ledgerEntry);
			byAccount.set(entry.accountCode, existing);
		}

		const accounts = Array.from(byAccount.entries()).map(
			([code, acctEntries]) => {
				const startingBalance =
					acctEntries.length > 0 ? acctEntries[0]!.balance : 0;
				const endingBalance =
					acctEntries.length > 0
						? acctEntries[acctEntries.length - 1]!.balance
						: 0;
				return {
					accountCode: code,
					accountName: accountNames.get(code) || "",
					entries: acctEntries,
					startingBalance,
					endingBalance,
				};
			},
		);

		return {
			period,
			generatedAt: new Date(),
			organizationName: orgInfo.name,
			ruc: orgInfo.ruc,
			accounts,
		};
	}
}
