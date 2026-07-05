import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as skillsApi from "../skills.api";

export function useSkills() {
	return useQuery({
		queryKey: skillsApi.skillKeys.lists(),
		queryFn: () => skillsApi.listSkills(),
		staleTime: 60_000,
	});
}

export function useSkillDetail(id: string) {
	return useQuery({
		queryKey: skillsApi.skillKeys.detail(id),
		queryFn: () => skillsApi.getSkillDetail(id),
		enabled: !!id,
	});
}

export function useInstalledSkills() {
	return useQuery({
		queryKey: skillsApi.skillKeys.installed(),
		queryFn: () => skillsApi.listInstalledSkills(),
		staleTime: 30_000,
	});
}

export function useInstallSkill() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (id: string) => skillsApi.installSkill(id),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: skillsApi.skillKeys.lists() });
			queryClient.invalidateQueries({
				queryKey: skillsApi.skillKeys.installed(),
			});
		},
	});
}

export function useUninstallSkill() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (id: string) => skillsApi.uninstallSkillApi(id),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: skillsApi.skillKeys.lists() });
			queryClient.invalidateQueries({
				queryKey: skillsApi.skillKeys.installed(),
			});
		},
	});
}

export function useUpdateSkillConfig() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({
			id,
			config,
		}: {
			id: string;
			config: Record<string, unknown>;
		}) => skillsApi.updateSkillConfig(id, config),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: skillsApi.skillKeys.installed(),
			});
		},
	});
}
