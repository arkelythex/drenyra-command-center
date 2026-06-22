import { useCallback, useEffect, useMemo, useState } from "react";
import { useActiveCompanyContext } from "@/lib/use-active-company-context";
import type { LedgerTransaction } from "../components/ledger-view/ledger-data";
import { LEDGER_ALL_ACCOUNTS_ID, isLedgerAllAccountsId } from "../lib/ledger-constants";
import {
	buildLedgerSidebarAccounts,
	filterTransactionsByCategoryName,
	getCalendarMonthBounds,
	mapChartRowsToSidebarAccounts,
	mapGeneralLedgerRowsToTransactions,
} from "../lib/ledger-view-model";
import { useChartOfAccounts, useGeneralLedger } from "./useLedger";

function ledgerErrorMessage(err: unknown): string {
	if (err instanceof Error) return err.message;
	return "Error al cargar el libro mayor";
}

export function useLedgerViewModel() {
	const { companyContext } = useActiveCompanyContext();
	const companyId = companyContext.companyId;

	const period = useMemo(() => getCalendarMonthBounds(), []);

	const chart = useChartOfAccounts();
	const gl = useGeneralLedger(period.start, period.end);

	const accounts = useMemo(() => mapChartRowsToSidebarAccounts(chart.data), [chart.data]);
	const sidebarAccounts = useMemo(() => buildLedgerSidebarAccounts(accounts), [accounts]);

	const [selectedAccountId, setSelectedAccountId] = useState<string>(LEDGER_ALL_ACCOUNTS_ID);

	useEffect(() => {
		setSelectedAccountId(LEDGER_ALL_ACCOUNTS_ID);
	}, [companyId]);

	useEffect(() => {
		if (sidebarAccounts.length === 0) return;
		setSelectedAccountId((prev) => {
			if (sidebarAccounts.some((a) => a.id === prev)) return prev;
			return LEDGER_ALL_ACCOUNTS_ID;
		});
	}, [sidebarAccounts]);

	const selectedCategoryName = useMemo(() => {
		if (isLedgerAllAccountsId(selectedAccountId)) return null;
		return accounts.find((a) => a.id === selectedAccountId)?.name ?? null;
	}, [accounts, selectedAccountId]);

	const transactions: LedgerTransaction[] = useMemo(() => {
		const raw = mapGeneralLedgerRowsToTransactions(gl.data);
		return filterTransactionsByCategoryName(raw, selectedCategoryName);
	}, [gl.data, selectedCategoryName]);

	const periodLabel = useMemo(
		() =>
			new Intl.DateTimeFormat("es-PE", { month: "long", year: "numeric" }).format(period.start),
		[period.start],
	);

	const chartFailed = chart.isError;
	const glFailed = gl.isError;
	const fatalError = chartFailed;
	const glOnlyError = !chartFailed && glFailed;

	const chartErrorText = chartFailed ? ledgerErrorMessage(chart.error) : null;
	const glErrorText = glFailed ? ledgerErrorMessage(gl.error) : null;

	const isChartLoading = chart.isPending;
	const isGlLoading = gl.isPending && !chartFailed;

	const selectAccount = useCallback((id: string) => {
		setSelectedAccountId(id);
	}, []);

	return {
		sidebarAccounts,
		selectedAccountId,
		selectAccount,
		transactions,
		periodLabel,
		isChartLoading,
		isGlLoading,
		fatalError,
		glOnlyError,
		chartErrorText,
		glErrorText,
		/** Sidebar puede mostrar cuentas reales */
		hasAccounts: accounts.length > 0,
	};
}
