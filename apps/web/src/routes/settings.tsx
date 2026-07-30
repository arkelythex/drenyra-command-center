import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/settings")({
	component: () => (
		<div className="p-6">
			<h1 className="text-xl font-semibold">Settings</h1>
			<p className="text-muted-foreground mt-2">Coming soon</p>
		</div>
	),
});
