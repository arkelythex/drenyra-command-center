import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/taxation")({
	loader: () => {
		throw redirect({ to: "/cumplimiento/taxation" });
	},
});
