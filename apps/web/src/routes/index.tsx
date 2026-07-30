import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
	component: () => (
		<div className="flex items-center justify-center h-full">
			<div className="text-center">
				<h1 className="text-2xl font-bold text-primary">Drenyra</h1>
				<p className="text-muted-foreground mt-2">
					Verifiable Financial Operating System
				</p>
			</div>
		</div>
	),
});
