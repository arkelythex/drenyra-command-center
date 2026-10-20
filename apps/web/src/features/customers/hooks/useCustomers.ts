import { useQuery } from "@tanstack/react-query";
import { useActiveCompanyContext } from "@/lib/use-active-company-context";
import { type CustomerRecord, customersApi } from "../api/customers.api";

export const customerKeys = {
	list: (companyId: string) => ["customers", companyId] as const,
};

/** Customers of the active company; idle while no company is selected. */
export function useCustomers() {
	const { companyContext } = useActiveCompanyContext();
	const companyId = companyContext?.companyId ?? "";
	return useQuery<CustomerRecord[]>({
		queryKey: customerKeys.list(companyId),
		queryFn: () => customersApi.list({ companyId }),
		enabled: companyId !== "",
	});
}
