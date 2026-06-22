import { createFileRoute, redirect } from "@tanstack/react-router";

/** Legacy combined auth shell — canonical entry is `/login` and `/signup`. */
export const Route = createFileRoute("/auth")({
	beforeLoad: () => {
		throw redirect({ to: "/login" });
	},
});
