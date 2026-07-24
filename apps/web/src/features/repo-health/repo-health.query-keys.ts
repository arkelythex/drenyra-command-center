export const repoHealthKeys = {
	all: ["repo-health"] as const,
	overview: () => [...repoHealthKeys.all, "overview"] as const,
	mergeHealth: () => [...repoHealthKeys.all, "merge-health"] as const,
	autoSdd: () => [...repoHealthKeys.all, "auto-sdd"] as const,
};
