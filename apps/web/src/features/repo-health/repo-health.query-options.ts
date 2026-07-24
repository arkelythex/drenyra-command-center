import { queryOptions } from "@tanstack/react-query";
import { repoHealthKeys } from "./repo-health.query-keys";

/** Fetch merge health issues via GitHub API */
async function fetchMergeHealthIssues(): Promise<
	Array<{
		number: number;
		title: string;
		state: string;
		updatedAt: string;
		labels: string[];
	}>
> {
	const response = await fetch(
		"https://api.github.com/repos/arkelythex/Drenyra/issues?labels=merge-health&state=all&per_page=10",
		{
			headers: {
				Accept: "application/vnd.github.v3+json",
			},
		},
	);
	if (!response.ok) return [];
	const data = await response.json();
	return data.map(
		(issue: {
			number: number;
			title: string;
			state: string;
			updated_at: string;
			labels: Array<{ name: string }>;
		}) => ({
			number: issue.number,
			title: issue.title,
			state: issue.state,
			updatedAt: issue.updated_at,
			labels: issue.labels.map((l: { name: string }) => l.name),
		}),
	);
}

/** Fetch auto-generated SDD proposals */
async function fetchAutoSddProposals(): Promise<
	Array<{
		number: number;
		title: string;
		state: string;
		createdAt: string;
	}>
> {
	const response = await fetch(
		"https://api.github.com/repos/arkelythex/Drenyra/issues?labels=auto-generated&state=all&per_page=10",
		{
			headers: {
				Accept: "application/vnd.github.v3+json",
			},
		},
	);
	if (!response.ok) return [];
	const data = await response.json();
	return data.map(
		(issue: {
			number: number;
			title: string;
			state: string;
			created_at: string;
		}) => ({
			number: issue.number,
			title: issue.title,
			state: issue.state,
			createdAt: issue.created_at,
		}),
	);
}

export const mergeHealthIssuesQueryOptions = queryOptions({
	queryKey: repoHealthKeys.mergeHealth(),
	queryFn: fetchMergeHealthIssues,
	staleTime: 5 * 60 * 1000, // 5 min
});

export const autoSddProposalsQueryOptions = queryOptions({
	queryKey: repoHealthKeys.autoSdd(),
	queryFn: fetchAutoSddProposals,
	staleTime: 5 * 60 * 1000,
});

export const repoHealthQueryOptions = queryOptions({
	queryKey: repoHealthKeys.overview(),
	queryFn: async () => {
		const [mergeHealth, autoSdd] = await Promise.all([
			fetchMergeHealthIssues(),
			fetchAutoSddProposals(),
		]);
		return { mergeHealth, autoSdd };
	},
	staleTime: 5 * 60 * 1000,
});
