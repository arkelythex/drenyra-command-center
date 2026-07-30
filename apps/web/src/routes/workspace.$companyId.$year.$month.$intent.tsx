import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute(
	"/workspace/$companyId/$year/$month/$intent",
)({
	component: () => (
		<div className="flex items-center justify-center h-full">
			<div className="text-center">
				<h1 className="text-2xl font-bold text-primary">Drenyra Workspace</h1>
				<p className="text-muted-foreground mt-2">FSD Accounting Workspace</p>
			</div>
		</div>
	),
});
