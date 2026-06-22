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

export const MOCK_ACCOUNTS: Account[] = [
	{
		id: "acc1",
		name: "BCP Cta. Corriente Soles",
		type: "BANK",
		currency: "PEN",
		bankName: "BCP",
		accountNumber: "191-2233445-0-01",
		currentBalance: 145820.5,
		activityCount: 15,
	},
	{
		id: "acc2",
		name: "BBVA Continental ME",
		type: "BANK",
		currency: "USD",
		bankName: "BBVA",
		accountNumber: "0011-0123-0100045678",
		currentBalance: 45000.0,
		activityCount: 8,
	},
	{
		id: "acc3",
		name: "Detracciones - BN",
		type: "DETRACTION",
		currency: "PEN",
		bankName: "Banco de la Nación",
		accountNumber: "00-068-123456",
		currentBalance: 12500.0,
		activityCount: 4,
	},
	{
		id: "card1",
		name: "Interbank Business",
		type: "CREDIT",
		currency: "PEN",
		bankName: "Interbank",
		accountNumber: "****-9988",
		currentBalance: -5200.0,
		activityCount: 12,
	},
];

export const useBanking = () => {
	const {
		companyContext: { companyId },
	} = useActiveCompanyContext();
	const [selectedAccountId, setSelectedAccountId] = useState<string>(
		MOCK_ACCOUNTS[0].id,
	);
	const [searchQuery, setSearchQuery] = useState("");

	// 1. Fetch Accounts from API
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

	// Combine API + Mock for a rich demo experience
	const accounts = useMemo(() => {
		return apiAccounts.length > 0 ? apiAccounts : MOCK_ACCOUNTS;
	}, [apiAccounts]);

	const selectedAccount = useMemo(
		() => accounts.find((a) => a.id === selectedAccountId) || accounts[0],
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
