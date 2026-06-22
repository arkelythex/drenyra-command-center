import { Money } from "@arkelythex/domain";
import type { Currency } from "@arkelythex/domain/value-objects/Money";
import type { IBankingRepository } from "../../domain/ports/banking-repository.port";
import { bankingRepository } from "../../infrastructure/banking.repository";

export interface GetBankingSummaryInput {
	companyId: string;
}

export interface BankingSummaryResult {
	totalAccounts: number;
	totalBalancePEN: string;
	totalBalanceUSD: string;
	totalBalance: string;
	unreconciledTransactions: number;
}

export async function getBankingSummary(
	input: GetBankingSummaryInput,
): Promise<BankingSummaryResult> {
	const accounts = await bankingRepository.findAllAccounts(input.companyId);

	let totalBalancePEN = Money.zero("PEN");
	let totalBalanceUSD = Money.zero("USD");

	for (const account of accounts) {
		if (!account.isActive) continue;

		const currency = toCurrency(account.currency);
		const balance = Money.fromAmount(Number(account.currentBalance), currency);

		if (currency === "PEN") {
			totalBalancePEN = totalBalancePEN.add(balance);
		} else if (currency === "USD") {
			totalBalanceUSD = totalBalanceUSD.add(balance);
		}
	}

	const unreconciledTransactions = await bankingRepository.countUnreconciled(
		input.companyId,
	);
	const totalBalancePENStr = totalBalancePEN.getAmount().toFixed(2);

	return {
		totalAccounts: accounts.filter((a) => a.isActive).length,
		totalBalancePEN: totalBalancePENStr,
		totalBalanceUSD: totalBalanceUSD.getAmount().toFixed(2),
		totalBalance: totalBalancePENStr,
		unreconciledTransactions,
	};
}

function toCurrency(value: string | null | undefined): Currency {
	return value === "USD" ? "USD" : "PEN";
}
