import { useSuspenseQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { useActiveCompanyContext } from "@/lib/use-active-company-context";
import { bankingApi } from "../api/banking.api";
import { bankingKeys } from "../api/query-keys";

export interface Account {
	id: string;
	name: string;
	type: "BANK" | "CREDIT" | "DETRACTION";
	currency: "PEN" | "USD";
	bankName: string;
	accountNumber: string;
	currentBalance: number;
	activityCount?: number;
}

export const useBanking = () => {
	const {
		companyContext: { companyId },
	} = useActiveCompanyContext();
	const [selectedAccountId, setSelectedAccountId] = useState<string>("");
	const [searchQuery, setSearchQuery] = useState("");

	// Fetch Accounts from API — no mock fallback
	const { data: apiAccounts = [] } = useSuspenseQuery({
		queryKey: bankingKeys.accounts(companyId),
		queryFn: async () => {
			const list = await bankingApi.getAccounts();
			const accounts = Array.isArray(list) ? list : [];

			return accounts.map((account) => {
				const record = account as {
					id: string;
					accountName?: string;
					accountType?: string;
					currency?: "PEN" | "USD";
					bankName?: string;
					accountNumber?: string;
					currentBalance?: string | number;
				};
				const normalizedType =
					record.accountType === "CREDIT"
						? "CREDIT"
						: record.bankName === "Banco de la Nación" ||
								(record.accountName ?? "").toUpperCase().includes("DETRAC")
							? "DETRACTION"
							: "BANK";

				return {
					id: record.id,
					name: record.accountName ?? "Cuenta bancaria",
					type: normalizedType as Account["type"],
					currency: record.currency ?? "PEN",
					bankName: record.bankName ?? "Banco",
					accountNumber: record.accountNumber ?? "",
					currentBalance: Number(record.currentBalance ?? 0),
					activityCount: 0,
				};
			});
		},
	});

	const accounts = apiAccounts;

	// Auto-select first account when API data loads
	const selectedAccount = useMemo(
		() =>
			accounts.find((a) => a.id === selectedAccountId) || accounts[0] || null,
		[accounts, selectedAccountId],
	);

	const accountsByType = useMemo(
		() => ({
			bank: accounts.filter((a) => a.type === "BANK"),
			detraction: accounts.filter((a) => a.type === "DETRACTION"),
			credit: accounts.filter((a) => a.type === "CREDIT"),
		}),
		[accounts],
	);

	return {
		selectedAccount,
		selectedAccountId,
		setSelectedAccountId,
		accountsByType,
		searchQuery,
		setSearchQuery,
	};
};
