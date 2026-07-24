import { useQuery } from "@tanstack/react-query";
import { repoHealthQueryOptions } from "../repo-health.query-options";

interface MergeHealthItem {
	number: number;
	title: string;
	state: string;
	updatedAt: string;
	labels: string[];
}

interface AutoSddItem {
	number: number;
	title: string;
	state: string;
	createdAt: string;
}

interface RepoHealthData {
	mergeHealth: MergeHealthItem[];
	autoSdd: AutoSddItem[];
}

/**
 * Hook that provides repo health data:
 * - Merge health issues from CI verification
 * - Auto-SDD proposals
 * - Overall health score
 */
export function useRepoHealth() {
	const { data, isLoading, error } = useQuery(repoHealthQueryOptions);

	const healthScore = calculateHealthScore(data);

	return {
		mergeHealthIssues: data?.mergeHealth ?? ([] as MergeHealthItem[]),
		autoSddProposals: data?.autoSdd ?? ([] as AutoSddItem[]),
		healthScore,
		isLoading,
		error,
	};
}

function calculateHealthScore(data: RepoHealthData | undefined): {
	score: number;
	label: string;
	color: string;
} {
	if (!data) {
		return { score: 0, label: "Sin datos", color: "text-gray-500" };
	}
	const openMergeIssues = data.mergeHealth.filter(
		(i) => i.state === "open",
	).length;
	const totalMergeIssues = data.mergeHealth.length;

	if (totalMergeIssues === 0) {
		return { score: 100, label: "Excelente", color: "text-green-500" };
	}

	const ratio = 1 - openMergeIssues / Math.max(totalMergeIssues, 1);
	const score = Math.round(ratio * 100);

	if (score >= 90)
		return { score, label: "Saludable", color: "text-green-500" };
	if (score >= 70) return { score, label: "Estable", color: "text-yellow-500" };
	if (score >= 50)
		return { score, label: "Atención", color: "text-orange-500" };
	return { score, label: "Crítico", color: "text-red-500" };
}
