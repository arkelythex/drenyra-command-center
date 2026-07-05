import { createFileRoute, redirect } from "@tanstack/react-router";

/** Canonical home: redirect to the Drenyra workspace. */
export const Route = createFileRoute("/")({
	beforeLoad: () => {
		throw redirect({ to: "/drenyra" });
	},
});
