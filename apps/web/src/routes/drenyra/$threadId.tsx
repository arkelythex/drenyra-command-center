import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/drenyra/$threadId")({
	loader: ({ params }) => {
		throw redirect({ to: "/drenyra/case/$threadId", params });
	},
});
