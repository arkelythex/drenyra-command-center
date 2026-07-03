import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as api from "../api";

export function useEvidenceList(filters?: api.EvidenceSearchFilters) {
	return useQuery({
		queryKey: api.evidenceKeys.list(filters),
		queryFn: () => api.searchEvidence(filters ?? {}),
		staleTime: 30_000,
	});
}

export function useEvidenceDetail(id: string) {
	return useQuery({
		queryKey: api.evidenceKeys.detail(id),
		queryFn: () => api.getEvidenceDetail(id),
		enabled: !!id,
	});
}

export function useValidateEvidence() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (id: string) => api.validateEvidence(id),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: api.evidenceKeys.lists(),
			});
			queryClient.invalidateQueries({
				queryKey: api.evidenceKeys.details(),
			});
		},
	});
}

export function useBatchValidate() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (ids: string[]) => api.batchValidate(ids),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: api.evidenceKeys.lists(),
			});
		},
	});
}

export function useLinkEvidence() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (body: {
			evidenceId: string;
			entityType: string;
			entityId: string;
			relationship?: string;
		}) => api.linkEvidence(body),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: api.evidenceKeys.details(),
			});
			queryClient.invalidateQueries({
				queryKey: api.evidenceKeys.lists(),
			});
		},
	});
}

export function useLineage(entityType: string, entityId: string) {
	return useQuery({
		queryKey: api.evidenceKeys.lineage(entityType, entityId),
		queryFn: () => api.getLineage(entityType, entityId),
		enabled: !!entityType && !!entityId,
	});
}
