import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as automationsApi from "../automations.api";

export function useAutomations(filters?: Record<string, unknown>) {
	return useQuery({
		queryKey: automationsApi.automationKeys.list(filters),
		queryFn: () => automationsApi.listAutomations(),
		staleTime: 30_000,
	});
}

export function useAutomationDetail(id: string) {
	return useQuery({
		queryKey: automationsApi.automationKeys.detail(id),
		queryFn: () => automationsApi.getAutomationDetail(id),
		enabled: !!id,
	});
}

export function useCreateAutomation() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (body: automationsApi.CreateAutomationBody) =>
			automationsApi.createAutomation(body),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: automationsApi.automationKeys.lists(),
			});
		},
	});
}

export function useToggleAutomation() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({ id, active }: { id: string; active: boolean }) =>
			automationsApi.toggleAutomation(id, active),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: automationsApi.automationKeys.lists(),
			});
		},
	});
}

export function useAutomationLogs(id: string) {
	return useQuery({
		queryKey: automationsApi.automationKeys.logs(id),
		queryFn: () => automationsApi.getAutomationLogs(id),
		enabled: !!id,
	});
}

export function useRunAutomation() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (id: string) => automationsApi.runAutomation(id),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: automationsApi.automationKeys.lists(),
			});
		},
	});
}
