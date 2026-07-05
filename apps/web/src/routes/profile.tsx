import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/profile")({
	loader: () => {
		throw redirect({ to: "/configuracion/profile" });
	},
});
