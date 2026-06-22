import { toast } from "sonner";
import { presentError } from "@/lib/error-messages";

import { AccountCard, AccountSummary, AddAccountModal } from "./accounts";
import type { BankAccount } from "../stores/banking.store.types";
import { useDeleteAccountMutation } from "../hooks/useBankingQueries";
import { useBankingSelection } from "../stores/banking.store";

interface BankAccountsPanelProps {
	accounts: BankAccount[];
	selectedAccountId: string | null;
	unreconciledCount: number;
	onSelect: (id: string) => void;
}

export const BankAccountsPanel = ({
	accounts,
	selectedAccountId,
	unreconciledCount,
	onSelect,
}: BankAccountsPanelProps) => {
	const deleteAccountMutation = useDeleteAccountMutation();
	const { clearSelectedAccount } = useBankingSelection();

	let pen = 0;
	let usd = 0;
	for (const account of accounts) {
		const balance = Number(account.currentBalance ?? "0");
		if (account.currency === "USD") usd += balance;
		else pen += balance;
	}

	const summary = {
		totalAccounts: accounts.length,
		totalBalancePEN: pen.toFixed(2),
		totalBalanceUSD: usd.toFixed(2),
	};

	const onDelete = async (id: string) => {
		try {
			await deleteAccountMutation.mutateAsync(id);
			if (selectedAccountId === id) {
				clearSelectedAccount();
			}
			toast.success("Cuenta eliminada");
		} catch (error) {
			const presentation = presentError(error, "No se pudo eliminar la cuenta");
			toast.error(presentation.title, {
				description: presentation.description,
			});
		}
	};

	return (
		<div className="space-y-5">
			<div className="flex items-center justify-between">
				<div />
				<AddAccountModal />
			</div>

			<AccountSummary
				totalBalancePEN={summary.totalBalancePEN}
				totalBalanceUSD={summary.totalBalanceUSD}
				unreconciledCount={unreconciledCount}
				totalAccounts={summary.totalAccounts}
			/>

			<div className="space-y-2">
				{accounts.map((account) => (
					<AccountCard
						key={account.id}
						account={account}
						isSelected={selectedAccountId === account.id}
						onSelect={onSelect}
						onDelete={onDelete}
					/>
				))}
				{accounts.length === 0 && (
					<div className="text-sm text-[var(--text-tertiary)] px-2 py-6 text-center">
						No hay cuentas aún. Crea una para empezar.
					</div>
				)}
			</div>
		</div>
	);
};
