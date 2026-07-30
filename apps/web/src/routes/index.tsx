import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
	loader: () => {
		throw redirect({
			to: "/workspace/$companyId/$year/$month/$intent",
			params: { companyId: "1", year: "2026", month: "3", intent: "close" },
		});
	},
});
