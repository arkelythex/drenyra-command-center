/**
 * Payroll Hooks - Type-safe with Eden Treaty
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { safeApiCall } from "@/lib/api-factory";
import { unwrap } from "@/lib/api-helpers";
import { useActiveCompanyContext } from "@/lib/use-active-company-context";
import { payrollTreatyClient } from "../api/payroll-treaty-client";

export function useEmployees() {
	const { companyContext } = useActiveCompanyContext();
	const companyId = companyContext.companyId;

	return useQuery({
		queryKey: ["employees", companyId],
		queryFn: async () => {
			const result = await safeApiCall(async () => {
				return unwrap(
					payrollTreatyClient.employees.get({
						query: { companyId },
					}),
				);
			});
			if (!result.ok) throw new Error(result.error);
			return result.data;
		},
	});
}

export function useCalculatePayroll(employeeId: string, period: string) {
	return useQuery({
		queryKey: ["payroll", "calculate", employeeId, period],
		queryFn: async () => {
			const result = await safeApiCall(async () => {
				return unwrap(
					payrollTreatyClient.calculate({ employeeId }).get({
						query: { period },
					}),
				);
			});
			if (!result.ok) throw new Error(result.error);
			return result.data;
		},
	});
}

export function useProcessPayroll() {
	const queryClient = useQueryClient();
	const { companyContext } = useActiveCompanyContext();
	const companyId = companyContext.companyId;

	return useMutation({
		mutationFn: async (period: string) => {
			const result = await safeApiCall(async () => {
				return unwrap(
					payrollTreatyClient.process.post({
						companyId,
						period,
					}),
				);
			});
			if (!result.ok) throw new Error(result.error);
			return result.data;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["payroll"] });
		},
	});
}
