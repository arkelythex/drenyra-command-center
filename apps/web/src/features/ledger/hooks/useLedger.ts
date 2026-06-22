/**
 * Ledger Hooks - Type-safe with Eden Treaty
 *
 * Delegates to canonical queryOptions from api/query-options.ts
 * to avoid duplicating queryFn logic.
 */

import { useQuery } from "@tanstack/react-query";
import { useActiveCompanyContext } from "@/lib/use-active-company-context";
import { toLedgerPeriodQueryKeys } from "../lib/ledger-view-model";
import {
	chartOfAccountsQueryOptions,
	generalLedgerQueryOptions,
	trialBalanceQueryOptions,
} from "../api/query-options";

function useLedgerCompanyId(): string {
	const { companyContext } = useActiveCompanyContext();
	return companyContext.companyId?.trim() ?? "";
}

export function useChartOfAccounts() {
	const companyId = useLedgerCompanyId();
	return useQuery(chartOfAccountsQueryOptions(companyId));
}

export function useGeneralLedger(startDate: Date, endDate: Date) {
	const companyId = useLedgerCompanyId();
	const { startKey, endKey } = toLedgerPeriodQueryKeys(startDate, endDate);
	return useQuery(generalLedgerQueryOptions(companyId, startDate, endDate, startKey, endKey));
}

export function useTrialBalance(asOfDate: Date) {
	const companyId = useLedgerCompanyId();
	const asOfKey = asOfDate.toISOString().slice(0, 10);
	return useQuery(trialBalanceQueryOptions(companyId, asOfDate, asOfKey));
}
